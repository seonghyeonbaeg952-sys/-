import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const desktopIntroQuery =
  '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

export function HomeHeroIntroOverlay() {
  const launchRef = useRef<HTMLDivElement>(null)
  const [shouldRenderIntro, setShouldRenderIntro] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(desktopIntroQuery).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(desktopIntroQuery)
    const handleChange = () => setShouldRenderIntro(query.matches)

    handleChange()
    query.addEventListener('change', handleChange)

    return () => query.removeEventListener('change', handleChange)
  }, [])

  useLayoutEffect(() => {
    const launchElement = launchRef.current

    if (!shouldRenderIntro || !launchElement) {
      return undefined
    }

    const root = document.documentElement
    const body = document.body
    const sweepElement = launchElement.querySelector<HTMLElement>(
      '.home-intro-launch__sweep',
    )
    const scrollKeys = new Set([
      ' ',
      'ArrowDown',
      'ArrowUp',
      'End',
      'Home',
      'PageDown',
      'PageUp',
      'Spacebar',
    ])
    const lockedScrollX = window.scrollX
    const lockedScrollY = window.scrollY
    const previousRootOverflow = root.style.overflow
    const previousRootOverscrollBehavior = root.style.overscrollBehavior
    const previousRootScrollbarGutter = root.style.scrollbarGutter
    const previousBodyOverflow = body.style.overflow
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior
    const previousBodyTouchAction = body.style.touchAction
    let isLocked = true
    let fallbackTimer = 0

    const keepScrollFixed = () => {
      if (window.scrollX !== lockedScrollX || window.scrollY !== lockedScrollY) {
        window.scrollTo({
          behavior: 'auto',
          left: lockedScrollX,
          top: lockedScrollY,
        })
      }
    }

    const preventScroll = (event: Event) => {
      if (!isLocked) {
        return
      }

      event.preventDefault()
      keepScrollFixed()
    }

    const preventScrollKey = (event: KeyboardEvent) => {
      if (!isLocked || !scrollKeys.has(event.key)) {
        return
      }

      event.preventDefault()
      keepScrollFixed()
    }

    const releaseScrollLock = () => {
      if (!isLocked) {
        return
      }

      isLocked = false
      root.style.overflow = previousRootOverflow
      root.style.overscrollBehavior = previousRootOverscrollBehavior
      root.style.scrollbarGutter = previousRootScrollbarGutter
      body.style.overflow = previousBodyOverflow
      body.style.overscrollBehavior = previousBodyOverscrollBehavior
      body.style.touchAction = previousBodyTouchAction
      window.removeEventListener('wheel', preventScroll, { capture: true })
      window.removeEventListener('touchmove', preventScroll, { capture: true })
      window.removeEventListener('keydown', preventScrollKey, { capture: true })
      window.removeEventListener('scroll', keepScrollFixed)
      keepScrollFixed()
    }

    root.style.overflow = 'hidden'
    root.style.overscrollBehavior = 'none'
    root.style.scrollbarGutter = 'stable'
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    body.style.touchAction = 'none'
    window.addEventListener('wheel', preventScroll, {
      capture: true,
      passive: false,
    })
    window.addEventListener('touchmove', preventScroll, {
      capture: true,
      passive: false,
    })
    window.addEventListener('keydown', preventScrollKey, { capture: true })
    window.addEventListener('scroll', keepScrollFixed, { passive: true })
    sweepElement?.addEventListener('animationend', releaseScrollLock, { once: true })
    fallbackTimer = window.setTimeout(releaseScrollLock, 3600)

    return () => {
      window.clearTimeout(fallbackTimer)
      sweepElement?.removeEventListener('animationend', releaseScrollLock)
      releaseScrollLock()
    }
  }, [shouldRenderIntro])

  useLayoutEffect(() => {
    const launchElement = launchRef.current
    const sampleRoot = launchElement?.closest('.home-intro-real-sample')
    const wordmarkElement = launchElement?.querySelector<HTMLElement>(
      '.home-intro-launch__wordmark',
    )
    const seedLetters = Array.from(
      launchElement?.querySelectorAll<HTMLElement>('.home-intro-launch__seed-letter') ?? [],
    )
    const launchWords = Array.from(
      launchElement?.querySelectorAll<HTMLElement>('.home-intro-launch__word') ?? [],
    )
    const titleElement = sampleRoot?.querySelector<HTMLElement>(
      '.home-hero-copy .home-hero-title-en',
    )

    if (
      !shouldRenderIntro ||
      !launchElement ||
      !sampleRoot ||
      !wordmarkElement ||
      !titleElement
    ) {
      return undefined
    }

    let animationFrameId = 0

    const applyTitleMetrics = () => {
      const rootRect = sampleRoot.getBoundingClientRect()
      const titleRect = titleElement.getBoundingClientRect()
      const titleStyles = window.getComputedStyle(titleElement)
      const setMetric = (name: string, value: string) => {
        launchElement.style.setProperty(name, value)
        wordmarkElement.style.setProperty(name, value)
      }

      setMetric('--intro-title-left', `${titleRect.left - rootRect.left}px`)
      setMetric('--intro-title-top', `${titleRect.top - rootRect.top}px`)
      setMetric('--intro-title-width', `${titleRect.width}px`)
      setMetric('--intro-title-font-size', titleStyles.fontSize)
      setMetric('--intro-title-line-height', titleStyles.lineHeight)

      const lineHeight = Number.parseFloat(titleStyles.lineHeight) || titleRect.height / 4
      const titleLeft = titleRect.left - rootRect.left
      const titleTop = titleRect.top - rootRect.top
      const startScale =
        Number.parseFloat(
          window.getComputedStyle(launchElement).getPropertyValue('--intro-start-scale'),
        ) || 0.8

      launchWords.forEach((word, index) => {
        const seedRect = seedLetters[index]?.getBoundingClientRect()

        if (!seedRect) {
          return
        }

        word.style.setProperty(
          '--intro-start-x',
          `${seedRect.left - rootRect.left - titleLeft}px`,
        )
        word.style.setProperty(
          '--intro-start-y',
          `${seedRect.top - rootRect.top - (titleTop + lineHeight * index)}px`,
        )
        word.style.setProperty('--intro-letter-width', `${seedRect.width / startScale}px`)
      })
    }

    const scheduleTitleMetrics = () => {
      window.cancelAnimationFrame(animationFrameId)
      animationFrameId = window.requestAnimationFrame(applyTitleMetrics)
    }

    const resizeObserver = new ResizeObserver(scheduleTitleMetrics)

    applyTitleMetrics()
    resizeObserver.observe(sampleRoot)
    resizeObserver.observe(titleElement)
    window.addEventListener('resize', scheduleTitleMetrics)
    document.fonts?.ready.then(scheduleTitleMetrics).catch(() => undefined)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleTitleMetrics)
    }
  }, [shouldRenderIntro])

  if (!shouldRenderIntro) {
    return null
  }

  return (
    <div aria-hidden="true" className="home-intro-launch" ref={launchRef}>
      <div className="home-intro-launch__field" />
      <div className="home-intro-launch__wordmark">
        <span className="home-intro-launch__word home-intro-launch__word--s">
          <span className="home-intro-launch__initial">S</span>
          <span className="home-intro-launch__tail">EOUL</span>
        </span>
        <span className="home-intro-launch__word home-intro-launch__word--m">
          <span className="home-intro-launch__initial">M</span>
          <span className="home-intro-launch__tail">OTET</span>
        </span>
        <span className="home-intro-launch__word home-intro-launch__word--y">
          <span className="home-intro-launch__initial">Y</span>
          <span className="home-intro-launch__tail">OUTH</span>
        </span>
        <span className="home-intro-launch__word home-intro-launch__word--c">
          <span className="home-intro-launch__initial">C</span>
          <span className="home-intro-launch__tail">HOIR</span>
        </span>
      </div>
      <div className="home-intro-launch__seed">
        <span className="home-intro-launch__seed-letter">S</span>
        <span className="home-intro-launch__seed-letter">M</span>
        <span className="home-intro-launch__seed-letter">Y</span>
        <span className="home-intro-launch__seed-letter">C</span>
      </div>
      <div className="home-intro-launch__shutters">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="home-intro-launch__sweep" />
    </div>
  )
}
