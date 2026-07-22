import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import { Button } from '../common/Button'
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
  '--actions-reveal': string
  '--book-fade': string
  '--book-final': string
  '--book-open': string
  '--cover-opacity': string
  '--headline-blur': string
  '--headline-reveal': string
  '--headline-scale': string
  '--headline-y': string
  '--legend-reveal': string
  '--paper-reveal': string
  '--period-reveal': string
  '--staff-reveal': string
  '--summary-reveal': string
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

function easeOutBack(value: number) {
  const overshoot = 1.22
  const shifted = value - 1

  return (
    1 +
    (overshoot + 1) * Math.pow(shifted, 3) +
    overshoot * Math.pow(shifted, 2)
  )
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
    const animationDuration = 3200
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
  const start = 0.19 + index * 0.036
  const end = start + 0.29
  const localRaw = clamp((progress - start) / (end - start))
  const local = easeInOut(localRaw)
  const before = progress < start
  const arc = Math.sin(localRaw * Math.PI)
  const near = progress > start - 0.025 && progress < end + 0.055
  const fade = 1 - smoothstep(0.72, 0.86, progress)
  const shadowOpacity = 0.08 + arc * 0.18

  return {
    filter: `drop-shadow(${(arc * 13).toFixed(2)}px 16px 24px rgb(53 21 42 / ${shadowOpacity.toFixed(3)}))`,
    opacity: near ? fade : 0,
    transform: `rotateY(${(-179 * local).toFixed(2)}deg) translateZ(${(24 + arc * 48).toFixed(2)}px) rotateZ(${(arc * -1.6).toFixed(2)}deg)`,
    zIndex: before ? 18 + FLUTTER_PAGE_COUNT - index : 34 + index,
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
  const open = smoothstep(0.02, 0.3, progress)
  const paperReveal = smoothstep(0.7, 0.88, progress)
  const headlineReveal = smoothstep(0.79, 0.91, progress)
  const legendReveal = smoothstep(0.84, 0.94, progress)
  const staffReveal = smoothstep(0.82, 0.955, progress)
  const summaryReveal = smoothstep(0.91, 0.975, progress)
  const actionsReveal = smoothstep(0.945, 0.995, progress)
  const periodReveal = smoothstep(0.92, 0.985, progress)
  const headlineBack = easeOutBack(headlineReveal)
  const scoreStyle: ScoreStyle = {
    '--actions-reveal': actionsReveal.toFixed(4),
    '--book-fade': (1 - smoothstep(0.72, 0.88, progress)).toFixed(4),
    '--book-final': paperReveal.toFixed(4),
    '--book-open': open.toFixed(4),
    '--cover-opacity': (1 - smoothstep(0.22, 0.42, progress)).toFixed(4),
    '--headline-blur': `${((1 - headlineReveal) * 5).toFixed(2)}px`,
    '--headline-reveal': headlineReveal.toFixed(4),
    '--headline-scale': (0.955 + headlineBack * 0.045).toFixed(4),
    '--headline-y': `${((1 - headlineReveal) * 24).toFixed(2)}px`,
    '--legend-reveal': legendReveal.toFixed(4),
    '--paper-reveal': paperReveal.toFixed(4),
    '--period-reveal': periodReveal.toFixed(4),
    '--staff-reveal': staffReveal.toFixed(4),
    '--summary-reveal': summaryReveal.toFixed(4),
  }
  const requestedCoverLines = splitLines(coverTitle, [
    '함께 부르는',
    '우리의 노래',
  ])
  const coverLines =
    requestedCoverLines.join('') === '합창단 활동을한눈에 보는Motet Score'
      ? ['함께 부르는', '우리의 노래']
      : requestedCoverLines
  const coverFooter =
    !coverDescription ||
    coverDescription.trim() ===
      '연습, 공연 준비, 주요 안내를 악보집 형식으로 정리했습니다.'
      ? 'SEOUL MOTET YOUTH CHOIR'
      : coverDescription
  const requestedFinalLines = splitLines(finalTitle, [
    '서로 다른 목소리로,',
    '같은 음악을 완성합니다',
  ])
  const finalLines =
    requestedFinalLines.join('') === '연습과 공연을함께 확인합니다'
      ? ['서로 다른 목소리로,', '같은 음악을 완성합니다']
      : requestedFinalLines
  const finalBody =
    !finalDescription ||
    finalDescription.trim() ===
      '합창단의 교육 방향과 활동 흐름을 한 화면에서 안내합니다.'
      ? '체계적인 앙상블 교육과\n정기 연습·공연을 통해 음악으로 함께 성장합니다.'
      : finalDescription
  const isFinalInteractive = actionsReveal > 0.9
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
      aria-label="합창단 활동을 소개하는 악보 애니메이션"
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
              <div aria-hidden="true" className="motet-score-opening-voice motet-score-opening-voice--left">
                <span>VOICE</span>
                <strong>S · A</strong>
              </div>
              <span aria-hidden="true" className="motet-score-page-ghost">
                SCORE
              </span>
              <div className="motet-score-final-copy">
                <p className="motet-score-eyebrow">MOTET SCORE</p>
                <h2>
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
              <div aria-hidden="true" className="motet-score-opening-voice">
                <span>VOICE</span>
                <strong>T · B</strong>
              </div>
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
              <strong>{coverFooter}</strong>
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
                  <div className="motet-score-flutter-face">
                    <img alt="" src="/images/effects/home-score-m-staff.png" />
                  </div>
                  <div className="motet-score-flutter-face motet-score-flutter-face-back">
                    <img alt="" src="/images/effects/home-score-m-staff.png" />
                  </div>
                </div>
              ))
            : null}
        </div>

        <div
          aria-hidden={!isFinalInteractive}
          className={`motet-score-final-sheet${isFinalInteractive ? ' is-interactive' : ''}`}
        >
          <img
            alt=""
            aria-hidden="true"
            className="motet-score-final-paper"
            src="/images/textures/home-score-paper-background.png"
          />
          <div className="motet-score-final-sheet-content">
            <h2 id="motet-score-final-title">
              {finalLines.map((line, index) => (
                <span key={line}>
                  {line}
                  {index === finalLines.length - 1 ? (
                    <span aria-hidden="true" className="motet-score-final-period">.</span>
                  ) : null}
                </span>
              ))}
            </h2>

            <div aria-label="합창 성부" className="motet-score-voice-legend">
              {['SOPRANO', 'ALTO', 'TENOR', 'BASS'].map((voice) => (
                <span key={voice}>{voice}</span>
              ))}
            </div>

            <img
              alt=""
              aria-hidden="true"
              className="motet-score-final-staff"
              src="/images/effects/home-score-m-staff.png"
            />

            <p className="motet-score-final-summary">{finalBody}</p>

            <div className="motet-score-final-actions">
              <Button
                className="motet-score-final-primary"
                disabled={!isFinalInteractive}
                href="/gallery"
                showArrow={false}
              >
                우리의 활동 보기
              </Button>
              <Button
                className="motet-score-final-secondary"
                disabled={!isFinalInteractive}
                href="/concerts"
                variant="ghost"
              >
                공연과 소식
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
