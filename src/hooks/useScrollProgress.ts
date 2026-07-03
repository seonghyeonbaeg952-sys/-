import { useEffect, useRef, useState } from 'react'

type UseScrollProgressOptions = {
  disabled?: boolean
  endOffset?: number
  startOffset?: number
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useScrollProgress<TElement extends HTMLElement>({
  disabled = false,
  endOffset = 0.24,
  startOffset = 0.78,
}: UseScrollProgressOptions = {}) {
  const ref = useRef<TElement | null>(null)
  const [progress, setProgress] = useState(0)
  const shouldUseStaticProgress = disabled || prefersReducedMotion()

  useEffect(() => {
    if (disabled || prefersReducedMotion()) {
      return
    }

    const element = ref.current

    if (!element) {
      return
    }

    let frameId = 0
    let lastProgress = -1

    const updateProgress = () => {
      frameId = 0

      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight || 1
      const scrollY = window.scrollY || window.pageYOffset
      const documentTop = rect.top + scrollY
      const documentBottom = documentTop + rect.height
      const start = documentTop - viewportHeight * startOffset
      const end = documentBottom - viewportHeight * endOffset
      const nextProgress = clamp((scrollY - start) / Math.max(1, end - start))

      if (Math.abs(nextProgress - lastProgress) > 0.004) {
        lastProgress = nextProgress
        setProgress(nextProgress)
      }
    }

    const requestUpdate = () => {
      if (frameId !== 0) {
        return
      }

      frameId = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
    }
  }, [disabled, endOffset, startOffset])

  return { progress: shouldUseStaticProgress ? 1 : progress, ref }
}
