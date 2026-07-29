import { useEffect, useLayoutEffect, useRef } from 'react'

import { HomeV4SampleHeader } from '../../components/sample/home-v4/HomeV4SampleHeader'
import { Footer } from '../../components/layout/Footer'
import { HomeRoute } from '../public/HomeRoute'
import '../../styles/color-sample-theme.css'
import './HomeV4SamplePage.css'

const V4_FINALE_HOLD_TOP = 96

export function HomeV4SamplePage() {
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [])

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

      const fixedStart = trackTop - V4_FINALE_HOLD_TOP
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

  return (
    <div
      className="public-shell color-sample-theme min-h-screen bg-bg-warm-white text-text-charcoal public-shell-home public-shell-home-sample-v4"
      data-design-candidate="home-v4"
      data-public-theme="white-orange"
      data-sample-mirror="production-home"
      data-surface-rule="rectilinear"
      ref={shellRef}
    >
      <a
        className="home-v4-skip-link"
        href="#main-content"
      >
        본문으로 바로가기
      </a>
      <HomeV4SampleHeader />
      <main id="main-content" tabIndex={-1}>
        <HomeRoute
          aboutPresentation="collective-portrait"
          joinOpenScorePresentation="figma-open-score"
        />
      </main>
      <Footer />
    </div>
  )
}
