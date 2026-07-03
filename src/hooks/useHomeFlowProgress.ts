import { useEffect, useState } from 'react'

import { HOME_FLOW_SECTIONS, type HomeFlowSectionKey } from '../constants/homeFlow'

type HomeFlowProgress = {
  activeIndex: number
  activeKey: HomeFlowSectionKey
  progress: number
}

const sectionKeys = HOME_FLOW_SECTIONS.map((section) => section.key)

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function isHomeFlowSectionKey(value: string | undefined): value is HomeFlowSectionKey {
  return Boolean(value && sectionKeys.includes(value as HomeFlowSectionKey))
}

function getFlowSections() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-flow-section]'))
    .filter((section) => isHomeFlowSectionKey(section.dataset.flowSection))
    .sort((first, second) => first.offsetTop - second.offsetTop)
}

function readProgress(): HomeFlowProgress {
  const sections = getFlowSections()

  if (sections.length === 0) {
    return {
      activeIndex: 0,
      activeKey: HOME_FLOW_SECTIONS[0].key,
      progress: 0,
    }
  }

  const viewportTarget = window.innerHeight * 0.54
  const firstTop = sections[0].getBoundingClientRect().top + window.scrollY
  const lastSection = sections[sections.length - 1]
  const lastBottom =
    lastSection.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.22
  const progress = clamp((window.scrollY + viewportTarget - firstTop) / Math.max(1, lastBottom - firstTop))

  let activeElement = sections[0]
  let closestDistance = Number.POSITIVE_INFINITY

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect()

    if (rect.top <= viewportTarget && rect.bottom >= viewportTarget) {
      activeElement = section
      closestDistance = 0
      return
    }

    const sectionMidpoint = rect.top + rect.height * 0.5
    const distance = Math.abs(sectionMidpoint - viewportTarget)

    if (distance < closestDistance) {
      closestDistance = distance
      activeElement = section
    }
  })

  const activeKey = isHomeFlowSectionKey(activeElement.dataset.flowSection)
    ? activeElement.dataset.flowSection
    : HOME_FLOW_SECTIONS[0].key
  const activeIndex = Math.max(0, HOME_FLOW_SECTIONS.findIndex((section) => section.key === activeKey))

  return {
    activeIndex,
    activeKey,
    progress,
  }
}

export function useHomeFlowProgress() {
  const [state, setState] = useState<HomeFlowProgress>({
    activeIndex: 0,
    activeKey: HOME_FLOW_SECTIONS[0].key,
    progress: 0,
  })

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0

    const update = () => {
      frame = 0
      const nextState = readProgress()

      setState((currentState) => {
        if (Math.abs(currentState.progress - nextState.progress) < 0.003) {
          return currentState
        }

        return { ...currentState, progress: nextState.progress }
      })
    }

    const scheduleUpdate = () => {
      if (frame !== 0) {
        return
      }

      frame = window.requestAnimationFrame(update)
    }

    const reducedMotionUpdate = () => {
      if (reducedMotionQuery.matches) {
        setState((currentState) => ({ ...currentState, progress: 1 }))
        return
      }

      scheduleUpdate()
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    reducedMotionQuery.addEventListener('change', reducedMotionUpdate)

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    const flowSections = getFlowSections()
    flowSections.forEach((section) => resizeObserver.observe(section))

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]
        const section = visibleEntry?.target as HTMLElement | undefined

        if (!section || !isHomeFlowSectionKey(section.dataset.flowSection)) {
          return
        }

        const activeKey = section.dataset.flowSection
        const activeIndex = HOME_FLOW_SECTIONS.findIndex(
          (item) => item.key === activeKey,
        )

        setState((currentState) =>
          currentState.activeKey === activeKey
            ? currentState
            : { ...currentState, activeIndex, activeKey },
        )
      },
      {
        rootMargin: '-42% 0px -42% 0px',
        threshold: [0, 0.01, 0.5],
      },
    )
    flowSections.forEach((section) => sectionObserver.observe(section))

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame)
      }

      resizeObserver.disconnect()
      sectionObserver.disconnect()
      reducedMotionQuery.removeEventListener('change', reducedMotionUpdate)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  return state
}


