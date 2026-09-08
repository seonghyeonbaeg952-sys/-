import { useEffect, useLayoutEffect, useRef } from 'react'

import { HomeV4SampleHeader } from '../../components/sample/home-v4/HomeV4SampleHeader'
import { Footer } from '../../components/layout/Footer'
import { HomeRoute } from '../public/HomeRoute'
import '../../styles/color-sample-theme.css'
import './HomeV4SamplePage.css'
import '../../styles/home-responsive-fonts.css'
import '../../styles/home-responsive-layout.css'

type HomeV4ExperienceProps = {
  mode: 'production' | 'sample'
}

function HomeV4Experience({ mode }: HomeV4ExperienceProps) {
  const isSample = mode === 'sample'
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSample) {
      return
    }

    const existingMeta =
      document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const robotsMeta = existingMeta ?? document.createElement('meta')
    const previousContent = existingMeta?.getAttribute('content')

    if (!existingMeta) {
      robotsMeta.name = 'robots'
      document.head.append(robotsMeta)
    }

    robotsMeta.content = 'noindex,nofollow'

    return () => {
      if (!existingMeta) {
        robotsMeta.remove()
        return
      }

      if (previousContent === null || previousContent === undefined) {
        robotsMeta.removeAttribute('content')
      } else {
        robotsMeta.content = previousContent
      }
    }
  }, [isSample])

  useLayoutEffect(() => {
    const shell = shellRef.current
    const flowRoot = shell?.querySelector<HTMLElement>(
      '.home-section-flow-sample',
    )
    const fullTrack = flowRoot?.querySelector<HTMLElement>(
      '.home-flow-sample-hold-track--full',
    )
    const finaleChunk = flowRoot?.querySelector<HTMLElement>(
      '.home-flow-sample-chunk--finale',
    )
    const sampleHeader = shell?.querySelector<HTMLElement>(
      '.home-v4-sample-header',
    )

    if (!shell || !flowRoot || !fullTrack || !finaleChunk || !sampleHeader) {
      return
    }

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    let frame = 0
    let restoredScrollFrame = 0
    let restoredScrollTimer = 0

    const getDocumentTop = (element: HTMLElement) => {
      let top = 0
      let current: HTMLElement | null = element

      while (current) {
        top += current.offsetTop
        current = current.offsetParent as HTMLElement | null
      }

      return top
    }

    const reset = () => {
      fullTrack.removeAttribute('data-v4-hold-state')
      flowRoot.style.removeProperty('--sample-header-offset')
    }

    const update = () => {
      frame = 0

      if (!desktopQuery.matches || reducedMotionQuery.matches) {
        reset()
        return
      }

      const trackTop = getDocumentTop(fullTrack)
      const finaleTop = getDocumentTop(finaleChunk)
      const measuredHeaderOffset = sampleHeader.getBoundingClientRect().bottom
      const safeHeaderOffset =
        measuredHeaderOffset > 0 ? measuredHeaderOffset : 72

      flowRoot.style.setProperty(
        '--sample-header-offset',
        `${safeHeaderOffset}px`,
      )

      const fixedStart = trackTop - safeHeaderOffset
      const fixedEnd = finaleTop - safeHeaderOffset

      const holdState =
        window.scrollY < fixedStart
          ? 'before'
          : window.scrollY <= fixedEnd
            ? 'fixed'
            : 'ended'

      fullTrack.dataset.v4HoldState = holdState
    }

    const queueUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update)
      }
    }

    const syncRestoredScroll = () => {
      window.cancelAnimationFrame(restoredScrollFrame)
      window.clearTimeout(restoredScrollTimer)
      update()
      restoredScrollFrame = window.requestAnimationFrame(() => {
        restoredScrollFrame = window.requestAnimationFrame(update)
      })
      restoredScrollTimer = window.setTimeout(update, 240)
    }

    const resizeObserver = new ResizeObserver(queueUpdate)
    resizeObserver.observe(fullTrack)
    resizeObserver.observe(finaleChunk)
    resizeObserver.observe(sampleHeader)
    update()
    syncRestoredScroll()

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', queueUpdate)
    window.addEventListener('pageshow', syncRestoredScroll)
    desktopQuery.addEventListener('change', queueUpdate)
    reducedMotionQuery.addEventListener('change', queueUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(restoredScrollFrame)
      window.clearTimeout(restoredScrollTimer)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', queueUpdate)
      window.removeEventListener('pageshow', syncRestoredScroll)
      desktopQuery.removeEventListener('change', queueUpdate)
      reducedMotionQuery.removeEventListener('change', queueUpdate)
      reset()
    }
  }, [])

  useLayoutEffect(() => {
    const shell = shellRef.current
    const intro = shell?.querySelector<HTMLElement>('.home-intro-real-sample')
    const hero = intro?.querySelector<HTMLElement>('.home-hero-section')

    if (!shell || !intro || !hero) {
      return
    }

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const paperPieces = Array.from(
      hero.querySelectorAll<HTMLElement>('.home-hero-paper-piece'),
    )
    const paperPieceFinalOffsets = [
      [-48, -47],
      [-25, -43],
      [-2, -49],
      [23, -44],
      [49, -46],
      [-45, -22],
      [-18, -27],
      [7, -20],
      [31, -26],
      [48, -19],
      [-50, 2],
      [-26, -3],
      [-1, 5],
      [24, -4],
      [49, 3],
      [-46, 25],
      [-20, 21],
      [5, 29],
      [30, 22],
      [47, 27],
      [-49, 48],
      [-25, 44],
      [0, 50],
      [24, 45],
      [50, 48],
      [0, 0],
    ] as const
    const paperLogoIndex = paperPieceFinalOffsets.length - 1
    const paperPieceStartOrigins = [
      [-126, -86],
      [-52, -118],
      [16, -124],
      [78, -108],
      [126, -72],
      [-132, -28],
      [-108, 46],
      [-76, 114],
      [-12, 124],
      [48, 118],
      [114, 92],
      [132, 36],
      [124, -24],
      [96, -102],
      [34, -128],
      [-32, -122],
      [-90, -96],
      [-134, 2],
      [-116, 76],
      [-66, 126],
      [8, 132],
      [74, 120],
      [122, 68],
      [136, -18],
      [88, -116],
    ] as const
    const startRotations = [
      -128, -87, -42, 36, 104,
      -112, -68, 58, 92, 137,
      -146, -51, 24, 79, 121,
      -98, -31, 67, 116, 153,
      -136, -73, -18, 48, 109,
    ] as const
    const paperPieceStarts = paperPieceFinalOffsets.map(
      ([finalX, finalY], index) => {
        if (index === paperLogoIndex) {
          return [4, 112, -10] as const
        }

        const [originX = finalX * 2.2, originY = finalY * 2] =
          paperPieceStartOrigins[index] ?? []

        return [
          originX,
          originY,
          startRotations[index % startRotations.length] ?? 0,
        ] as const
      },
    )
    const paperPieceCurves = paperPieceFinalOffsets.map((_, index) => {
      if (index === paperLogoIndex) {
        return [2.6, -5.4, -1.6] as const
      }

      const curveX = (index % 2 === 0 ? 1 : -1) * (5.2 + (index % 4) * 1.1)
      const curveY = ((index % 5) - 2) * 2.6
      const curveRotation = (index % 2 === 0 ? 1 : -1) * (3.1 + (index % 4))

      return [curveX, curveY, curveRotation] as const
    })
    const paperPieceDelayOrder = [
      0, 7, 16, 3, 21,
      11, 24, 5, 14, 19,
      2, 23, 9, 17, 25,
      4, 12, 20, 1, 15,
      22, 8, 18, 10, 13,
    ] as const
    const paperPieceDelays = paperPieceFinalOffsets.map((_, index) =>
      index === paperLogoIndex
        ? 0.56
        : Math.min(0.42, (paperPieceDelayOrder[index] ?? index) * 0.016),
    )
    const paperPieceEasings = paperPieceFinalOffsets.map(
      (_, index) => 3.04 + (index % 6) * 0.045,
    )
    const paperPieceStopMotionSteps = paperPieceFinalOffsets.map(
      (_, index) => (index === paperLogoIndex ? 12 : 13 + (index % 5)),
    )
    const paperPieceStartScales = paperPieceFinalOffsets.map(
      (_, index) =>
        index === paperLogoIndex ? 0.74 : 0.8 + (index % 4) * 0.015,
    )
    const paperPieceFinalRotations = [
      -12, 7, -4, 11, -8,
      5, -13, 9, -6, 14,
      -9, 12, -11, 4, -15,
      10, -5, 8, -14, 6,
      -7, 13, -3, 9, -10,
      -1,
    ] as const
    let frame = 0
    let targetProgress = 0
    let renderedProgress = 0
    let animationStart = 0
    let animationFrom = 0
    let scrollGuideProgress = 0

    const reset = () => {
      scrollGuideProgress = 0
      shell.style.removeProperty('--home-v4-hero-retreat-scale')
      shell.style.removeProperty('--home-v4-hero-retreat-y')
      shell.style.removeProperty('--home-v4-hero-retreat-radius')
      shell.style.removeProperty('--home-v4-hero-retreat-shadow')
      shell.style.removeProperty('--home-v4-guide-exit-opacity')
      shell.style.removeProperty('--home-v4-guide-exit-y')
      shell.style.removeProperty('--home-v4-guide-exit-scale')
      shell.style.removeProperty('--home-v4-guide-pointer-events')
      shell.style.removeProperty('--home-v4-guide-exit-height')
      shell.style.removeProperty('--home-v4-guide-exit-margin-top')
      shell.style.removeProperty('--home-v4-guide-exit-margin-bottom')
      shell.style.removeProperty('--home-v4-guide-exit-padding-bottom')
      shell.style.removeProperty('--home-v4-paper-seal-opacity')
      hero.removeAttribute('data-paper-transition')
      paperPieces.forEach((piece) => {
        piece.style.removeProperty('opacity')
        piece.style.removeProperty('transform')
      })
    }

    const getScrollMetrics = () => {
      const triggerDistance = Math.min(window.innerHeight * 0.11, 84)
      const travelled = Math.max(0, -intro.getBoundingClientRect().top)

      return {
        travelled,
        triggerDistance,
      }
    }

    const applyProgress = (progress: number) => {
      const guideHeight = 148
      const handoffHold = Math.min(
        260,
        Math.max(200, window.innerHeight * 0.26),
      )
      const curtainProgress = progress * progress * (3 - 2 * progress)
      const guideProgress = Math.max(
        scrollGuideProgress,
        Math.min(1, Math.max(0, (progress - 0.08) / 0.66)),
      )

      paperPieces.forEach((piece, index) => {
        const delay = paperPieceDelays[index] ?? 0
        const rawLocalProgress = Math.min(
          1,
          Math.max(0, (curtainProgress - delay) / (1 - delay)),
        )
        const stopMotionSteps = paperPieceStopMotionSteps[index] ?? 12
        const localProgress =
          rawLocalProgress >= 0.985
            ? 1
            : Math.floor(rawLocalProgress * stopMotionSteps) / stopMotionSteps
        const easingPower = paperPieceEasings[index] ?? 3
        const easedProgress = 1 - (1 - localProgress) ** easingPower
        const remaining = 1 - easedProgress
        const [startX = 0, startY = 0, startRotation = 0] =
          paperPieceStarts[index] ?? [0, 0, 0]
        const [curveX = 0, curveY = 0, curveRotation = 0] =
          paperPieceCurves[index] ?? [0, 0, 0]
        const [finalX = 0, finalY = 0] =
          paperPieceFinalOffsets[index] ?? [0, 0]
        const finalRotation = paperPieceFinalRotations[index] ?? 0
        const arc = Math.sin(localProgress * Math.PI)
        const x =
          startX * remaining + finalX * easedProgress + curveX * arc
        const y =
          startY * remaining + finalY * easedProgress + curveY * arc
        const rotation =
          startRotation * remaining +
          finalRotation * easedProgress +
          curveRotation * arc
        const startScale = paperPieceStartScales[index] ?? 0.92
        const settleLift = arc * (index === paperPieces.length - 1 ? 0.018 : 0.024)
        const scale = startScale * remaining + easedProgress + settleLift

        piece.style.opacity = localProgress > 0.001 ? '1' : '0'
        piece.style.transform = `translate3d(${x}vw, ${y}vh, 0) rotate(${rotation}deg) scale(${scale})`
      })

      shell.style.setProperty(
        '--home-v4-hero-retreat-scale',
        '1',
      )
      shell.style.setProperty(
        '--home-v4-hero-retreat-y',
        '0px',
      )
      shell.style.setProperty(
        '--home-v4-hero-retreat-radius',
        '0px',
      )
      shell.style.setProperty(
        '--home-v4-hero-retreat-shadow',
        '0',
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-opacity',
        `${1 - guideProgress}`,
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-y',
        `${guideProgress * -14}px`,
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-scale',
        `${1 - guideProgress * 0.018}`,
      )
      shell.style.setProperty(
        '--home-v4-guide-pointer-events',
        guideProgress >= 0.98 ? 'none' : 'auto',
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-height',
        `${(1 - guideProgress) * guideHeight}px`,
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-margin-top',
        `${(1 - guideProgress) * -(guideHeight + handoffHold)}px`,
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-margin-bottom',
        `${(1 - guideProgress) * 118}px`,
      )
      shell.style.setProperty(
        '--home-v4-guide-exit-padding-bottom',
        `${(1 - guideProgress) * 16}px`,
      )

      shell.style.setProperty(
        '--home-v4-paper-seal-opacity',
        progress >= 0.995 ? '1' : '0',
      )
    }

    const animate = (time: number) => {
      const duration = targetProgress > animationFrom ? 3280 : 960
      const elapsed = Math.min(1, (time - animationStart) / duration)

      renderedProgress =
        animationFrom + (targetProgress - animationFrom) * elapsed
      applyProgress(renderedProgress)

      if (elapsed < 1) {
        frame = window.requestAnimationFrame(animate)
        return
      }

      renderedProgress = targetProgress
      frame = 0
      applyProgress(renderedProgress)
    }

    const queueUpdate = () => {
      if (!desktopQuery.matches || reducedMotionQuery.matches) {
        targetProgress = 0
        renderedProgress = 0
        reset()
        return
      }

      const { travelled, triggerDistance } = getScrollMetrics()
      const nextTarget =
        travelled >= triggerDistance ? 1 : travelled <= 2 ? 0 : targetProgress
      scrollGuideProgress = Math.min(1, travelled / 190)

      if (nextTarget !== targetProgress) {
        targetProgress = nextTarget
        hero.dataset.paperTransition =
          nextTarget === 1 ? 'playing' : 'idle'
        animationFrom = renderedProgress
        animationStart = performance.now()
        window.cancelAnimationFrame(frame)
        frame = window.requestAnimationFrame(animate)
        return
      }

      if (!frame) {
        applyProgress(renderedProgress)
      }
    }

    if (desktopQuery.matches && !reducedMotionQuery.matches) {
      applyProgress(0)
      queueUpdate()
    } else {
      reset()
    }
    window.addEventListener('scroll', queueUpdate, { passive: true })
    window.addEventListener('resize', queueUpdate)
    desktopQuery.addEventListener('change', queueUpdate)
    reducedMotionQuery.addEventListener('change', queueUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
      desktopQuery.removeEventListener('change', queueUpdate)
      reducedMotionQuery.removeEventListener('change', queueUpdate)
      reset()
    }
  }, [])

  return (
    <div
      className="public-shell color-sample-theme min-h-screen bg-bg-warm-white text-text-charcoal public-shell-home public-shell-home-sample-v4"
      data-design-candidate="home-v4"
      data-public-theme="white-orange"
      data-home-mode={mode}
      data-sample-mirror={isSample ? 'production-home' : undefined}
      data-surface-rule="rectilinear"
      ref={shellRef}
    >
      <a
        className="home-v4-skip-link"
        href="#main-content"
      >
        본문으로 바로가기
      </a>
      <HomeV4SampleHeader mode={mode} />
      <main id="main-content" tabIndex={-1}>
        <HomeRoute
          aboutPresentation="collective-portrait"
          joinOpenScorePresentation="figma-open-score"
          performancePresentation="figma-template-carousel"
          spiritPresentation="chorus-orbit"
        />
      </main>
      <Footer />
    </div>
  )
}

export function HomeV4SamplePage() {
  return <HomeV4Experience mode="sample" />
}

export function HomeV4ProductionPage() {
  return <HomeV4Experience mode="production" />
}
