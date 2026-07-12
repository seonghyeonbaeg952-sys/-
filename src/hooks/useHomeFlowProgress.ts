import { useEffect } from 'react'

import { HOME_FLOW_SECTIONS, type HomeFlowSectionKey } from '../constants/homeFlow'

export type HomeFlowProgress = {
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

type MeasuredSection = {
  bottom: number
  element: HTMLElement
  midpoint: number
  top: number
}

function measureSections(sections: HTMLElement[]): MeasuredSection[] {
  const scrollY = window.scrollY

  return sections.map((element) => {
    const rect = element.getBoundingClientRect()
    const top = rect.top + scrollY
    const bottom = rect.bottom + scrollY

    return { bottom, element, midpoint: top + rect.height * 0.5, top }
  })
}

function readProgress(sections: MeasuredSection[]): HomeFlowProgress {

  if (sections.length === 0) {
    return {
      activeIndex: 0,
      activeKey: HOME_FLOW_SECTIONS[0].key,
      progress: 0,
    }
  }

  const viewportTarget = window.innerHeight * 0.54
  const firstTop = sections[0].top
  const lastSection = sections[sections.length - 1]
  const lastBottom = lastSection.bottom - window.innerHeight * 0.22
  const progress = clamp((window.scrollY + viewportTarget - firstTop) / Math.max(1, lastBottom - firstTop))

  let activeElement = sections[0].element
  let closestDistance = Number.POSITIVE_INFINITY
  const documentTarget = window.scrollY + viewportTarget

  sections.forEach((section) => {
    if (section.top <= documentTarget && section.bottom >= documentTarget) {
      activeElement = section.element
      closestDistance = 0
      return
    }

    const distance = Math.abs(section.midpoint - documentTarget)

    if (distance < closestDistance) {
      closestDistance = distance
      activeElement = section.element
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

export function useHomeFlowProgress(
  onChange: (state: HomeFlowProgress) => void,
) {
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const flowSections = getFlowSections()
    let measuredSections = measureSections(flowSections)
    let frame = 0
    let currentState: HomeFlowProgress = {
      activeIndex: 0,
      activeKey: HOME_FLOW_SECTIONS[0].key,
      progress: 0,
    }

    const commitState = (nextState: HomeFlowProgress) => {
      const progressChanged = Math.abs(currentState.progress - nextState.progress) >= 0.003
      const activeChanged =
        currentState.activeKey !== nextState.activeKey ||
        currentState.activeIndex !== nextState.activeIndex

      if (!progressChanged && !activeChanged) {
        return
      }

      currentState = {
        progress: progressChanged ? nextState.progress : currentState.progress,
        activeKey: nextState.activeKey,
        activeIndex: nextState.activeIndex,
      }
      onChange(currentState)
    }

    const update = () => {
      frame = 0
      commitState(readProgress(measuredSections))
    }

    const scheduleUpdate = () => {
      if (frame !== 0) {
        return
      }

      frame = window.requestAnimationFrame(update)
    }

    const measureAndSchedule = () => {
      measuredSections = measureSections(flowSections)
      scheduleUpdate()
    }

    const reducedMotionUpdate = () => {
      if (reducedMotionQuery.matches) {
        commitState({ ...currentState, progress: 1 })
        return
      }

      scheduleUpdate()
    }

    scheduleUpdate()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', measureAndSchedule)
    reducedMotionQuery.addEventListener('change', reducedMotionUpdate)

    const resizeObserver = new ResizeObserver(measureAndSchedule)
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

        commitState({ ...currentState, activeIndex, activeKey })
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
      window.removeEventListener('resize', measureAndSchedule)
    }
  }, [onChange])
}


