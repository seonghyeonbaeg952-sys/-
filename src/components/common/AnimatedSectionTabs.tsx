import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { classNames } from '../../utils/classNames'
import { TransitionLink } from './TransitionLink'

export type AnimatedSectionTab<TValue extends string = string> = {
  disabled?: boolean
  href?: string
  label: string
  value: TValue
}

type IndicatorState = {
  height: number
  visible: boolean
  width: number
  x: number
  y: number
}

type AnimatedSectionTabsProps<TValue extends string = string> = {
  activeValue: TValue
  ariaLabel: string
  className?: string
  onChange?: (value: TValue) => void
  tabs: Array<AnimatedSectionTab<TValue>>
  tone?: 'gold' | 'navy'
}

const initialIndicator: IndicatorState = {
  height: 0,
  visible: false,
  width: 0,
  x: 0,
  y: 0,
}

function getEnabledTabs<TValue extends string>(
  tabs: Array<AnimatedSectionTab<TValue>>,
) {
  return tabs.filter((tab) => !tab.disabled)
}

export function AnimatedSectionTabs<TValue extends string = string>({
  activeValue,
  ariaLabel,
  className,
  onChange,
  tabs,
  tone = 'gold',
}: AnimatedSectionTabsProps<TValue>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLElement | null>>({})
  const [indicator, setIndicator] = useState<IndicatorState>(initialIndicator)

  const updateIndicator = useCallback(() => {
    const container = containerRef.current
    const activeTab = tabRefs.current[activeValue]

    if (!container || !activeTab) {
      setIndicator((current) =>
        current.visible ? { ...current, visible: false } : current,
      )
      return
    }

    const containerRect = container.getBoundingClientRect()
    const tabRect = activeTab.getBoundingClientRect()

    setIndicator({
      height: tabRect.height,
      visible: true,
      width: tabRect.width,
      x: tabRect.left - containerRect.left + container.scrollLeft,
      y: tabRect.top - containerRect.top + container.scrollTop,
    })
  }, [activeValue])

  useLayoutEffect(() => {
    updateIndicator()
  }, [tabs.length, updateIndicator])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const handleResize = () => updateIndicator()
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(handleResize)

    resizeObserver?.observe(container)
    window.addEventListener('resize', handleResize)
    container.addEventListener('scroll', handleResize, { passive: true })

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', handleResize)
      container.removeEventListener('scroll', handleResize)
    }
  }, [updateIndicator])

  const activateTab = (tab: AnimatedSectionTab<TValue>) => {
    if (tab.disabled) {
      return
    }

    onChange?.(tab.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabledTabs = getEnabledTabs(tabs)
    const currentIndex = enabledTabs.findIndex((tab) => tab.value === activeValue)

    if (currentIndex === -1) {
      return
    }

    let nextIndex: number

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % enabledTabs.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = enabledTabs.length - 1
    } else {
      return
    }

    event.preventDefault()

    const nextTab = enabledTabs[nextIndex]
    const nextElement = tabRefs.current[nextTab.value]

    nextElement?.focus()
    activateTab(nextTab)

    if (nextTab.href) {
      nextElement?.click()
    }
  }

  const indicatorStyle = {
    '--tab-indicator-height': `${indicator.height}px`,
    '--tab-indicator-opacity': indicator.visible ? 1 : 0,
    '--tab-indicator-width': `${indicator.width}px`,
    '--tab-indicator-x': `${indicator.x}px`,
    '--tab-indicator-y': `${indicator.y}px`,
  } as CSSProperties

  return (
    <nav aria-label={ariaLabel} className={className}>
      <div
        className="animated-section-tabs"
        data-tone={tone}
        onKeyDown={handleKeyDown}
        ref={containerRef}
        role="tablist"
        style={indicatorStyle}
      >
        <span aria-hidden="true" className="section-tabs-indicator" />
        {tabs.map((tab) => {
          const isActive = activeValue === tab.value
          const tabClassName = classNames(
            'section-tab',
            isActive && 'is-active',
            tab.disabled && 'is-disabled',
          )
          const commonProps = {
            'aria-disabled': tab.disabled || undefined,
            'aria-selected': isActive,
            className: tabClassName,
            ref: (node: HTMLElement | null) => {
              tabRefs.current[tab.value] = node
            },
            role: 'tab',
            tabIndex: isActive ? 0 : -1,
          }

          if (tab.href) {
            const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
              if (tab.disabled) {
                event.preventDefault()
                return
              }

              onChange?.(tab.value)
            }

            return (
              <TransitionLink
                {...commonProps}
                aria-current={isActive ? 'page' : undefined}
                key={tab.value}
                onClick={handleClick}
                to={tab.href}
              >
                {tab.label}
              </TransitionLink>
            )
          }

          return (
            <button
              {...commonProps}
              disabled={tab.disabled}
              key={tab.value}
              onClick={() => activateTab(tab)}
              type="button"
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
