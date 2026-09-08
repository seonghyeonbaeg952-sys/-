import { useEffect, useState } from 'react'

export type HomeResponsiveViewport = 'mobile' | 'tablet' | 'desktop'

function readViewport(): HomeResponsiveViewport {
  if (typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches) {
    return 'desktop'
  }
  return window.matchMedia('(min-width: 768px)').matches ? 'tablet' : 'mobile'
}

export function useHomeResponsiveViewport(): HomeResponsiveViewport {
  const [viewport, setViewport] = useState<HomeResponsiveViewport>(readViewport)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const tablet = window.matchMedia('(min-width: 768px)')
    const update = () => setViewport(readViewport())
    desktop.addEventListener('change', update)
    tablet.addEventListener('change', update)
    update()
    return () => {
      desktop.removeEventListener('change', update)
      tablet.removeEventListener('change', update)
    }
  }, [])

  return viewport
}
