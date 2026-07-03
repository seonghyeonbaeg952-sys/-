import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

const FLUTTER_PAGE_COUNT = 12

const valueWords = [
  { word: '경청', body: '먼저 듣는 마음' },
  { word: '배려', body: '서로의 자리를 살피는 태도' },
  { word: '성실', body: '약속한 시간을 지키는 힘' },
  { word: '책임', body: '내 파트를 준비하는 마음' },
  { word: '조화', body: '다른 소리와 함께 숨 쉬는 일' },
  { word: '비전', body: '노래 너머의 삶을 바라보는 눈' },
]

const wordPositions = [
  { left: '10%', top: '22%' },
  { left: '23%', top: '47%' },
  { left: '39%', top: '29%' },
  { left: '54%', top: '58%' },
  { left: '69%', top: '35%' },
  { left: '80%', top: '63%' },
]

type ScrollScoreBookRevealProps = {
  coverDescription?: string
  coverTitle?: string
  finalDescription?: string
  finalTitle?: string
  rightBody?: string
  rightTitle?: string
  valueWordsText?: string
}

type ScoreStyle = CSSProperties & {
  '--book-final': string
  '--book-open': string
  '--cover-opacity': string
}

type WordStyle = CSSProperties & {
  '--word-left': string
  '--word-opacity': string
  '--word-scale': string
  '--word-top': string
  '--word-x': string
  '--word-y': string
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart))
  return progress * progress * (3 - 2 * progress)
}

function easeInOut(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function useScoreBookProgress() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [isAnimatedDesktop, setIsAnimatedDesktop] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(
          '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
        ).matches,
  )
  const [progress, setProgress] = useState(isAnimatedDesktop ? 0 : 1)

  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    const handleChange = () => setIsAnimatedDesktop(query.matches)

    handleChange()
    query.addEventListener('change', handleChange)

    return () => query.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isAnimatedDesktop) {
      return
    }

    const section = sectionRef.current

    if (!section) {
      return
    }

    let animationFrame = 0
    let current = 0
    let target = 0

    const readTarget = () => {
      const rect = section.getBoundingClientRect()
      const scrollableDistance = rect.height - window.innerHeight

      if (scrollableDistance <= 0) {
        return 1
      }

      return clamp(-rect.top / scrollableDistance)
    }

    const animate = () => {
      target = readTarget()
      current += (target - current) * 0.105

      if (Math.abs(target - current) < 0.0008) {
        current = target
      }

      setProgress((previous) =>
        Math.abs(previous - current) > 0.0005 ? current : previous,
      )

      if (Math.abs(target - current) > 0.0008) {
        animationFrame = window.requestAnimationFrame(animate)
      } else {
        animationFrame = 0
      }
    }

    const requestUpdate = () => {
      target = readTarget()

      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }

      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [isAnimatedDesktop])

  return {
    isAnimatedDesktop,
    progress: isAnimatedDesktop ? progress : 1,
    sectionRef,
  }
}

function splitLines(value: string | undefined, fallback: string[]) {
  const lines = value
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines?.length ? lines : fallback
}

function getFlutterPageStyle(progress: number, index: number): CSSProperties {
  const start = 0.24 + index * 0.036
  const end = start + 0.205
  const localRaw = clamp((progress - start) / (end - start))
  const local = easeInOut(localRaw)
  const before = progress < start
  const after = progress > end
  const near = progress > start - 0.03 && progress < end + 0.06
  let opacity = near ? 1 : 0

  if (after) {
    opacity = Math.max(0, 0.28 - (progress - end) * 2.8)
  }

  if (progress > 0.76) {
    opacity *= 1 - smoothstep(0.76, 0.88, progress)
  }

  const arc = Math.sin(localRaw * Math.PI)
  const shadowOpacity = 0.12 + arc * 0.18

  return {
    filter: `drop-shadow(${(arc * 12).toFixed(2)}px 16px 24px rgb(7 17 31 / ${shadowOpacity.toFixed(3)}))`,
    opacity,
    transform: `rotateY(${(-178 * local).toFixed(2)}deg) translateZ(${(28 + arc * 20).toFixed(2)}px) skewY(${(arc * -1.4).toFixed(2)}deg)`,
    zIndex: before ? 12 + FLUTTER_PAGE_COUNT - index : 28 + index,
  }
}

function getWordStyle(progress: number, index: number): WordStyle {
  const start = 0.2 + index * 0.062
  const end = start + 0.24
  const local = clamp((progress - start) / (end - start))
  const enter = smoothstep(0, 0.22, local)
  const exit = smoothstep(0.66, 1, local)
  const visible = enter * (1 - exit)
  const position = wordPositions[index]

  return {
    '--word-left': position.left,
    '--word-opacity': (visible * 0.44).toFixed(4),
    '--word-scale': (0.96 - local * 0.1).toFixed(4),
    '--word-top': position.top,
    '--word-x': `${(-26 + local * 148).toFixed(2)}px`,
    '--word-y': `${(18 - Math.sin(local * Math.PI) * 34 - local * 16).toFixed(2)}px`,
  }
}

