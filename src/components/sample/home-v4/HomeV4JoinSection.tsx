import { useEffect, useRef } from 'react'

import type { HomeV4JoinFixture } from '../../../pages/sample/home-v4/homeV4JoinConcertTypes'
import { HomeV4JoinFacts } from './HomeV4JoinFacts'
import { HomeV4JoinGuardianNote } from './HomeV4JoinGuardianNote'
import { HomeV4JoinSteps } from './HomeV4JoinSteps'
import { HomeV4JoinWaveTransition } from './HomeV4JoinWaveTransition'

type HomeV4JoinSectionProps = {
  fixture: HomeV4JoinFixture
  reducedMotion: boolean
  scenario: 'normal' | 'long-copy' | 'empty-data' | 'reduced-motion'
}

const HOLD_TOP = 96
const HOLD_VIEWPORT_GUTTER = 16
const HOLD_MIN_DISTANCE = 520
const HOLD_MAX_DISTANCE = 820

function renderLines(value: string) {
  return value.split('\n').map((line) => <span key={line}>{line}</span>)
}

export function HomeV4JoinSection({
  fixture,
  reducedMotion,
  scenario,
}: HomeV4JoinSectionProps) {
  const trackRef = useRef<HTMLElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const visibleSteps = fixture.steps
    .filter((step) => step.isVisible)
    .sort((left, right) => left.displayOrder - right.displayOrder)
  const stepLabel = `입단 절차 · ${String(visibleSteps.length).padStart(2, '0')} STEPS`

  useEffect(() => {
    const track = trackRef.current
    const shell = shellRef.current
    const panel = panelRef.current
    const wave = waveRef.current

    if (!track || !shell || !panel || !wave) {
      return
    }

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const systemReducedQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    let animationFrame = 0
    let isNearViewport = true
    let holdDistance = 0
    let holdEnabled = false

    const setWaveProgress = (progress: number) => {
      const clampedProgress = Math.min(1, Math.max(0, progress))
      const waveY = `${(1 - clampedProgress) * 100}%`

      track.style.setProperty(
        '--home-v4-join-progress',
        clampedProgress.toFixed(4),
      )
      track.style.setProperty('--home-v4-join-wave-y', waveY)
      track.dataset.waveProgress = clampedProgress.toFixed(2)

      if (clampedProgress <= 0) {
        track.dataset.motionState = 'hold'
      } else if (clampedProgress < 0.96) {
        track.dataset.motionState = 'wave'
      } else {
        track.dataset.motionState = 'cover'
      }
    }

    const updateProgress = () => {
      animationFrame = 0

      if (!holdEnabled || !isNearViewport) {
        return
      }

      const trackTop = track.getBoundingClientRect().top + window.scrollY
      const holdStart = trackTop - HOLD_TOP
      const rawProgress = (window.scrollY - holdStart) / holdDistance
      const waveProgress = (rawProgress - 0.12) / 0.88

      setWaveProgress(waveProgress)
      track.dataset.motionActive =
        rawProgress >= 0 && rawProgress <= 1 ? 'true' : 'false'
    }

    const queueProgressUpdate = () => {
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(updateProgress)
      }
    }

    const updateMeasurements = () => {
      const panelHeight = panel.offsetHeight
      const effectiveReducedMotion =
        reducedMotion || systemReducedQuery.matches
      const availableHeight =
        window.innerHeight - HOLD_TOP - HOLD_VIEWPORT_GUTTER

      holdEnabled =
        desktopQuery.matches &&
        !effectiveReducedMotion &&
        scenario !== 'long-copy' &&
        panelHeight <= availableHeight

      track.dataset.holdMode = holdEnabled ? 'hold' : 'flow'
      track.dataset.motionActive = 'false'
      track.style.setProperty(
        '--home-v4-join-panel-height',
        `${panelHeight}px`,
      )

      if (!holdEnabled) {
        holdDistance = 0
        track.style.removeProperty('--home-v4-join-hold-distance')
        setWaveProgress(0)
        return
      }

      holdDistance = Math.round(
        Math.min(
          HOLD_MAX_DISTANCE,
          Math.max(HOLD_MIN_DISTANCE, window.innerHeight * 0.78),
        ),
      )
      track.style.setProperty(
        '--home-v4-join-hold-distance',
        `${holdDistance}px`,
      )
      updateProgress()
    }

    const resizeObserver = new ResizeObserver(updateMeasurements)
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isNearViewport = entry.isIntersecting
        if (isNearViewport) {
          queueProgressUpdate()
        }
      },
      { rootMargin: '120% 0px 120% 0px' },
    )

    resizeObserver.observe(panel)
    intersectionObserver.observe(track)
    updateMeasurements()

    window.addEventListener('scroll', queueProgressUpdate, { passive: true })
    window.addEventListener('resize', updateMeasurements)
    desktopQuery.addEventListener('change', updateMeasurements)
    systemReducedQuery.addEventListener('change', updateMeasurements)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      window.removeEventListener('scroll', queueProgressUpdate)
      window.removeEventListener('resize', updateMeasurements)
      desktopQuery.removeEventListener('change', updateMeasurements)
      systemReducedQuery.removeEventListener('change', updateMeasurements)
      track.removeAttribute('data-hold-mode')
      track.removeAttribute('data-motion-active')
      track.removeAttribute('data-motion-state')
      track.removeAttribute('data-wave-progress')
      track.style.removeProperty('--home-v4-join-panel-height')
      track.style.removeProperty('--home-v4-join-hold-distance')
      track.style.removeProperty('--home-v4-join-progress')
      track.style.removeProperty('--home-v4-join-wave-y')
    }
  }, [reducedMotion, scenario])

  return (
    <section
      aria-labelledby="home-v4-join-title"
      className="home-v4-join-track"
      data-scenario={scenario}
      ref={trackRef}
    >
      <div className="home-v4-join__sticky-shell" ref={shellRef}>
        <div className="home-v4-join" ref={panelRef}>
          <div aria-hidden="true" className="home-v4-join__transition-mark">
            <span />
            <svg
              focusable="false"
              preserveAspectRatio="none"
              viewBox="0 0 240 52"
            >
              <path d="M0 2H48L120 50L192 2H240" />
            </svg>
            <span />
          </div>

          <div aria-hidden="true" className="home-v4-join__rail">
            <span>♫</span>
            <b>입단</b>
            <i />
          </div>

          <div className="home-v4-join__layout">
            <div className="home-v4-join__entry">
              <p className="home-v4-join__eyebrow">{fixture.eyebrow}</p>
              <h2 id="home-v4-join-title">
                {renderLines(fixture.title)}
              </h2>
              <p className="home-v4-join__description">
                {renderLines(fixture.description)}
              </p>

              <div
                aria-label="입단 안내 바로가기"
                className="home-v4-join__actions"
              >
                {fixture.ctas.map((cta) => (
                  <a
                    className={`home-v4-join__cta home-v4-join__cta--${cta.emphasis}`}
                    href={cta.href}
                    key={cta.label}
                  >
                    <span>{cta.label}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                ))}
              </div>

              <HomeV4JoinFacts facts={fixture.facts} />
            </div>

            <div className="home-v4-join__process">
              <div className="home-v4-join__process-heading">
                <p>{stepLabel}</p>
                <h3>{renderLines(fixture.processTitle)}</h3>
              </div>
              <HomeV4JoinSteps steps={visibleSteps} />
              <HomeV4JoinGuardianNote
                items={fixture.guardianItems}
                title={fixture.guardianTitle}
              />
            </div>
          </div>
        </div>

        <HomeV4JoinWaveTransition
          reducedMotion={reducedMotion}
          ref={waveRef}
        />
      </div>
    </section>
  )
}
