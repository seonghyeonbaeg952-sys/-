import { useEffect, useRef, useState } from 'react'

import type { HomeV4ScenarioMode } from '../../../pages/sample/home-v4/homeV4SampleTypes'
import type { HomeV4ScoreFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'
import { HomeV4MotetScoreCover } from './HomeV4MotetScoreCover'
import { HomeV4MotetScoreFinal } from './HomeV4MotetScoreFinal'
import { HomeV4MotetScoreSpread } from './HomeV4MotetScoreSpread'

type HomeV4MotetScoreSectionProps = {
  fixture: HomeV4ScoreFixture
  reducedMotion: boolean
  scenario: HomeV4ScenarioMode
}

type HomeV4ScoreStage = 'cover' | 'spread' | 'final'

const HOLD_MIN_WIDTH = 1024
const HOLD_MIN_HEIGHT = 820
const STAGE_VERTICAL_ALLOWANCE = 168

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart))
  return progress * progress * (3 - 2 * progress)
}

function getActiveStage(progress: number): HomeV4ScoreStage {
  if (progress >= 0.64) {
    return 'final'
  }

  if (progress >= 0.24) {
    return 'spread'
  }

  return 'cover'
}

export function HomeV4MotetScoreSection({
  fixture,
  reducedMotion,
  scenario,
}: HomeV4MotetScoreSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const frameWatchdogRef = useRef<number | null>(null)
  const holdEnabledRef = useRef(false)
  const [holdEnabled, setHoldEnabled] = useState(false)
  const [activeStage, setActiveStage] = useState<HomeV4ScoreStage>('cover')

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current

    if (!section || !track) {
      return
    }

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    const widthQuery = window.matchMedia(
      `(min-width: ${HOLD_MIN_WIDTH}px)`,
    )
    const updateHoldEligibility = () => {
      const layerHeights = Array.from(
        track.querySelectorAll<HTMLElement>('[data-score-layer]'),
      ).map((layer) => layer.scrollHeight)
      const tallestLayer = Math.max(...layerHeights, 0)
      const fitsAvailableHeight =
        tallestLayer <= window.innerHeight - STAGE_VERTICAL_ALLOWANCE
      const nextHoldEnabled =
        scenario === 'normal' &&
        !reducedMotion &&
        !reducedMotionQuery.matches &&
        widthQuery.matches &&
        window.innerHeight >= HOLD_MIN_HEIGHT &&
        fitsAvailableHeight

      holdEnabledRef.current = nextHoldEnabled
      setHoldEnabled(nextHoldEnabled)

      if (!nextHoldEnabled) {
        setActiveStage('cover')
        track.style.setProperty('--home-v4-score-progress', '0')
        track.style.setProperty('--home-v4-score-cover-opacity', '1')
        track.style.setProperty('--home-v4-score-spread-opacity', '1')
        track.style.setProperty('--home-v4-score-final-opacity', '1')
      }
    }

    const updateProgress = () => {
      frameRef.current = null

      if (frameWatchdogRef.current !== null) {
        window.clearTimeout(frameWatchdogRef.current)
        frameWatchdogRef.current = null
      }

      if (!holdEnabledRef.current) {
        return
      }

      const rect = track.getBoundingClientRect()

      if (
        rect.bottom < -window.innerHeight ||
        rect.top > window.innerHeight * 2
      ) {
        return
      }

      const scrollDistance = Math.max(track.offsetHeight - window.innerHeight, 1)
      const progress = clamp(-rect.top / scrollDistance)
      const coverOpacity = 1 - smoothstep(0.24, 0.42, progress)
      const spreadOpacity =
        smoothstep(0.2, 0.34, progress) *
        (1 - smoothstep(0.66, 0.79, progress))
      const finalOpacity = smoothstep(0.62, 0.76, progress)

      track.style.setProperty(
        '--home-v4-score-progress',
        progress.toFixed(4),
      )
      track.style.setProperty(
        '--home-v4-score-cover-opacity',
        coverOpacity.toFixed(4),
      )
      track.style.setProperty(
        '--home-v4-score-spread-opacity',
        spreadOpacity.toFixed(4),
      )
      track.style.setProperty(
        '--home-v4-score-final-opacity',
        finalOpacity.toFixed(4),
      )

      const nextStage = getActiveStage(progress)
      setActiveStage((currentStage) =>
        currentStage === nextStage ? currentStage : nextStage,
      )
    }

    const requestProgressUpdate = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateProgress)
      }

      if (frameWatchdogRef.current !== null) {
        window.clearTimeout(frameWatchdogRef.current)
      }

      frameWatchdogRef.current = window.setTimeout(() => {
        frameWatchdogRef.current = null

        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current)
          frameRef.current = null
        }

        updateProgress()
      }, 96)
    }

    const handleVisibilityChange = () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      if (frameWatchdogRef.current !== null) {
        window.clearTimeout(frameWatchdogRef.current)
        frameWatchdogRef.current = null
      }

      if (document.visibilityState === 'visible') {
        requestProgressUpdate()
      }
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          requestProgressUpdate()
        }
      },
      { rootMargin: '50% 0px 50% 0px' },
    )
    const resizeObserver = new ResizeObserver(() => {
      updateHoldEligibility()
      requestProgressUpdate()
    })

    intersectionObserver.observe(section)
    resizeObserver.observe(track)
    reducedMotionQuery.addEventListener('change', updateHoldEligibility)
    widthQuery.addEventListener('change', updateHoldEligibility)
    window.addEventListener('resize', updateHoldEligibility)
    window.addEventListener('scroll', requestProgressUpdate, { passive: true })
    window.addEventListener('wheel', requestProgressUpdate, { passive: true })
    document.addEventListener('scroll', requestProgressUpdate, {
      capture: true,
      passive: true,
    })
    document.documentElement.addEventListener('scroll', requestProgressUpdate, {
      passive: true,
    })
    document.body.addEventListener('scroll', requestProgressUpdate, {
      passive: true,
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    updateHoldEligibility()
    requestProgressUpdate()

    return () => {
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      reducedMotionQuery.removeEventListener('change', updateHoldEligibility)
      widthQuery.removeEventListener('change', updateHoldEligibility)
      window.removeEventListener('resize', updateHoldEligibility)
      window.removeEventListener('scroll', requestProgressUpdate)
      window.removeEventListener('wheel', requestProgressUpdate)
      document.removeEventListener('scroll', requestProgressUpdate, {
        capture: true,
      })
      document.documentElement.removeEventListener(
        'scroll',
        requestProgressUpdate,
      )
      document.body.removeEventListener('scroll', requestProgressUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }

      if (frameWatchdogRef.current !== null) {
        window.clearTimeout(frameWatchdogRef.current)
      }

      holdEnabledRef.current = false
    }
  }, [reducedMotion, scenario])

  const showFinalCtas = !holdEnabled || activeStage === 'final'

  return (
    <section
      aria-labelledby="home-v4-score-title"
      className="home-v4-score"
      data-current-stage={activeStage}
      data-hold={holdEnabled ? 'true' : 'false'}
      ref={sectionRef}
    >
      <div className="home-v4-score__rail" aria-hidden="true">
        <span>MOTET</span>
        <span>SCORE</span>
        <span>VOICE</span>
      </div>

      <div className="home-v4-score__track" ref={trackRef}>
        <div className="home-v4-score__stage">
          <HomeV4MotetScoreCover
            cover={fixture.cover}
            eyebrow={fixture.eyebrow}
          />
          <HomeV4MotetScoreSpread
            spread={fixture.spread}
            values={fixture.values}
          />
          <HomeV4MotetScoreFinal
            final={fixture.final}
            showCtas={showFinalCtas}
          />
        </div>
      </div>
    </section>
  )
}