function getValueWords(value: string | undefined) {
  const words = value
    ?.split(',')
    .map((word) => word.trim())
    .filter(Boolean)

  if (!words?.length) {
    return valueWords
  }

  return words.slice(0, 6).map((word, index) => ({
    body: valueWords[index]?.body ?? '',
    word,
  }))
}

export function ScrollScoreBookReveal({
  coverDescription,
  coverTitle,
  finalDescription,
  finalTitle,
  rightBody,
  rightTitle,
  valueWordsText,
}: ScrollScoreBookRevealProps) {
  const { isAnimatedDesktop, progress, sectionRef } = useScoreBookProgress()
  const open = smoothstep(0.02, 0.25, progress)
  const final = smoothstep(0.68, 0.91, progress)
  const scoreStyle: ScoreStyle = {
    '--book-final': final.toFixed(4),
    '--book-open': open.toFixed(4),
    '--cover-opacity': (1 - smoothstep(0.18, 0.35, progress)).toFixed(4),
  }
  const coverLines = splitLines(coverTitle, [
    '정직한 음악과',
    '공동체의 울림을',
    '기록하는 악보집',
  ])
  const finalLines = splitLines(finalTitle, [
    '목소리와 공동체의',
    '울림을 읽습니다',
  ])
  const flutterPages = useMemo(
    () => Array.from({ length: FLUTTER_PAGE_COUNT }, (_, index) => index),
    [],
  )
  const displayedValueWords = useMemo(
    () => getValueWords(valueWordsText),
    [valueWordsText],
  )

  return (
    <section
      aria-labelledby="motet-score-final-title"
      className="flow-section motet-score-scroll-section"
      data-flow-section="score-book"
      ref={sectionRef}
      style={scoreStyle}
    >
      <div className="motet-score-sticky-stage">
        <div aria-hidden="true" className="motet-score-stage-label">
          MOTET SCORE
        </div>
        <div aria-hidden="true" className="motet-score-orbit" />

        <div className="motet-score-book">
          <div aria-hidden="true" className="motet-score-shadow" />

          <div className="motet-score-spread">
            <article className="motet-score-page motet-score-page-left">
              <span aria-hidden="true" className="motet-score-page-ghost">
                SCORE
              </span>
              <div className="motet-score-final-copy">
                <p className="motet-score-eyebrow">MOTET SCORE</p>
                <h2 id="motet-score-final-title">
                  {finalLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>
                <p className="motet-score-final-body">
                  {finalDescription ||
                    '합창은 소리를 맞추는 일을 넘어,\n사람을 세우는 교육입니다.'}
                </p>
                <p className="motet-score-keywords">경청 · 배려 · 성실</p>
              </div>
            </article>

            <article className="motet-score-page">
              <div className="motet-score-final-copy">
                <span aria-hidden="true" className="motet-score-quote-mark">
                  ”
                </span>
                <h3>
                  {rightTitle || '함께 부르는 목소리는'}
                  <span>서로를 듣는 마음에서</span>
                  <span>시작됩니다</span>
                </h3>
                <p className="motet-score-final-body">
                  {rightBody ||
                    '나의 소리보다 우리의 울림을 먼저 생각하며, 청소년들은 조화와 책임, 성실과 비전을 배워갑니다.'}
                </p>
                <p className="motet-score-keywords">책임 · 조화 · 비전</p>
              </div>
            </article>
          </div>

          <div aria-hidden="true" className="motet-score-crease" />

          <div aria-hidden="true" className="motet-score-cover">
            <div className="motet-score-cover-inner">
              <p>MOTET SCORE</p>
              <h2>
                {coverLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
              <span />
              <strong>
                {coverDescription ||
                  '정직한 음악과 공동체의 울림을 한 권의 악보처럼 기록합니다.'}
              </strong>
            </div>
          </div>

          {isAnimatedDesktop ? (
            <div aria-hidden="true" className="motet-score-value-words">
              {displayedValueWords.map((item, index) => (
                <span
                  className="motet-score-value-word"
                  key={item.word}
                  style={getWordStyle(progress, index)}
                >
                  <strong>{item.word}</strong>
                  <small>{item.body}</small>
                </span>
              ))}
            </div>
          ) : null}

          {isAnimatedDesktop
            ? flutterPages.map((index) => (
                <div
                  aria-hidden="true"
                  className="motet-score-flutter-page"
                  key={index}
                  style={getFlutterPageStyle(progress, index)}
                >
                  <div className="motet-score-flutter-face" />
                  <div className="motet-score-flutter-face motet-score-flutter-face-back" />
                </div>
              ))
            : null}
        </div>
      </div>
    </section>
  )
}
