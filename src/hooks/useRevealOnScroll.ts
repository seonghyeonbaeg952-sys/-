import { useEffect, useRef, useState } from 'react'

type UseRevealOnScrollOptions = {
  disabled?: boolean
  once?: boolean
  rootMargin?: string
  threshold?: number
}

type ObserverSubscriber = (entry: IntersectionObserverEntry) => void

type ObserverPool = {
  observer: IntersectionObserver
  subscribers: Map<Element, Set<ObserverSubscriber>>
}

const observerPools = new Map<string, ObserverPool>()

function createObserverKey(rootMargin: string, threshold: number) {
  return `${rootMargin}|${threshold}`
}

function observeWithPool(
  element: Element,
  rootMargin: string,
  threshold: number,
  subscriber: ObserverSubscriber,
) {
  const key = createObserverKey(rootMargin, threshold)
  let pool = observerPools.get(key)

  if (!pool) {
    const subscribers = new Map<Element, Set<ObserverSubscriber>>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          subscribers.get(entry.target)?.forEach((callback) => callback(entry))
        })
      },
      { rootMargin, threshold },
    )

    pool = { observer, subscribers }
    observerPools.set(key, pool)
  }

  let elementSubscribers = pool.subscribers.get(element)

  if (!elementSubscribers) {
    elementSubscribers = new Set()
    pool.subscribers.set(element, elementSubscribers)
    pool.observer.observe(element)
  }

  elementSubscribers.add(subscriber)

  return () => {
    const currentPool = observerPools.get(key)
    const currentSubscribers = currentPool?.subscribers.get(element)

    if (!currentPool || !currentSubscribers) {
      return
    }

    currentSubscribers.delete(subscriber)

    if (currentSubscribers.size === 0) {
      currentPool.observer.unobserve(element)
      currentPool.subscribers.delete(element)
    }

    if (currentPool.subscribers.size === 0) {
      currentPool.observer.disconnect()
      observerPools.delete(key)
    }
  }
}

function getReducedMotionPreference() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useRevealOnScroll<TElement extends HTMLElement>({
  disabled = false,
  once = true,
  rootMargin = '0px 0px -8% 0px',
  threshold = 0.15,
}: UseRevealOnScrollOptions = {}) {
  const ref = useRef<TElement | null>(null)
  const [isVisible, setIsVisible] = useState(() => {
    if (
      disabled ||
      getReducedMotionPreference() ||
      (typeof window !== 'undefined' && !('IntersectionObserver' in window))
    ) {
      return true
    }

    return false
  })
  const shouldRevealImmediately =
    disabled ||
    getReducedMotionPreference() ||
    (typeof window !== 'undefined' && !('IntersectionObserver' in window))

  useEffect(() => {
    if (shouldRevealImmediately) {
      return
    }

    const element = ref.current

    if (!element) {
      return
    }

    const elementHeight = element.getBoundingClientRect().height
    const isTallElement = elementHeight > window.innerHeight * 0.75
    const effectiveThreshold = isTallElement ? Math.min(threshold, 0.05) : threshold

    let stopObserving = () => {}
    stopObserving = observeWithPool(
      element,
      rootMargin,
      effectiveThreshold,
      (entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true)

          if (once) {
            stopObserving()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
    )

    return stopObserving
  }, [once, rootMargin, shouldRevealImmediately, threshold])

  return { isVisible: shouldRevealImmediately || isVisible, ref }
}
