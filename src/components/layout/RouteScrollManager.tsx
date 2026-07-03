import { useEffect } from 'react'
import { useLocation } from 'react-router'

const HASH_SCROLL_RETRY_LIMIT = 24
const HASH_SCROLL_RETRY_DELAY = 80

function getHashTarget(hash: string) {
  const rawId = hash.replace(/^#/, '')

  if (!rawId) {
    return null
  }

  try {
    return document.getElementById(decodeURIComponent(rawId))
  } catch {
    return document.getElementById(rawId)
  }
}

export function RouteScrollManager() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    return () => {
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    if (!location.hash) {
      window.scrollTo({ behavior: 'auto', left: 0, top: 0 })
      return undefined
    }

    let retryCount = 0
    let timeoutId: ReturnType<typeof window.setTimeout> | null = null

    const scrollToHash = () => {
      const target = getHashTarget(location.hash)

      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' })
        return
      }

      if (retryCount < HASH_SCROLL_RETRY_LIMIT) {
        retryCount += 1
        timeoutId = window.setTimeout(scrollToHash, HASH_SCROLL_RETRY_DELAY)
      }
    }

    timeoutId = window.setTimeout(scrollToHash, 0)

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [location.hash, location.pathname, location.search])

  return null
}
