import { useEffect, type RefObject } from 'react'

const motionSurfaceSelector = [
  '.home-hero-section',
  '.home-quick-action-card',
  '.home-flow-body .interactive-card',
  '.home-about-grid a.group',
  '.home-about-grid [class*="min-h-44"]',
  '[data-flow-section="join-letter"] > .mx-auto > .reveal-motion > div',
  '.motion-program-book',
  '.spirit-scorebook',
  '.archive-l-folder',
  '.sponsor-quiet-panel',
  '.support-letter-card',
].join(',')

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function setStyleValue(element: HTMLElement, property: string, value: string) {
  if (element.style.getPropertyValue(property) !== value) {
    element.style.setProperty(property, value)
  }
}

export function useHomeMotionDirector(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current

    if (!root) {
      return
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('.home-flow-body [data-flow-section]'),
    )
    const visibleSections = new Set<HTMLElement>()
    let frameId = 0
    let pointerFrameId = 0
    let pendingPointer: {
      clientX: number
      clientY: number
      pointerType: string
      target: EventTarget | null
    } | null = null
    let activeSurface: HTMLElement | null = null

    const clearPointerSurface = () => {
      if (!activeSurface) {
        return
      }

      activeSurface.removeAttribute('data-motion-pointer')
      activeSurface.style.removeProperty('--motion-pointer-x')
      activeSurface.style.removeProperty('--motion-pointer-y')
      activeSurface.style.removeProperty('--motion-pointer-x-percent')
      activeSurface.style.removeProperty('--motion-pointer-y-percent')
      activeSurface.style.removeProperty('--motion-pointer-tilt-x')
      activeSurface.style.removeProperty('--motion-pointer-tilt-y')
      activeSurface.style.removeProperty('--motion-pointer-shift-x')
      activeSurface.style.removeProperty('--motion-pointer-shift-y')
      activeSurface.style.removeProperty('--motion-pointer-light-x')
      activeSurface.style.removeProperty('--motion-pointer-light-y')
      activeSurface = null
    }

    const updateSection = (section: HTMLElement, viewportHeight: number) => {
      const rect = section.getBoundingClientRect()
      const visible = rect.bottom > viewportHeight * 0.08 && rect.top < viewportHeight * 0.92
      const centerOffset = clamp(
        (rect.top + rect.height * 0.5 - viewportHeight * 0.5) / viewportHeight,
        -1,
        1,
      )
      const phase =
        rect.bottom <= viewportHeight * 0.22
          ? 'past'
          : rect.top >= viewportHeight * 0.78
            ? 'future'
            : 'current'

      section.dataset.motionVisible = visible ? 'true' : 'false'
      section.dataset.motionPhase = phase
      setStyleValue(section, '--motion-background-y', `${(centerOffset * 18).toFixed(2)}px`)
    }

    const updateSections = () => {
      frameId = 0
      const viewportHeight = Math.max(1, window.innerHeight)
      const sectionsToUpdate = visibleSections.size > 0 ? visibleSections : sections
      sectionsToUpdate.forEach((section) => updateSection(section, viewportHeight))

      root.dataset.motionReady = 'true'
    }

    const requestUpdate = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateSections)
    }

    const updatePointer = () => {
      pointerFrameId = 0
      const event = pendingPointer
      pendingPointer = null

      if (!event) {
        return
      }

      if (
        reducedMotionQuery.matches ||
        !finePointerQuery.matches ||
        event.pointerType === 'touch'
      ) {
        clearPointerSurface()
        return
      }

      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(motionSurfaceSelector)
        : null

      if (!target || !root.contains(target)) {
        clearPointerSurface()
        return
      }

      if (activeSurface !== target) {
        clearPointerSurface()
        activeSurface = target
        activeSurface.dataset.motionPointer = 'true'
      }

      const rect = target.getBoundingClientRect()
      const pointerX = clamp((event.clientX - rect.left) / Math.max(1, rect.width))
      const pointerY = clamp((event.clientY - rect.top) / Math.max(1, rect.height))

      setStyleValue(target, '--motion-pointer-x', pointerX.toFixed(3))
      setStyleValue(target, '--motion-pointer-y', pointerY.toFixed(3))
      setStyleValue(target, '--motion-pointer-x-percent', `${(pointerX * 100).toFixed(1)}%`)
      setStyleValue(target, '--motion-pointer-y-percent', `${(pointerY * 100).toFixed(1)}%`)
      setStyleValue(target, '--motion-pointer-tilt-x', `${((0.5 - pointerY) * 1.8).toFixed(2)}deg`)
      setStyleValue(target, '--motion-pointer-tilt-y', `${((pointerX - 0.5) * 2.4).toFixed(2)}deg`)
      setStyleValue(target, '--motion-pointer-shift-x', `${((0.5 - pointerX) * 12).toFixed(2)}px`)
      setStyleValue(target, '--motion-pointer-shift-y', `${((0.5 - pointerY) * 8).toFixed(2)}px`)
      setStyleValue(target, '--motion-pointer-light-x', `${((pointerX - 0.5) * 26).toFixed(2)}px`)
      setStyleValue(target, '--motion-pointer-light-y', `${((pointerY - 0.5) * 16).toFixed(2)}px`)
    }

    const handlePointerMove = (event: PointerEvent) => {
      pendingPointer = {
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: event.pointerType,
        target: event.target,
      }

      if (pointerFrameId === 0) {
        pointerFrameId = window.requestAnimationFrame(updatePointer)
      }
    }

    const handleMotionPreferenceChange = () => {
      clearPointerSurface()
      requestUpdate()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestUpdate()
      }
    }

    const resizeObserver = new ResizeObserver(requestUpdate)
    sections.forEach((section) => resizeObserver.observe(section))
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target as HTMLElement

          if (entry.isIntersecting) {
            visibleSections.add(section)
            updateSection(section, Math.max(1, window.innerHeight))
          } else {
            visibleSections.delete(section)
            section.dataset.motionVisible = 'false'
          }
        })
        requestUpdate()
      },
      { rootMargin: '20% 0px 20% 0px', threshold: 0 },
    )
    sections.forEach((section) => visibilityObserver.observe(section))

    updateSections()
    root.addEventListener('pointermove', handlePointerMove, { passive: true })
    root.addEventListener('pointerleave', clearPointerSurface)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    window.addEventListener('pageshow', requestUpdate)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    reducedMotionQuery.addEventListener('change', handleMotionPreferenceChange)
    finePointerQuery.addEventListener('change', handleMotionPreferenceChange)

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }
      if (pointerFrameId !== 0) {
        window.cancelAnimationFrame(pointerFrameId)
      }

      clearPointerSurface()
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      root.removeEventListener('pointermove', handlePointerMove)
      root.removeEventListener('pointerleave', clearPointerSurface)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      window.removeEventListener('pageshow', requestUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      reducedMotionQuery.removeEventListener('change', handleMotionPreferenceChange)
      finePointerQuery.removeEventListener('change', handleMotionPreferenceChange)
    }
  }, [rootRef])
}
