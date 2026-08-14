import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import {
  getAboutSectionCopy,
  homeSpiritBookletPages,
} from '../../constants/spiritContent'
import type { AboutSectionRow } from '../../types/cms'
import type { HomeContentV2 } from '../../types/homeContent'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { HomeSpiritEditorial } from './HomeSpiritEditorial'
import '../../styles/home-spirit-chorus-orbit.css'

type HomeSpiritChorusOrbitProps = {
  sections: AboutSectionRow[]
  wrapper: HomeContentV2['spiritWrapper']
}

type OrbitNodeStyle = CSSProperties & {
  '--orbit-node-delay': string
}

const desktopSpiritQuery = '(min-width: 1024px)'
const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

const movementLabels = [
  '이름',
  '정직한 음악',
  '교회음악',
  '공동체',
  '다음 세대',
] as const

function createPages(
  sections: AboutSectionRow[],
  defaultCtaLabel: string,
) {
  return homeSpiritBookletPages.map((page) =>
    getAboutSectionCopy(sections, `home_spirit_${page.id}`, {
      body: page.body,
      ctaLabel: page.ctaLabel || defaultCtaLabel,
      ctaUrl: page.ctaHref,
      eyebrow: page.eyebrow,
      subtitle: page.summary,
      title: page.title,
    }),
  )
}

function useDesktopSpiritLayout() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(desktopSpiritQuery).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(desktopSpiritQuery)
    const update = () => setIsDesktop(query.matches)

    update()
    query.addEventListener('change', update)

    return () => query.removeEventListener('change', update)
  }, [])

  return isDesktop
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(reducedMotionQuery).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(reducedMotionQuery)
    const update = () => setPrefersReducedMotion(query.matches)

    update()
    query.addEventListener('change', update)

    return () => query.removeEventListener('change', update)
  }, [])

  return prefersReducedMotion
}

