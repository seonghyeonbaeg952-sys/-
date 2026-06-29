import { useEffect, useRef, useState } from 'react'

type UseRevealOnScrollOptions = {
  disabled?: boolean
  once?: boolean
  rootMargin?: string
  threshold?: number
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)

          if (once) {
            observer.disconnect()
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [once, rootMargin, shouldRevealImmediately, threshold])

  return { isVisible: shouldRevealImmediately || isVisible, ref }
}
