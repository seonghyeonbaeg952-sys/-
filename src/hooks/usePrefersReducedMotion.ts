import { useEffect, useState } from 'react'

function getPrefersReducedMotion() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    getPrefersReducedMotion,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setPrefersReducedMotion(query.matches)

    handleChange()
    query.addEventListener('change', handleChange)

    return () => {
      query.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotion
}

