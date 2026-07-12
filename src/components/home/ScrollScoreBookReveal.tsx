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
  { fromX: -420, fromY: -172, left: '18%', tilt: -5.2, top: '25%' },
  { fromX: -480, fromY: 8, left: '19%', tilt: 4.2, top: '43%' },
  { fromX: -430, fromY: 188, left: '21%', tilt: -3.4, top: '61%' },
  { fromX: 420, fromY: -166, left: '56%', tilt: 4.8, top: '25%' },
  { fromX: 480, fromY: 14, left: '58%', tilt: -3.8, top: '43%' },
  { fromX: 430, fromY: 184, left: '60%', tilt: 3.2, top: '61%' },
]

const WORD_WAVE_COUNT = 1
const WORD_WAVE_INTERVAL = 0.34
const WORD_STAGGER_INTERVAL = 0.035

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
    let pinFrame = 0
    let current = 0
    let target = 0
    let lockedScrollY = 0
    let isScrollLocked = false
    let scrollBehaviorLocked = false
    let previousRootScrollBehavior = ''
    let previousBodyScrollBehavior = ''
    let animationFrom = 0
    let animationStartedAt = 0
    let animationCompleted = false
    let releaseTimer = 0
    let releaseDeadlineTimer = 0
    const animationDuration = 1800
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

    const getWheelPixels = (delta: number, deltaMode: number) => {
      if (deltaMode === 1) {
        return delta * 16
      }

      if (deltaMode === 2) {
        return delta * window.innerHeight
      }

      return delta
    }

    const getPinY = () =>
      window.scrollY + section.getBoundingClientRect().top - getStickyTop()

    const getExitY = () => {
      const stageRect = getStageRect()
      const stageHeight = stageRect?.height ?? window.innerHeight - getStickyTop()

      return getPinY() + Math.max(1, section.offsetHeight - stageHeight)
    }

    const setScrollCorrectionMode = (enabled: boolean) => {
      const root = document.documentElement
      const body = document.body

      if (enabled) {
        if (!scrollBehaviorLocked) {
          previousRootScrollBehavior = root.style.scrollBehavior
          previousBodyScrollBehavior = body.style.scrollBehavior
          scrollBehaviorLocked = true
        }

        root.style.scrollBehavior = 'auto'
        body.style.scrollBehavior = 'auto'
        return
      }

      if (scrollBehaviorLocked) {
        root.style.scrollBehavior = previousRootScrollBehavior
        body.style.scrollBehavior = previousBodyScrollBehavior
        scrollBehaviorLocked = false
      }
    }

    const keepStagePinned = () => {
      if (!isScrollLocked) {
        return
      }

      if (Math.abs(window.scrollY - lockedScrollY) > 1) {
        setScrollCorrectionMode(true)
        window.scrollTo({
          behavior: 'auto',
          left: window.scrollX,
          top: lockedScrollY,
        })
      }
    }

    const maintainPinnedScroll = () => {
      if (!isScrollLocked) {
        setScrollCorrectionMode(false)
        pinFrame = 0
        return
      }

      keepStagePinned()
      pinFrame = window.requestAnimationFrame(maintainPinnedScroll)
    }

    const requestPinnedScroll = () => {
      if (pinFrame === 0) {
        pinFrame = window.requestAnimationFrame(maintainPinnedScroll)
      }
    }

    const setStaticProgress = (nextProgress: number) => {
      current = nextProgress
      target = nextProgress
      setProgress((previous) =>
        Math.abs(previous - nextProgress) > 0.0005 ? nextProgress : previous,
      )
    }

    const syncProgressWithScrollPosition = () => {
      if (isScrollLocked) {
        return
      }

      const pinY = getPinY()
      const exitY = getExitY()

      if (window.scrollY < pinY - 6) {
        setStaticProgress(0)
        return
      }

      if (window.scrollY > exitY + 6) {
        setStaticProgress(1)
      }
    }

    const releaseScrollLock = () => {
      isScrollLocked = false
      animationCompleted = false

      if (releaseTimer !== 0) {
        window.clearTimeout(releaseTimer)
        releaseTimer = 0
      }

      if (releaseDeadlineTimer !== 0) {
        window.clearTimeout(releaseDeadlineTimer)
        releaseDeadlineTimer = 0
      }

      if (pinFrame !== 0) {
        window.cancelAnimationFrame(pinFrame)
        pinFrame = 0
      }

      setScrollCorrectionMode(false)
    }

    const scheduleScrollRelease = () => {
      if (!animationCompleted) {
        return
      }

      // The animation finishes while the book is still visually pinned. Move
      // the document to the matching edge before unlocking so there is no
      // residual sticky range where the finished book follows page scrolling.
      lockedScrollY = target >= 0.5 ? getExitY() : getPinY()
      keepStagePinned()

      if (releaseTimer !== 0) {
        window.clearTimeout(releaseTimer)
      }

      releaseTimer = window.setTimeout(releaseScrollLock, 140)

      if (releaseDeadlineTimer === 0) {
        releaseDeadlineTimer = window.setTimeout(releaseScrollLock, 650)
      }
    }

    const animate = (frameTime: number) => {
      keepStagePinned()

      const elapsed = Math.max(0, frameTime - animationStartedAt)
      const timelineProgress = clamp(elapsed / animationDuration)
      current = animationFrom + (target - animationFrom) * easeInOut(timelineProgress)

      setProgress((previous) =>
        Math.abs(previous - current) > 0.0005 ? current : previous,
      )

      if (timelineProgress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
      } else {
        current = target
        setProgress(target)
        animationFrame = 0
        animationCompleted = true
        scheduleScrollRelease()
      }
    }

    const requestUpdate = () => {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    const startLockedProgress = (nextProgress: number, lockY: number) => {
      lockedScrollY = lockY
      isScrollLocked = true
      animationCompleted = false
      setScrollCorrectionMode(true)
      window.scrollTo({
        behavior: 'auto',
        left: window.scrollX,
        top: lockedScrollY,
      })
      requestPinnedScroll()

      animationFrom = current
      target = clamp(nextProgress)
      animationStartedAt = performance.now()
      keepStagePinned()
      requestUpdate()
    }

    const handleWheel = (event: WheelEvent) => {
      const deltaY = getWheelPixels(event.deltaY, event.deltaMode)
      const deltaX = getWheelPixels(event.deltaX, event.deltaMode)

      if (Math.abs(deltaY) <= Math.abs(deltaX)) {
        return
      }

      if (isScrollLocked) {
        event.preventDefault()
        keepStagePinned()
        scheduleScrollRelease()
        return
      }

      const pinY = getPinY()
      const exitY = getExitY()
      const scrollY = window.scrollY
      const nextScrollY = scrollY + deltaY
      const isScrollingDown = deltaY > 0
      const isScrollingUp = deltaY < 0
      const reachesStageFromAbove =
        isScrollingDown && scrollY <= exitY + 4 && nextScrollY >= pinY - 12
      const reachesStageFromBelow =
        isScrollingUp && scrollY >= pinY - 4 && nextScrollY <= exitY + 12

      const shouldAdvance =
        isScrollingDown &&
        reachesStageFromAbove &&
        current < 0.999
      const shouldReverse =
        isScrollingUp &&
        reachesStageFromBelow &&
        current > 0.001

      if (!shouldAdvance && !shouldReverse) {
        return
      }

      event.preventDefault()

      if (isScrollingDown) {
        current = 0
        target = 0
      }

      if (isScrollingUp) {
        current = 1
        target = 1
      }

      const currentLockY = Math.min(exitY, Math.max(pinY, scrollY))
      startLockedProgress(isScrollingDown ? 1 : 0, currentLockY)
    }

    const handleScroll = () => {
      if (isScrollLocked) {
        keepStagePinned()
        requestPinnedScroll()
        return
      }

      syncProgressWithScrollPosition()
    }

    syncProgressWithScrollPosition()

    window.addEventListener('wheel', handleWheel, {
      capture: true,
      passive: false,
    })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }

      if (pinFrame !== 0) {
        window.cancelAnimationFrame(pinFrame)
      }

      if (releaseTimer !== 0) {
        window.clearTimeout(releaseTimer)
      }

      if (releaseDeadlineTimer !== 0) {
        window.clearTimeout(releaseDeadlineTimer)
      }

      setScrollCorrectionMode(false)
      window.removeEventListener('wheel', handleWheel, { capture: true })
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
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

  if (progress > 0.52) {
    opacity *= 1 - smoothstep(0.52, 0.68, progress)
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
  const start = 0.18 + waveIndex * WORD_WAVE_INTERVAL + stagger
  const end = start + 0.48
  const localRaw = clamp((progress - start) / (end - start))
  const moveRaw = smoothstep(0.08, 0.88, localRaw)
  const settled = easeInOut(moveRaw)
  const enter = smoothstep(0.03, 0.2, localRaw)
  const absorb = smoothstep(0.78, 1, localRaw)
  const finalFade = 1 - smoothstep(0.78, 0.93, progress)
  const visible = enter * (1 - absorb) * finalFade
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
  const final = smoothstep(0.86, 0.98, progress)
  const scoreStyle: ScoreStyle = {
    '--book-final': final.toFixed(4),
    '--book-open': open.toFixed(4),
    '--cover-opacity': (1 - smoothstep(0.3, 0.5, progress)).toFixed(4),
  }
  const coverLines = splitLines(coverTitle, [
    '합창단 활동을',
    '한눈에 보는',
    'Motet Score',
  ])
  const finalLines = splitLines(finalTitle, [
    '연습과 공연을',
    '함께 확인합니다',
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
                    '합창단의 교육 방향과 활동 흐름을 한 화면에서 안내합니다.'}
                </p>
                <p className="motet-score-keywords">발성 · 악보 · 파트</p>
                <div className="motet-score-final-callout">
                  <strong>연습이 남기는 것</strong>
                  <p>
                    한 곡을 준비하며 단원들은 음정, 박자, 발음, 호흡을
                    반복해서 맞춥니다.
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
                  {rightTitle || '공동체 연습'}
                  <span>파트별 역할과</span>
                  <span>앙상블을 배웁니다</span>
                </h3>
                <p className="motet-score-final-body">
                  {rightBody ||
                    '파트별 역할을 익히고, 다른 단원의 소리를 들으며 함께 맞춰 갑니다.'}
                </p>
                <p className="motet-score-keywords">앙상블 · 공연 · 안내</p>
                <div className="motet-score-final-callout">
                  <strong>무대가 이어 주는 것</strong>
                  <p>
                    연습한 곡은 정기연주회, 초청연주, 나눔 공연에서
                    발표됩니다.
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
                  '연습, 공연 준비, 주요 안내를 악보집 형식으로 정리했습니다.'}
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
