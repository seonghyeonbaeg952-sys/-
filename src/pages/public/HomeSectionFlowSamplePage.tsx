import { useLayoutEffect } from 'react'

import { HomePage } from './HomePage'
import '../../styles/home-v6-fixes.css'
import '../../styles/home-premium-polish.css'
import '../../styles/home-global-refinement.css'
import '../../styles/home-section-flow-sample.css'
import '../../styles/home-spirit-editorial.css'

type HomeSectionFlowExperienceProps = {
  showPreviewStatus?: boolean
  useEditorialSpirit?: boolean
}

function HomeSectionFlowExperience({
  showPreviewStatus = false,
  useEditorialSpirit = false,
}: HomeSectionFlowExperienceProps) {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('.home-section-flow-sample')

    if (!root) {
      return
    }

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    )
    let frame = 0

    const getTracks = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>('.home-flow-sample-hold-track'),
      )

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
      getTracks().forEach((track) => {
        track.removeAttribute('data-hold-state')
        track.style.removeProperty('--sample-hold-height')
        track.style.removeProperty('--sample-hold-top')
      })
    }

    const update = () => {
      frame = 0

      if (!desktopQuery.matches || reducedMotionQuery.matches) {
        reset()
        return
      }

      getTracks().forEach((track) => {
        const panel = track.querySelector<HTMLElement>(
          '.home-flow-sample-hold__panel',
        )

        if (!panel) {
          return
        }

        const panelHeight = panel.offsetHeight
        const isFullPanel = track.classList.contains(
          'home-flow-sample-hold-track--full',
        )
        const holdTop = isFullPanel
          ? Math.min(20, window.innerHeight - panelHeight - 16)
          : 143
        const panelHeightValue = `${panelHeight}px`
        const holdTopValue = `${holdTop}px`

        if (
          track.style.getPropertyValue('--sample-hold-height') !==
          panelHeightValue
        ) {
          track.style.setProperty('--sample-hold-height', panelHeightValue)
        }
        if (
          track.style.getPropertyValue('--sample-hold-top') !== holdTopValue
        ) {
          track.style.setProperty('--sample-hold-top', holdTopValue)
        }

        const trackTop = getDocumentTop(track)
        const trackHeight = track.offsetHeight
        const fixedStart = trackTop - holdTop
        const currentChunk = track.closest<HTMLElement>(
          '.home-flow-sample-chunk',
        )
        const nextChunk = currentChunk?.nextElementSibling as HTMLElement | null
        const coverDepth = Math.min(
          104,
          Math.max(72, window.innerWidth * 0.07),
        )
        const fixedEnd = nextChunk
          ? getDocumentTop(nextChunk) - holdTop + coverDepth
          : trackTop + trackHeight - panelHeight - holdTop

        let nextState: 'before' | 'fixed' | 'ended'
        if (window.scrollY < fixedStart) {
          nextState = 'before'
        } else if (window.scrollY <= fixedEnd) {
          nextState = 'fixed'
        } else {
          nextState = 'ended'
        }

        if (track.dataset.holdState !== nextState) {
          track.dataset.holdState = nextState
        }
      })
    }

    const queueUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update)
      }
    }

    const resizeObserver = new ResizeObserver(queueUpdate)
    getTracks().forEach((track) => {
      const panel = track.querySelector<HTMLElement>(
        '.home-flow-sample-hold__panel',
      )

      if (panel) {
        resizeObserver.observe(panel)
      }
    })
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', queueUpdate)
    desktopQuery.addEventListener('change', queueUpdate)
    reducedMotionQuery.addEventListener('change', queueUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', queueUpdate)
      desktopQuery.removeEventListener('change', queueUpdate)
      reducedMotionQuery.removeEventListener('change', queueUpdate)
      reset()
    }
  }, [])

  return (
    <div className="home-section-flow-sample">
      <HomePage
        mode="section-flow-sample"
        spiritPresentation={useEditorialSpirit ? 'editorial' : 'scorebook'}
      />
      {showPreviewStatus ? (
        <aside
          aria-label="Sample preview status"
          className="home-section-flow-sample__status"
        >
          <strong>FLOW SAMPLE</strong>
          <span>Preview only</span>
        </aside>
      ) : null}
    </div>
  )
}

export function HomeSectionFlowPage() {
  return <HomeSectionFlowExperience useEditorialSpirit />
}

export function HomeSectionFlowSamplePage() {
  return <HomeSectionFlowExperience showPreviewStatus useEditorialSpirit />
}
