import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'

const FLUTTER_PAGE_COUNT = 12

const valueWords = [
  { word: '귀 기울임', body: '먼저 듣는 마음' },
  { word: '어울림', body: '서로의 자리를 살피는 태도' },
  { word: '꾸준함', body: '약속한 시간을 지키는 힘' },
  { word: '약속', body: '내 파트를 준비하는 마음' },
  { word: '조화', body: '다른 소리와 함께 숨 쉬는 일' },
  { word: '비전', body: '노래 너머의 삶을 바라보는 눈' },
]

const wordPositions = [
  { fromX: -520, fromY: -172, left: '17%', tilt: -5.2, top: '25%' },
  { fromX: -650, fromY: 8, left: '18%', tilt: 4.2, top: '43%' },
  { fromX: -535, fromY: 188, left: '20%', tilt: -3.4, top: '61%' },
  { fromX: 520, fromY: -166, left: '57%', tilt: 4.8, top: '25%' },
  { fromX: 660, fromY: 14, left: '59%', tilt: -3.8, top: '43%' },
  { fromX: 545, fromY: 184, left: '61%', tilt: 3.2, top: '61%' },
]

const WORD_WAVE_COUNT = 1
const WORD_WAVE_INTERVAL = 0.34
const WORD_STAGGER_INTERVAL = 0.05

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
  '--word-blur': string
  '--word-left': string
  '--word-line-scale': string
  '--word-note-opacity': string
  '--word-opacity': string
  '--word-rotate': string
  '--word-scale': string
  '--word-top': string
  '--word-x': string
  '--word-y': string
  '--word-z': string
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
    const handleChange = () => {
      setIsAnimatedDesktop(query.matches)
      setProgress(query.matches ? 0 : 1)
    }

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
    const wheelDistance = 1450
    const getStickyTop = () => {
      const stage = section.querySelector<HTMLElement>('.motet-score-sticky-stage')

      if (!stage) {
        return 72
      }

      const top = Number.parseFloat(window.getComputedStyle(stage).top)

      return Number.isFinite(top) ? top : 72
    }

    const getStageRect = () =>
      section
        .querySelector<HTMLElement>('.motet-score-sticky-stage')
        ?.getBoundingClientRect()

    const setStaticProgress = (nextProgress: number) => {
      current = nextProgress
      target = nextProgress
      setProgress((previous) =>
        Math.abs(previous - nextProgress) > 0.0005 ? nextProgress : previous,
      )
    }

    const isStagePinned = () => {
      const rect = section.getBoundingClientRect()
      const stageRect = getStageRect()
      const stickyTop = getStickyTop()

      return (
        !!stageRect &&
        Math.abs(stageRect.top - stickyTop) <= 4 &&
        rect.top <= stickyTop + 4 &&
        rect.bottom >= window.innerHeight * 0.78
      )
    }

    const syncProgressWithScrollPosition = () => {
      if (isStagePinned()) {
        return
      }

      const rect = section.getBoundingClientRect()
      const stickyTop = getStickyTop()

      if (rect.top > stickyTop + 8) {
        setStaticProgress(0)
        return
      }

      if (rect.top < stickyTop && rect.bottom < window.innerHeight * 0.78) {
        setStaticProgress(1)
      }
    }

    const animate = () => {
      current += (target - current) * 0.16

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
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return
      }

      syncProgressWithScrollPosition()

      const isScrollingDown = event.deltaY > 0
      const shouldAdvance =
        isScrollingDown &&
        (target < 0.999 || current < 0.99) &&
        isStagePinned()
      const shouldReverse =
        !isScrollingDown &&
        (target > 0.001 || current > 0.01) &&
        isStagePinned()

      if (!shouldAdvance && !shouldReverse) {
        return
      }

      event.preventDefault()
      target = clamp(target + event.deltaY / wheelDistance)
      requestUpdate()
    }

    const handleScroll = () => {
      syncProgressWithScrollPosition()
    }

    syncProgressWithScrollPosition()

    window.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false,
    })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }

      window.removeEventListener('wheel', handleWheel, { capture: true })
      window.removeEventListener('scroll', handleScroll)
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
  const start = 0.28 + index * 0.043
  const end = start + 0.245
  const localRaw = clamp((progress - start) / (end - start))
  const local = easeInOut(localRaw)
  const before = progress < start
  const after = progress > end
  const near = progress > start - 0.03 && progress < end + 0.06
  let opacity = near ? 1 : 0

  if (after) {
    opacity = Math.max(0, 0.28 - (progress - end) * 2.8)
  }

  if (progress > 0.92) {
    opacity *= 1 - smoothstep(0.92, 1, progress)
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

function getWordStyle(
  progress: number,
  index: number,
  waveIndex: number,
): WordStyle {
  const stagger = index * WORD_STAGGER_INTERVAL
  const start = 0.26 + waveIndex * WORD_WAVE_INTERVAL + stagger
  const end = start + 0.38
  const localRaw = clamp((progress - start) / (end - start))
  const moveRaw = smoothstep(0.08, 0.88, localRaw)
  const settled = easeInOut(moveRaw)
  const enter = smoothstep(0.03, 0.2, localRaw)
  const absorb = smoothstep(0.72, 1, localRaw)
  const visible = enter * (1 - absorb)
  const position = wordPositions[index]
  const waveDirection = waveIndex === 0 ? 1 : -1
  const drawnInX = (position.fromX * 0.78 + waveDirection * 18) * (1 - settled)
  const drawnInY = (position.fromY * 0.78 + waveDirection * 8) * (1 - settled)
  const blur = 0.18 * (1 - settled) + absorb * 0.14
  const depth = 18 + 96 * (1 - settled)

  return {
    '--word-blur': `${blur.toFixed(2)}px`,
    '--word-left': position.left,
    '--word-line-scale': visible.toFixed(4),
    '--word-note-opacity': (visible * 0.72).toFixed(4),
    '--word-opacity': Math.min(1, visible * 1.05).toFixed(4),
    '--word-rotate': `${(position.tilt * 0.72 * (1 - settled)).toFixed(2)}deg`,
    '--word-scale': (1.035 - settled * 0.025 - absorb * 0.015).toFixed(4),
    '--word-top': position.top,
    '--word-x': `${drawnInX.toFixed(2)}px`,
    '--word-y': `${drawnInY.toFixed(2)}px`,
    '--word-z': `${depth.toFixed(2)}px`,
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
  const open = smoothstep(0.02, 0.38, progress)
  const final = smoothstep(0.9, 0.98, progress)
  const scoreStyle: ScoreStyle = {
    '--book-final': final.toFixed(4),
    '--book-open': open.toFixed(4),
    '--cover-opacity': (1 - smoothstep(0.3, 0.5, progress)).toFixed(4),
  }
  const coverLines = splitLines(coverTitle, [
    '마음을 담은 음악과',
    '함께 빚는 울림을',
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
        <HomeSectionStaffCue
          className="home-section-staff-cue--score"
          label="악보"
          noteOffset={36}
          symbol="♩"
        />
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
                <p className="motet-score-keywords">귀 기울임 · 꾸준함 · 약속</p>
                <div className="motet-score-final-callout">
                  <strong>연습이 남기는 것</strong>
                  <p>
                    한 곡을 완성하기까지 단원들은 음정과 박자, 숨과 발음을
                    맞추며 서로를 듣는 시간을 쌓아갑니다.
                  </p>
                </div>
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
                    '나의 소리보다 우리의 울림을 먼저 생각하며, 청소년들은 서로를 살피는 마음과 어울림을 배워갑니다.'}
                </p>
                <p className="motet-score-keywords">약속 · 어울림 · 꿈</p>
                <div className="motet-score-final-callout">
                  <strong>무대가 이어 주는 것</strong>
                  <p>
                    준비한 목소리는 예배와 공연, 나눔의 자리에서 위로와 평화의
                    메시지로 전해집니다.
                  </p>
                </div>
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
                  '마음을 담은 음악과 함께 빚는 울림을 한 권의 악보처럼 기록합니다.'}
              </strong>
            </div>
          </div>

          {isAnimatedDesktop ? (
            <div aria-hidden="true" className="motet-score-value-words">
              {Array.from({ length: WORD_WAVE_COUNT }).map((_, waveIndex) =>
                displayedValueWords.map((item, index) => (
                  <span
                    className="motet-score-value-word"
                    key={`${waveIndex}-${item.word}`}
                    style={getWordStyle(progress, index, waveIndex)}
                  >
                    <strong>{item.word}</strong>
                    <small>{item.body}</small>
                  </span>
                )),
              )}
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
