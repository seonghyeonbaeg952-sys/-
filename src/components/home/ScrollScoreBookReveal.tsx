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
  { word: '배려', body: '서로의 자리를 살피는 마음' },
  { word: '꾸준함', body: '하루의 연습을 이어 가는 힘' },
  { word: '약속', body: '함께한 시간을 소중히 여기는 마음' },
  { word: '어울림', body: '다른 소리와 함께 숨 쉬는 일' },
  { word: '꿈', body: '노래 너머의 삶을 바라보는 눈' },
]

const wordPositions = [
  { fromX: -260, fromY: -92, left: '13%', top: '18%' },
  { fromX: -230, fromY: 88, left: '24%', top: '24%' },
  { fromX: -120, fromY: -168, left: '35%', top: '18%' },
  { fromX: 120, fromY: -168, left: '57%', top: '18%' },
  { fromX: 230, fromY: 88, left: '68%', top: '24%' },
  { fromX: 260, fromY: -92, left: '79%', top: '18%' },
]

const PAGE_TURN_END_PROGRESS = 0.9
const WORD_FADE_START_PROGRESS = 0.9
const WORD_FADE_END_PROGRESS = 0.98

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
    let lockedScrollY: number | null = null
    let lastScrollY = window.scrollY
    let isRestoringScroll = false
    const lockTop = 72
    const wheelDistance = 1650
    const lockTriggerViewportRatio = 0.62
    const lockViewportCenterRatio = 0.6
    const lockTopMinimumOffset = 78
    const lockBottomPadding = 48
    const getScoreBookRect = () =>
      section.querySelector<HTMLElement>('.motet-score-book')?.getBoundingClientRect()
    const getDesiredBookTop = (bookRect: DOMRect) => {
      const centeredTop =
        window.innerHeight * lockViewportCenterRatio - bookRect.height * 0.5
      const lowerBoundTop = lockTop + lockTopMinimumOffset
      const bottomSafeTop = window.innerHeight - bookRect.height - lockBottomPadding
      const desiredTop = Math.min(Math.max(lowerBoundTop, centeredTop), bottomSafeTop)

      return Math.max(lockTop + 24, desiredTop)
    }
    const getLockTriggerCenter = (bookRect: DOMRect) => {
      const preferredCenter = window.innerHeight * lockTriggerViewportRatio
      const fullyVisibleCenter =
        window.innerHeight - bookRect.height * 0.5 - lockBottomPadding

      return Math.min(preferredCenter, fullyVisibleCenter)
    }
    const getScoreLockScrollY = () => {
      const bookRect = getScoreBookRect()

      if (!bookRect) {
        return window.scrollY
      }

      const desiredBookTop = getDesiredBookTop(bookRect)

      return window.scrollY + bookRect.top - desiredBookTop
    }
    const isBookCenteredForLock = (projectedDeltaY = 0) => {
      const bookRect = getScoreBookRect()

      if (!bookRect) {
        const rect = section.getBoundingClientRect()

        return rect.top - Math.max(projectedDeltaY, 0) <= lockTop + 320
      }

      const bookCenter =
        bookRect.top + bookRect.height * 0.5 - Math.max(projectedDeltaY, 0)
      const triggerCenter = getLockTriggerCenter(bookRect)

      return bookCenter <= triggerCenter
    }

    const isAtStart = () => target <= 0.001 && current <= 0.002
    const isAtEnd = () => target >= 0.999 && current >= 0.998

    const restoreLockedScroll = () => {
      if (lockedScrollY === null) {
        return
      }

      if (Math.abs(window.scrollY - lockedScrollY) > 1) {
        isRestoringScroll = true
        window.scrollTo(window.scrollX, lockedScrollY)
      }
    }

    const shouldConsumeScrollDelta = (deltaY: number) => {
      const rect = section.getBoundingClientRect()
      const isApproachingFromAbove =
        deltaY > 0 &&
        target < 0.999 &&
        isBookCenteredForLock(deltaY) &&
        rect.bottom > lockTop + 220
      const isReturningFromBelow =
        deltaY < 0 &&
        target > 0.001 &&
        rect.top < window.innerHeight * 0.64 &&
        rect.bottom >= lockTop + 160

      return isApproachingFromAbove || isReturningFromBelow
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

    const keepScrollLocked = () => {
      if (lockedScrollY === null) {
        return
      }

      if (isAtStart() || isAtEnd()) {
        lockedScrollY = null
        return
      }

      restoreLockedScroll()
    }

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return
      }

      const shouldConsumeWheel =
        lockedScrollY !== null || shouldConsumeScrollDelta(event.deltaY)

      if (!shouldConsumeWheel) {
        return
      }

      if (event.deltaY > 0 && isAtEnd()) {
        lockedScrollY = null
        return
      }

      if (event.deltaY < 0 && isAtStart()) {
        lockedScrollY = null
        return
      }

      event.preventDefault()

      if (lockedScrollY === null) {
        lockedScrollY = getScoreLockScrollY()
      }

      target = clamp(target + event.deltaY / wheelDistance)
      lastScrollY = lockedScrollY
      restoreLockedScroll()
      requestUpdate()
    }

    const handleScroll = () => {
      if (isRestoringScroll) {
        isRestoringScroll = false
        lastScrollY = window.scrollY
        return
      }

      const nextScrollY = window.scrollY
      const deltaY = nextScrollY - lastScrollY

      if (Math.abs(deltaY) < 0.5) {
        lastScrollY = nextScrollY
        return
      }

      if (lockedScrollY !== null) {
        if (!isAtStart() && !isAtEnd()) {
          target = clamp(target + deltaY / wheelDistance)
          requestUpdate()
        }

        keepScrollLocked()
        lastScrollY = lockedScrollY ?? window.scrollY
        return
      }

      if (shouldConsumeScrollDelta(deltaY)) {
        lockedScrollY = getScoreLockScrollY()
        target = clamp(target + deltaY / wheelDistance)
        restoreLockedScroll()
        requestUpdate()
        lastScrollY = lockedScrollY
        return
      }

      lastScrollY = nextScrollY
    }

    const handleResize = () => {
      lockedScrollY = null
      lastScrollY = window.scrollY
    }

    window.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false,
    })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }

      window.removeEventListener('wheel', handleWheel, { capture: true })
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
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
  const local = clamp((progress - start) / (PAGE_TURN_END_PROGRESS - start))
  const easedLocal = easeInOut(local)
  const enter = smoothstep(0, 0.18, local)
  const exit = smoothstep(
    WORD_FADE_START_PROGRESS,
    WORD_FADE_END_PROGRESS,
    progress,
  )
  const visible = enter * (1 - exit)
  const position = wordPositions[index]
  const drawnInX = position.fromX * (1 - easedLocal) + easedLocal * 8
  const drawnInY = position.fromY * (1 - easedLocal) - easedLocal * 8
  const blur = 1.4 * (1 - local) + exit * 0.7

  return {
    '--word-blur': `${blur.toFixed(2)}px`,
    '--word-left': position.left,
    '--word-opacity': (visible * 0.36).toFixed(4),
    '--word-scale': (0.94 - easedLocal * 0.08).toFixed(4),
    '--word-top': position.top,
    '--word-x': `${drawnInX.toFixed(2)}px`,
    '--word-y': `${drawnInY.toFixed(2)}px`,
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
                <p className="motet-score-keywords">귀 기울임 · 배려 · 꾸준함</p>
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