function HomeSpiritChorusOrbitDesktop({
  sections,
  wrapper,
}: HomeSpiritChorusOrbitProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hoverCloseTimerRef = useRef<number | null>(null)
  const pages = useMemo(
    () => createPages(sections, wrapper.ctaLabel),
    [sections, wrapper.ctaLabel],
  )
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [hasEntered, setHasEntered] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia(reducedMotionQuery).matches,
  )

  useEffect(() => {
    if (hasEntered) {
      return
    }

    const section = sectionRef.current
    const motionPreference = window.matchMedia(reducedMotionQuery)

    if (!section || motionPreference.matches || !('IntersectionObserver' in window)) {
      setHasEntered(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasEntered(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.28,
      },
    )

    const revealWithoutMotion = () => {
      if (motionPreference.matches) {
        setHasEntered(true)
        observer.disconnect()
      }
    }

    observer.observe(section)
    motionPreference.addEventListener('change', revealWithoutMotion)

    return () => {
      observer.disconnect()
      motionPreference.removeEventListener('change', revealWithoutMotion)
    }
  }, [hasEntered])

  useEffect(
    () => () => {
      if (hoverCloseTimerRef.current !== null) {
        window.clearTimeout(hoverCloseTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    if (!hasEntered || prefersReducedMotion) {
      video.pause()
      return
    }

    void video.play().catch(() => {
      // The poster remains visible when a browser blocks decorative autoplay.
    })
  }, [hasEntered, prefersReducedMotion, wrapper.backgroundVideoUrl])

  const activeIndex = focusedIndex ?? hoveredIndex
  const activePage = activeIndex === null ? null : pages[activeIndex]
  const activeNumber = String((activeIndex ?? 0) + 1).padStart(2, '0')
  const orbitHeadlineLines = wrapper.orbitHeadline
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const cancelHoverClose = () => {
    if (hoverCloseTimerRef.current === null) {
      return
    }

    window.clearTimeout(hoverCloseTimerRef.current)
    hoverCloseTimerRef.current = null
  }

  const showHoveredPage = (index: number) => {
    cancelHoverClose()
    setHoveredIndex(index)
  }

  const queueHoverClose = () => {
    cancelHoverClose()
    hoverCloseTimerRef.current = window.setTimeout(() => {
      setHoveredIndex(null)
      hoverCloseTimerRef.current = null
    }, 160)
  }

  return (
    <section
      aria-labelledby="home-spirit-chorus-orbit-heading"
      className="flow-section home-section home-spirit-chorus-orbit"
      data-flow-section="spirit"
      data-orbit-motion={hasEntered ? 'entered' : 'idle'}
      id="home-spirit-chorus-orbit"
      ref={sectionRef}
    >
      <div aria-hidden="true" className="home-spirit-chorus-orbit__media">
        <video
          className="home-spirit-chorus-orbit__video"
          disablePictureInPicture
          loop
          muted
          playsInline
          poster={wrapper.backgroundPosterUrl}
          preload="metadata"
          ref={videoRef}
          tabIndex={-1}
        >
          <source src={wrapper.backgroundVideoUrl} type="video/mp4" />
        </video>
        <span className="home-spirit-chorus-orbit__video-scrim" />
      </div>

      <HomeSectionStaffCue
        className="home-section-staff-cue--spirit"
        label="정신"
        noteOffset={21}
        symbol="♫"
      />

      <Container className="home-spirit-chorus-orbit__container">
        <div className="home-spirit-chorus-orbit__datum">
          <span>SPIRIT STUDY 07 · CHORUS ORBIT</span>
          <i aria-hidden="true" />
        </div>

        <div className="home-spirit-chorus-orbit__stage">
          <div
            aria-hidden="true"
            className="home-spirit-chorus-orbit__geometry"
          >
            <span className="home-spirit-chorus-orbit__breath" />
            <span className="home-spirit-chorus-orbit__ring home-spirit-chorus-orbit__ring--outer" />
            <span className="home-spirit-chorus-orbit__ring home-spirit-chorus-orbit__ring--inner" />
            <span className="home-spirit-chorus-orbit__voice-path">
              <span className="home-spirit-chorus-orbit__voice-dot" />
            </span>
          </div>

          <div
            className="home-spirit-chorus-orbit__center"
            data-detail-open={activePage ? 'true' : 'false'}
          >
            <span
              aria-hidden="true"
              className="home-spirit-chorus-orbit__watermark"
            >
              SPIRIT
            </span>
            <div
              aria-hidden={activePage ? 'true' : undefined}
              className="home-spirit-chorus-orbit__center-default"
            >
              <p className="home-spirit-chorus-orbit__eyebrow">
                {wrapper.orbitEyebrow}
              </p>
              <h2
                className="home-spirit-chorus-orbit__headline"
                id="home-spirit-chorus-orbit-heading"
              >
                {orbitHeadlineLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
              <p className="home-spirit-chorus-orbit__signature">
                {wrapper.orbitSignature}
              </p>
            </div>

            <div
              aria-atomic="true"
              aria-hidden={activePage ? undefined : 'true'}
              aria-live="polite"
              className="home-spirit-chorus-orbit__detail"
              id="home-spirit-chorus-orbit-detail"
              role="status"
            >
              {activePage ? (
                <>
                  <p className="home-spirit-chorus-orbit__detail-eyebrow">
                    {activeNumber} · {activePage.eyebrow}
                  </p>
                  <h3 className="home-spirit-chorus-orbit__detail-title">
                    {activePage.title}
                  </h3>
                  <p className="home-spirit-chorus-orbit__detail-body">
                    {activePage.body}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <ol
            aria-label="서울모테트청소년합창단의 다섯 가지 정신"
            className="home-spirit-chorus-orbit__values"
          >
            {pages.map((page, index) => (
              <li
                className="home-spirit-chorus-orbit__value"
                data-active={activeIndex === index ? 'true' : 'false'}
                data-orbit-node={index + 1}
                key={homeSpiritBookletPages[index].id}
                style={
                  {
                    '--orbit-node-delay': `${1680 + index * 480}ms`,
                  } as OrbitNodeStyle
                }
              >
                <button
                  aria-controls="home-spirit-chorus-orbit-detail"
                  aria-expanded={activeIndex === index}
                  aria-label={`${movementLabels[index]}: ${page.title}`}
                  className="home-spirit-chorus-orbit__value-trigger"
                  onBlur={() => setFocusedIndex(null)}
                  onFocus={() => setFocusedIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.preventDefault()
                      setFocusedIndex(null)
                      setHoveredIndex(null)
                      event.currentTarget.blur()
                    }
                  }}
                  onPointerEnter={() => showHoveredPage(index)}
                  onPointerLeave={queueHoverClose}
                  title={page.title}
                  type="button"
                >
                  <span className="home-spirit-chorus-orbit__value-motion">
                    <span
                      aria-hidden="true"
                      className="home-spirit-chorus-orbit__value-halo"
                    />
                    <span
                      aria-hidden="true"
                      className="home-spirit-chorus-orbit__value-dot"
                    />
                    <span className="home-spirit-chorus-orbit__value-copy">
                      <b>{String(index + 1).padStart(2, '0')}</b>
                      <span>{movementLabels[index]}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="home-spirit-chorus-orbit__action">
          <Button
            className="home-spirit-chorus-orbit__cta"
            href="/spirit"
            size="sm"
            variant="secondary"
          >
            {wrapper.ctaLabel}
          </Button>
        </div>
      </Container>
    </section>
  )
}

export function HomeSpiritChorusOrbit(props: HomeSpiritChorusOrbitProps) {
  const isDesktop = useDesktopSpiritLayout()

  if (!isDesktop) {
    return <HomeSpiritEditorial {...props} />
  }

  return <HomeSpiritChorusOrbitDesktop {...props} />
}
