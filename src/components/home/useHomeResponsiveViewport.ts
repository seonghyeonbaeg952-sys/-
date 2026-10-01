import { useEffect, useState } from 'react'

export type HomeResponsiveViewport = 'mobile' | 'tablet' | 'desktop'

export function classifyHomeViewport({
  width,
  height,
  coarsePointer,
}: {
  width: number
  height: number
  coarsePointer: boolean
}): HomeResponsiveViewport {
  if (width < 768 || (width <= 1000 && width > height && height <= 550)) {
    return 'mobile'
  }

  const tabletProportionedLandscape =
    width <= 1600 && height >= 900 && width / height <= 1.5

  if (width < 1366 || coarsePointer || tabletProportionedLandscape) {
    return 'tablet'
  }

  return 'desktop'
}

function readViewport(): HomeResponsiveViewport {
  if (typeof window === 'undefined') return 'desktop'
  return classifyHomeViewport({
    width: window.innerWidth,
    height: window.innerHeight,
    coarsePointer:
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(any-pointer: coarse)').matches,
  })
}

export function useHomeResponsiveViewport(): HomeResponsiveViewport {
  const [viewport, setViewport] = useState<HomeResponsiveViewport>(readViewport)

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)')
    const anyCoarsePointer = window.matchMedia('(any-pointer: coarse)')
    const update = () => setViewport(readViewport())
    window.addEventListener('resize', update)
    coarsePointer.addEventListener('change', update)
    anyCoarsePointer.addEventListener('change', update)
    update()
    return () => {
      window.removeEventListener('resize', update)
      coarsePointer.removeEventListener('change', update)
      anyCoarsePointer.removeEventListener('change', update)
    }
  }, [])

  return viewport
}
