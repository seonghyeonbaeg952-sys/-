import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { HeroSlide } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { OptimizedImage } from '../common/OptimizedImage'
import { Reveal } from '../common/Reveal'
import { softenPublicCopy } from '../../utils/softenPublicCopy'

type HomeHeroSlideshowProps = {
  body?: string
  eyebrow?: string
  fallbackDescription?: string
  fallbackSubtitle?: string
  fallbackTitle?: string
  headline?: ReactNode
  intervalMs?: number
  mottoChips?: string[]
  primaryCtaLabel?: string
  secondaryCtaLabel?: string
  slides: HeroSlide[]
}

type ImageFetchPriority = 'auto' | 'high' | 'low'

const heroCopy = {
  body:
    '서울모테트청소년합창단은 청소년이 합창을 배우고 정기 연습과 공연을 경험하는 음악교육 공동체입니다.',
  eyebrow: '서울모테트청소년합창단',
  headline: (
    <>
      <span className="block">SEOUL</span>
      <span className="block">MOTET</span>
      <span className="block">YOUTH</span>
      <span className="block">CHOIR</span>
    </>
  ),
  primaryCta: '합창단 정신 보기',
  secondaryCta: '입단 안내',
}

const fallbackSlide: HeroSlide = {
  id: 'hero-fallback',
  title: 'SEOUL MOTET YOUTH CHOIR',
  subtitle: 'A refined choral voice for the next generation',
  description:
    '서울모테트청소년합창단은 청소년이 합창을 배우고 정기 연습과 공연을 경험하는 음악교육 공동체입니다.',
  image_url: '',
  image_alt: '서울모테트청소년합창단 공연 이미지',
  primary_cta_label: heroCopy.primaryCta,
  primary_cta_href: '/spirit',
  secondary_cta_label: heroCopy.secondaryCta,
  secondary_cta_href: '/join',
  display_order: 1,
  is_visible: true,
}

const heroMottoChips = ['합창 교육', '정기 연습', '공연 활동']
const warmedHeroImageUrls = new Set<string>()

function softenMottoChip(chip: string) {
  const normalizedChip = chip.trim()

  return softenPublicCopy(normalizedChip)
}

function getExternalImageOrigin(imageUrl: string) {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const parsedUrl = new URL(imageUrl, window.location.href)

    return parsedUrl.origin === window.location.origin ? '' : parsedUrl.origin
  } catch {
    return ''
  }
}

function hasHeadLink(rel: string, href: string) {
  if (typeof document === 'undefined') {
    return true
  }

  return Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)).some(
    (link) => link.href === href || link.getAttribute('href') === href,
  )
}

function addHeadLink(
  rel: 'preconnect' | 'preload',
  href: string,
  options?: { as?: string; fetchPriority?: ImageFetchPriority },
) {
  if (typeof document === 'undefined' || hasHeadLink(rel, href)) {
    return
  }

  const link = document.createElement('link')
  link.rel = rel
  link.href = href

  if (options?.as) {
    link.as = options.as
  }

  if (options?.fetchPriority) {
    link.setAttribute('fetchpriority', options.fetchPriority)
  }

  document.head.append(link)
}

function warmHeroImage(imageUrl: string, fetchPriority: ImageFetchPriority) {
  const normalizedUrl = imageUrl.trim()

  if (!normalizedUrl || typeof window === 'undefined' || warmedHeroImageUrls.has(normalizedUrl)) {
    return
  }

  const externalOrigin = getExternalImageOrigin(normalizedUrl)

  if (externalOrigin) {
    addHeadLink('preconnect', externalOrigin)
  }

  addHeadLink('preload', normalizedUrl, { as: 'image', fetchPriority })

  const image = new Image()
  image.decoding = 'async'
  image.loading = fetchPriority === 'high' ? 'eager' : 'lazy'
  image.setAttribute('fetchpriority', fetchPriority)
  image.src = normalizedUrl

  warmedHeroImageUrls.add(normalizedUrl)
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(query.matches)

    updatePreference()
    query.addEventListener('change', updatePreference)

    return () => {
      query.removeEventListener('change', updatePreference)
    }
  }, [])

  return prefersReducedMotion
}

function useDocumentVisibility() {
  const [isDocumentVisible, setIsDocumentVisible] = useState(() => {
    if (typeof document === 'undefined') {
      return true
    }

    return !document.hidden
  })

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden)

    document.addEventListener('visibilitychange', updateVisibility)

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  return isDocumentVisible
}

