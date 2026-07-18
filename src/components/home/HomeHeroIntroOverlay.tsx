import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const desktopIntroQuery =
  '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'

export function HomeHeroIntroOverlay() {
  const launchRef = useRef<HTMLDivElement>(null)
  const [shouldRenderIntro, setShouldRenderIntro] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(desktopIntroQuery).matches,
  )
  const [isAnimationReady, setIsAnimationReady] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(desktopIntroQuery)
    const handleChange = () => setShouldRenderIntro(query.matches)

    handleChange()
    query.addEventListener('change', handleChange)

    return () => query.removeEventListener('change', handleChange)
  }, [])

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
    let fontTimeoutId = 0
    let isCancelled = false

    const applyTitleMetrics = () => {
      const rootRect = sampleRoot.getBoundingClientRect()
      const titleRect = titleElement.getBoundingClientRect()
      const titleStyles = window.getComputedStyle(titleElement)
      const revealElement = titleElement.closest<HTMLElement>('.reveal-motion')
      const revealStyles = revealElement ? window.getComputedStyle(revealElement) : null
      const revealTransform = revealStyles?.transform ?? 'none'
      const revealMatrix =
        revealTransform && revealTransform !== 'none'
          ? new DOMMatrixReadOnly(revealTransform)
          : null
      const revealTranslateParts =
        revealStyles?.translate && revealStyles.translate !== 'none'
          ? revealStyles.translate.split(' ')
          : []
      const revealScaleParts =
        revealStyles?.scale && revealStyles.scale !== 'none'
          ? revealStyles.scale.split(' ')
          : []
      const revealTranslateX =
        (revealMatrix?.m41 ?? 0) +
        (Number.parseFloat(revealTranslateParts[0] ?? '0') || 0)
      const revealTranslateY =
        (revealMatrix?.m42 ?? 0) +
        (Number.parseFloat(revealTranslateParts[1] ?? '0') || 0)
      const revealScaleX =
        Math.abs(
          (revealMatrix?.a ?? 1) *
            (Number.parseFloat(revealScaleParts[0] ?? '1') || 1),
        ) || 1
      const homeShell = sampleRoot.closest<HTMLElement>('.public-shell-home')
      const homeDensity =
        Number.parseFloat(
          homeShell
            ? window
                .getComputedStyle(homeShell)
                .getPropertyValue('--public-home-density')
            : '1',
        ) || 1
      const titleFontSize = Number.parseFloat(titleStyles.fontSize)
      const titleLineHeight = Number.parseFloat(titleStyles.lineHeight)
      const scaledTitleFontSize = titleFontSize * homeDensity
      const scaledTitleLineHeight = titleLineHeight * homeDensity
      const setMetric = (name: string, value: string) => {
        launchElement.style.setProperty(name, value)
        wordmarkElement.style.setProperty(name, value)
      }

      const titleLeft = titleRect.left - rootRect.left - revealTranslateX
      const titleTop = titleRect.top - rootRect.top - revealTranslateY

      setMetric('--intro-title-left', `${titleLeft}px`)
      setMetric('--intro-title-top', `${titleTop}px`)
      setMetric('--intro-title-width', `${titleRect.width / revealScaleX}px`)
      setMetric(
        '--intro-title-font-size',
        Number.isFinite(scaledTitleFontSize)
          ? `${scaledTitleFontSize}px`
          : titleStyles.fontSize,
      )
      setMetric(
        '--intro-title-line-height',
        Number.isFinite(scaledTitleLineHeight)
          ? `${scaledTitleLineHeight}px`
          : titleStyles.lineHeight,
      )

      const lineHeight =
        (Number.isFinite(scaledTitleLineHeight) && scaledTitleLineHeight) ||
        titleRect.height / 4
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

    const prepareAnimation = async () => {
      setIsAnimationReady(false)

      const fontReady = Promise.all([
        document.fonts.load('600 128px "Cormorant Garamond"'),
        document.fonts.ready,
      ])
        .then(() => undefined)
        .catch(() => undefined)
      const fontTimeout = new Promise<void>((resolve) => {
        fontTimeoutId = window.setTimeout(resolve, 1500)
      })

      await Promise.race([fontReady, fontTimeout])
      window.clearTimeout(fontTimeoutId)

      if (isCancelled) {
        return
      }

      animationFrameId = window.requestAnimationFrame(() => {
        applyTitleMetrics()
        animationFrameId = window.requestAnimationFrame(() => {
          if (!isCancelled) {
            setIsAnimationReady(true)
          }
        })
      })
    }

    void prepareAnimation()
    window.addEventListener('resize', applyTitleMetrics)

    return () => {
      isCancelled = true
      window.cancelAnimationFrame(animationFrameId)
      window.clearTimeout(fontTimeoutId)
      window.removeEventListener('resize', applyTitleMetrics)
    }
  }, [shouldRenderIntro])

  if (!shouldRenderIntro) {
    return null
  }

  return (
    <div
      aria-hidden="true"
      className={
        isAnimationReady
          ? 'home-intro-launch home-intro-launch--ready'
          : 'home-intro-launch'
      }
      ref={launchRef}
    >
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
