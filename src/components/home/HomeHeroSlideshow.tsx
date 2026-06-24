import { useEffect, useMemo, useState } from 'react'

import type { Concert, HeroSlide, Notice } from '../../types/content'
import { formatKoreanDate } from '../../utils/formatDate'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { Reveal } from '../common/Reveal'

type HomeHeroSlideshowProps = {
  featureNotice?: Notice | null
  intervalMs?: number
  nextConcert?: Concert | null
  slides: HeroSlide[]
}

const fallbackSlide: HeroSlide = {
  id: 'hero-fallback',
  title: '서울모테트청소년합창단',
  subtitle: '맑은 목소리로 전하는 깊은 울림',
  description:
    '청소년의 순수한 목소리와 클래식 합창의 깊이를 무대 위에서 전합니다.',
  image_url: '',
  image_alt: '서울모테트청소년합창단 공연 이미지',
  primary_cta_label: '공연 일정 보기',
  primary_cta_href: '/concerts',
  secondary_cta_label: '합창단 소개 보기',
  secondary_cta_href: '/about',
  display_order: 1,
  is_visible: true,
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

function HeroTitle({ title }: { title: string }) {
  if (title === '서울모테트청소년합창단') {
    return (
      <>
        <span className="block">서울모테트</span>
        <span className="block">청소년합창단</span>
      </>
    )
  }

  return title
}

function ChevronIcon({ direction }: { direction: 'next' | 'previous' }) {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
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

function FeaturePanel({
  concert,
  notice,
}: {
  concert?: Concert | null
  notice?: Notice | null
}) {
  if (!concert && !notice) {
    return null
  }

  if (concert) {
    return (
      <div className="rounded-card border border-bg-warm-white/16 bg-bg-warm-white/10 p-5 shadow-[0_24px_80px_rgb(0_0_0/0.24)] backdrop-blur-md md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-soft">
          NEXT PERFORMANCE
        </p>
        <div className="mt-5 flex gap-4">
          <div className="flex min-w-20 flex-col items-center justify-center rounded-button border border-gold-warm/55 bg-navy-midnight/45 px-3 py-4 text-center">
            <span className="text-xs font-semibold text-gold-soft">DATE</span>
            <span className="mt-2 break-keep text-sm font-bold text-bg-warm-white">
              {formatKoreanDate(concert.date)}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="break-keep text-xl font-semibold leading-7 text-bg-warm-white">
              {concert.title}
            </h2>
            <p className="mt-2 break-keep text-sm leading-6 text-bg-ivory/76">
              {concert.location}
              {concert.time ? ` · ${concert.time}` : ''}
            </p>
          </div>
        </div>
        <Button className="mt-5 w-full" href={`/concerts/${concert.id}`} variant="gold">
          자세히 보기
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-card border border-bg-warm-white/16 bg-bg-warm-white/10 p-5 shadow-[0_24px_80px_rgb(0_0_0/0.24)] backdrop-blur-md md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-soft">
        IMPORTANT NOTICE
      </p>
      <h2 className="mt-4 break-keep text-xl font-semibold leading-7 text-bg-warm-white">
        {notice?.title}
      </h2>
      <Button className="mt-5 w-full" href={`/notices/${notice?.id}`} variant="gold">
        공지 보기
      </Button>
    </div>
  )
}

export function HomeHeroSlideshow({
  featureNotice,
  intervalMs = 5000,
  nextConcert,
  slides,
}: HomeHeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(() => new Set())
  const prefersReducedMotion = usePrefersReducedMotion()

  const visibleSlides = useMemo(() => {
    return [...slides]
      .filter((slide) => slide.is_visible)
      .sort((first, second) => first.display_order - second.display_order)
  }, [slides])

  const renderedSlides = visibleSlides.length > 0 ? visibleSlides : [fallbackSlide]
  const hasMultipleSlides = renderedSlides.length > 1
  const safeActiveIndex = activeIndex % renderedSlides.length
  const currentSlide = renderedSlides[safeActiveIndex] ?? fallbackSlide
  const heroTitle = currentSlide.title || fallbackSlide.title
  const hasFeaturePanel = Boolean(nextConcert || featureNotice)

  useEffect(() => {
    if (!hasMultipleSlides || isPaused || prefersReducedMotion) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % renderedSlides.length)
    }, intervalMs)

    return () => {
      window.clearInterval(timer)
    }
  }, [hasMultipleSlides, intervalMs, isPaused, prefersReducedMotion, renderedSlides.length])

  const goToSlide = (nextIndex: number) => {
    setActiveIndex((nextIndex + renderedSlides.length) % renderedSlides.length)
  }

  return (
    <section
      aria-label="홈 메인 슬라이드"
      className="relative min-h-[720px] overflow-hidden bg-navy-midnight text-bg-warm-white md:min-h-[86vh]"
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget

        if (
          !(nextFocusedElement instanceof Node) ||
          !event.currentTarget.contains(nextFocusedElement)
        ) {
          setIsPaused(false)
        }
      }}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-linear-to-br from-navy-midnight via-navy-deep to-gold-warm" />
      {renderedSlides.map((slide, index) => {
        const isActive = index === safeActiveIndex
        const hasImage = Boolean(slide.image_url) && !failedImageIds.has(slide.id)

        return (
          <div
            aria-hidden={!isActive}
            className={[
              'absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none',
              isActive ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            key={slide.id}
          >
            {hasImage ? (
              <img
                alt={slide.image_alt}
                className="size-full object-cover object-[center_36%]"
                decoding="async"
                fetchPriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={() => {
                  setFailedImageIds((current) => {
                    const next = new Set(current)
                    next.add(slide.id)
                    return next
                  })
                }}
                src={slide.image_url}
              />
            ) : null}
            <div className="absolute inset-0 bg-linear-to-r from-navy-midnight via-navy-midnight/76 to-navy-deep/18" />
            <div className="absolute inset-0 bg-linear-to-t from-navy-midnight/84 via-navy-midnight/10 to-navy-midnight/20" />
          </div>
        )
      })}

      <Container
        className={[
          'relative grid min-h-[720px] items-center gap-10 pb-36 pt-28 md:min-h-[86vh] md:pb-28 md:pt-32',
          hasFeaturePanel
            ? 'md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_410px]'
            : 'md:grid-cols-1',
        ].join(' ')}
      >
        <div className="min-w-0 max-w-3xl">
          <Reveal delayMs={0}>
            <div className="mb-6 h-1 w-16 rounded-full bg-gold-warm" />
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft md:text-sm">
              SEOUL MOTET YOUTH CHOIR
            </p>
          </Reveal>
          <Reveal delayMs={90}>
            <h1 className="max-w-[14rem] break-keep text-[34px] font-bold leading-[1.12] tracking-normal text-bg-warm-white drop-shadow-[0_3px_16px_rgb(0_0_0/0.34)] sm:max-w-none sm:text-[48px] md:text-6xl">
              <HeroTitle title={heroTitle} />
            </h1>
          </Reveal>
          <Reveal delayMs={170}>
            <p className="mt-5 max-w-2xl break-keep text-xl font-semibold leading-8 text-gold-soft md:text-2xl">
              {currentSlide.subtitle || fallbackSlide.subtitle}
            </p>
          </Reveal>
          <Reveal delayMs={240}>
            <p className="mt-5 max-w-2xl break-keep text-base leading-8 text-bg-ivory/86 md:text-lg">
              {currentSlide.description || fallbackSlide.description}
            </p>
          </Reveal>
          <Reveal delayMs={320}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                className="w-full sm:w-auto"
                href={currentSlide.primary_cta_href || '/concerts'}
                size="lg"
                variant="gold"
              >
                {currentSlide.primary_cta_label || '공연 일정 보기'}
              </Button>
              <Button
                className="w-full !border-bg-warm-white/80 !bg-bg-warm-white/10 !text-bg-warm-white hover:!border-bg-warm-white hover:!bg-bg-warm-white/18 hover:!text-gold-soft sm:w-auto"
                href={currentSlide.secondary_cta_href || '/about'}
                size="lg"
                variant="secondary"
              >
                {currentSlide.secondary_cta_label || '합창단 소개 보기'}
              </Button>
            </div>
          </Reveal>

          {hasMultipleSlides ? (
            <Reveal delayMs={390}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <p className="sr-only" aria-live="polite">
                  현재 슬라이드 {safeActiveIndex + 1} / {renderedSlides.length}
                </p>
                <div
                  aria-label="Hero 슬라이드 선택"
                  className="inline-flex w-fit items-center gap-2 rounded-pill border border-bg-warm-white/18 bg-navy-midnight/42 px-3 py-3 shadow-[0_12px_36px_rgb(0_0_0/0.2)] backdrop-blur-md"
                  role="tablist"
                >
                  {renderedSlides.map((slide, index) => (
                    <button
                      aria-label={`${index + 1}번째 슬라이드 보기: ${slide.title}`}
                      aria-selected={index === safeActiveIndex}
                      className={[
                        'h-2.5 rounded-pill transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm',
                        index === safeActiveIndex
                          ? 'w-8 bg-gold-warm'
                          : 'w-2.5 bg-bg-warm-white/42 hover:bg-bg-warm-white/72',
                      ].join(' ')}
                      key={slide.id}
                      onClick={() => goToSlide(index)}
                      role="tab"
                      type="button"
                    />
                  ))}
                </div>
                <div className="flex w-fit items-center gap-3 rounded-pill border border-bg-warm-white/18 bg-navy-midnight/42 p-2 shadow-[0_12px_36px_rgb(0_0_0/0.2)] backdrop-blur-md">
                  <button
                    aria-label={
                      isPaused ? 'Hero 슬라이드 자동 재생' : 'Hero 슬라이드 일시 정지'
                    }
                    className="min-h-11 rounded-pill border border-bg-warm-white/32 px-4 text-xs font-semibold text-bg-warm-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                    onClick={() => setIsPaused((current) => !current)}
                    type="button"
                  >
                    {isPaused ? 'PLAY' : 'PAUSE'}
                  </button>
                  <button
                    aria-label="이전 Hero 슬라이드 보기"
                    className="flex size-11 items-center justify-center rounded-full border border-bg-warm-white/32 text-bg-warm-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                    onClick={() => goToSlide(safeActiveIndex - 1)}
                    type="button"
                  >
                    <ChevronIcon direction="previous" />
                  </button>
                  <button
                    aria-label="다음 Hero 슬라이드 보기"
                    className="flex size-11 items-center justify-center rounded-full border border-bg-warm-white/32 text-bg-warm-white transition hover:border-gold-soft hover:text-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                    onClick={() => goToSlide(safeActiveIndex + 1)}
                    type="button"
                  >
                    <ChevronIcon direction="next" />
                  </button>
                </div>
              </div>
            </Reveal>
          ) : null}
        </div>

        {hasFeaturePanel ? (
          <Reveal className="md:self-end" delayMs={380}>
            <FeaturePanel concert={nextConcert} notice={featureNotice} />
          </Reveal>
        ) : null}
      </Container>

    </section>
  )
}