function ChevronIcon({ direction }: { direction: 'next' | 'previous' }) {
  return (
    <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d={direction === 'next' ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function PlaybackIcon({ isPaused }: { isPaused: boolean }) {
  return (
    <svg aria-hidden="true" className="size-3.5" fill="currentColor" viewBox="0 0 24 24">
      {isPaused ? (
        <path d="M8 5.4v13.2c0 .8.9 1.3 1.6.8l9.2-6.6c.6-.4.6-1.2 0-1.6L9.6 4.6C8.9 4.1 8 4.6 8 5.4z" />
      ) : (
        <path d="M7 5.5c0-.8.6-1.5 1.5-1.5S10 4.7 10 5.5v13c0 .8-.6 1.5-1.5 1.5S7 19.3 7 18.5v-13zm7 0c0-.8.6-1.5 1.5-1.5S17 4.7 17 5.5v13c0 .8-.6 1.5-1.5 1.5S14 19.3 14 18.5v-13z" />
      )}
    </svg>
  )
}

function MottoChips({ chips }: { chips: string[] }) {
  return (
    <div aria-label="합창단 핵심 가치" className="home-hero-motto-chips">
      {chips.map((chip) => (
        <span className="home-hero-motto-chip" key={chip}>
          {chip}
        </span>
      ))}
    </div>
  )
}

export function HomeHeroSlideshow({
  body,
  eyebrow,
  fallbackDescription,
  fallbackSubtitle,
  fallbackTitle,
  headline,
  intervalMs = 5000,
  mottoChips,
  primaryCtaLabel,
  secondaryCtaLabel,
  slides,
}: HomeHeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isInteractionPaused, setIsInteractionPaused] = useState(false)
  const [isUserPaused, setIsUserPaused] = useState(false)
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set())
  const isDocumentVisible = useDocumentVisibility()
  const prefersReducedMotion = usePrefersReducedMotion()
  const resolvedFallbackSlide = useMemo<HeroSlide>(() => {
    return {
      ...fallbackSlide,
      description: fallbackDescription?.trim() || fallbackSlide.description,
      subtitle: fallbackSubtitle?.trim() || fallbackSlide.subtitle,
      title: fallbackTitle?.trim() || fallbackSlide.title,
    }
  }, [fallbackDescription, fallbackSubtitle, fallbackTitle])

  const visibleSlides = useMemo(() => {
    return [...slides]
      .filter((slide) => slide.is_visible)
      .sort((first, second) => first.display_order - second.display_order)
  }, [slides])

  const renderedSlides = useMemo(() => {
    return visibleSlides.length > 0 ? visibleSlides : [resolvedFallbackSlide]
  }, [resolvedFallbackSlide, visibleSlides])
  const hasMultipleSlides = renderedSlides.length > 1
  const safeActiveIndex = activeIndex % renderedSlides.length
  const isAutoplayPaused =
    isInteractionPaused || isUserPaused || prefersReducedMotion
  const visibleMottoChips = (mottoChips?.filter((chip) => chip.trim()) ?? heroMottoChips)
    .map(softenMottoChip)
  const heroBody = body === undefined ? heroCopy.body : body.trim()

  useEffect(() => {
    const first = renderedSlides[0]

    if (first?.image_url && !failedImageIds.has(first.id)) {
      warmHeroImage(first.image_url, 'high')
    }
  }, [failedImageIds, renderedSlides])

  useEffect(() => {
    const nextSlide = renderedSlides[(safeActiveIndex + 1) % renderedSlides.length]

    if (nextSlide?.image_url && !failedImageIds.has(nextSlide.id)) {
      warmHeroImage(nextSlide.image_url, 'low')
    }
  }, [failedImageIds, renderedSlides, safeActiveIndex])

  useEffect(() => {
    if (!hasMultipleSlides || isAutoplayPaused || !isDocumentVisible) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % renderedSlides.length)
    }, intervalMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [
    hasMultipleSlides,
    intervalMs,
    isDocumentVisible,
    isAutoplayPaused,
    renderedSlides.length,
  ])

  const goToSlide = (nextIndex: number) => {
    setActiveIndex((nextIndex + renderedSlides.length) % renderedSlides.length)
  }

  return (
    <section
      aria-label="홈 메인 비주얼"
      className="flow-section home-hero-section relative isolate overflow-hidden bg-navy-midnight text-bg-warm-white"
      data-flow-section="hero"
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget

        if (
          !(nextFocusedElement instanceof Node) ||
          !event.currentTarget.contains(nextFocusedElement)
        ) {
          setIsInteractionPaused(false)
        }
      }}
      onFocusCapture={() => setIsInteractionPaused(true)}
      onMouseEnter={() => setIsInteractionPaused(true)}
      onMouseLeave={() => setIsInteractionPaused(false)}
    >
      <div className="absolute inset-0 bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight" />
      <div aria-hidden="true" className="spotlight-glow home-spotlight-glow" />
      <div aria-hidden="true" className="stage-staff-lines stage-staff-lines-hero" />

      {renderedSlides.map((slide, index) => {
        const isActive = index === safeActiveIndex
        const isPrioritySlide = index === 0
        const hasImage =
          Boolean(slide.image_url) &&
          !failedImageIds.has(slide.id) &&
          (isActive || isPrioritySlide)

        return (
          <div
            aria-hidden={!isActive}
            className={[
              'home-hero-slide absolute inset-0 motion-reduce:transition-none',
              isActive ? 'home-hero-slide-active' : '',
            ].join(' ')}
            key={slide.id}
          >
            {hasImage ? (
              <OptimizedImage
                alt=""
                className="home-hero-background-image absolute inset-0 size-full !bg-none"
                decorative
                fallbackVariant="hero"
                imageClassName="object-center"
                loading={isPrioritySlide ? 'eager' : 'lazy'}
                objectFit="cover"
                onError={() => {
                  setFailedImageIds((current) => {
                    const next = new Set(current)
                    next.add(slide.id)
                    return next
                  })
                }}
                priority={isPrioritySlide}
                sizes="100vw"
                src={slide.image_url}
              />
            ) : null}
          </div>
        )
      })}

      <div aria-hidden="true" className="home-hero-overlay absolute inset-0" />

      <Container className="home-hero-layout relative z-20">
        <div className="home-hero-copy min-w-0">
          <Reveal delayMs={0}>
            <div className="mb-6 h-1 w-16 rounded-full bg-gold-warm" />
            <p className="type-eyebrow mb-4 text-gold-soft">
              {eyebrow?.trim() || heroCopy.eyebrow}
            </p>
          </Reveal>
          <Reveal delayMs={80}>
            <h1 className="type-hero-title home-hero-title-en max-w-[12ch] text-bg-warm-white">
              {headline ?? heroCopy.headline}
            </h1>
          </Reveal>
          {heroBody ? (
            <Reveal delayMs={150}>
              <p className="type-body mt-6 max-w-[560px] text-bg-ivory/88">
                {heroBody}
              </p>
            </Reveal>
          ) : null}
          <Reveal delayMs={220}>
            <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
              <Button className="w-full sm:w-auto" href="/join" size="lg" variant="gold">
                {primaryCtaLabel?.trim() || heroCopy.secondaryCta}
              </Button>
              <Button
                className="w-full !border-bg-warm-white/72 !bg-bg-warm-white/[0.07] !text-bg-warm-white hover:!border-bg-warm-white hover:!bg-bg-warm-white/[0.12] hover:!text-gold-soft sm:w-auto"
                href="/concerts"
                size="lg"
                variant="secondary"
              >
                {secondaryCtaLabel?.trim() || '공연 일정'}
              </Button>
            </div>
          </Reveal>
          <Reveal delayMs={280}>
            <MottoChips chips={visibleMottoChips} />
          </Reveal>

            {hasMultipleSlides ? (
              <div className="home-hero-controls" aria-label="Hero 슬라이드 선택">
                <p className="sr-only" aria-live="polite">
                  현재 슬라이드 {safeActiveIndex + 1} / {renderedSlides.length}
                </p>
                <div className="home-hero-dots" role="tablist">
                  {renderedSlides.map((slide, index) => (
                    <button
                      aria-label={`${index + 1}번째 슬라이드 보기: ${slide.title}`}
                      aria-selected={index === safeActiveIndex}
                      className={[
                        'home-hero-dot',
                        index === safeActiveIndex ? 'home-hero-dot-active' : '',
                      ].join(' ')}
                      key={slide.id}
                      onClick={() => goToSlide(index)}
                      role="tab"
                      type="button"
                    />
                  ))}
                </div>
                <div className="home-hero-arrow-group">
                  <button
                    aria-label={
                      isUserPaused
                        ? 'Hero 슬라이드 자동 재생 시작'
                        : 'Hero 슬라이드 자동 재생 일시정지'
                    }
                    className="home-hero-arrow"
                    disabled={prefersReducedMotion}
                    onClick={() => setIsUserPaused((current) => !current)}
                    type="button"
                  >
                    <PlaybackIcon isPaused={isUserPaused} />
                  </button>
                  <button
                    aria-label="이전 Hero 슬라이드 보기"
                    className="home-hero-arrow"
                    onClick={() => goToSlide(safeActiveIndex - 1)}
                    type="button"
                  >
                    <ChevronIcon direction="previous" />
                  </button>
                  <button
                    aria-label="다음 Hero 슬라이드 보기"
                    className="home-hero-arrow"
                    onClick={() => goToSlide(safeActiveIndex + 1)}
                    type="button"
                  >
                    <ChevronIcon direction="next" />
                  </button>
                </div>
              </div>
            ) : null}
        </div>
      </Container>
    </section>
  )
}
