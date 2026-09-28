import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import type { Concert } from '../../../types/content'
import { useSampleLanguage } from '../../../features/sample-language/useSampleLanguage'
import { workflowDate, workflowTime } from '../../common/workflowCopy'
import { HomeCopy } from '../../home/HomeCopy'
import { formatKoreanDate } from '../../../utils/formatDate'
import { Button } from '../../common/Button'
import { Container } from '../../common/Container'
import { EmptyState } from '../../common/EmptyState'
import './HomeV4PerformanceCarousel.css'

type HomeV4PerformanceCarouselProps = {
  concertButtonLabel: string
  concerts: Concert[]
  description: string
  detailButtonLabel: string
  emptyButtonLabel: string
  emptyDescription: string
  emptyTitle: string
  title: string
}

type TemplatePosition = 'center' | 'left' | 'right'
type ProgramBookState = 'folded' | 'front' | 'side' | 'open'
type CarouselDirection = -1 | 1

const CAROUSEL_TRANSITION_MS = 660

const statusLabels: Record<Concert['status'], string> = {
  cancelled: '취소',
  closed: '종료',
  open: '접수중',
  scheduled: '예정',
}

const ARCHITECTURE_ASSET =
  '/images/sample/performance/architecture-rear-base.png'
const PAPER_TEXTURE_ASSET =
  '/images/sample/performance/template-paper-micrograin.png'
const SYMBOL_ASSET = '/images/sample/performance/smyc-symbol.png'

function getTemplatePosition(
  itemIndex: number,
  activeIndex: number,
  count: number,
): TemplatePosition | null {
  if (itemIndex === activeIndex) {
    return 'center'
  }

  if (count === 2) {
    return itemIndex === (activeIndex + 1) % count ? 'right' : null
  }

  if (itemIndex === (activeIndex - 1 + count) % count) {
    return 'left'
  }

  if (itemIndex === (activeIndex + 1) % count) {
    return 'right'
  }

  return null
}

function TemplateFace({
  concert,
  isRepositioning = false,
  position,
  programState = 'front',
}: {
  concert: Concert
  isRepositioning?: boolean
  position: TemplatePosition
  programState?: ProgramBookState
}) {
  const { enabled, language, translate } = useSampleLanguage()
  const english = enabled && language === 'en'
  const style = {
    '--home-v4-template-paper': `url("${PAPER_TEXTURE_ASSET}")`,
  } as CSSProperties

  return (
    <article
      aria-hidden={position !== 'center'}
      className={`home-v4-template-face home-v4-template-face--${position}${
        isRepositioning ? ' home-v4-template-face--repositioning' : ''
      }`}
      data-carousel-repositioning={isRepositioning ? 'true' : 'false'}
      data-program-state={position === 'center' ? programState : 'front'}
      data-template-position={position}
      style={style}
    >
      <div aria-hidden="true" className="home-v4-template-face__spine">
        <span>SEOUL MOTET YOUTH CHOIR</span>
      </div>
      <div className="home-v4-template-face__paper">
        <p className="home-v4-template-face__eyebrow">PROGRAM NOTE</p>
        <h3 className="home-v4-template-face__title">
          <span><ConcertTitle title={concert.title} /></span>
        </h3>
        <div aria-hidden="true" className="home-v4-template-face__rule">
          <span />
        </div>
        <p className="home-v4-template-face__venue">
          {concert.location || translate('공연장 추후 안내')}
        </p>
        <time className="home-v4-template-face__date" dateTime={concert.date}>
          {workflowDate(concert.date, formatKoreanDate(concert.date), english, true)}
        </time>
        <img
          alt=""
          aria-hidden="true"
          className="home-v4-template-face__symbol"
          src={SYMBOL_ASSET}
        />
        <p className="home-v4-template-face__brand">
          SEOUL MOTET
          <br />
          YOUTH CHOIR
        </p>
      </div>
    </article>
  )
}

function ConcertTitle({ title }: { title: string }) {
  const match = title.match(/^(.*?)(\d+)$/u)

  if (!match) {
    return title
  }

  return (
    <>
      {match[1]}
      <span className="home-v4-concert-title__number">{match[2]}</span>
    </>
  )
}

type CurrentProgramTemplateProps = {
  concert: Concert
  detailButtonLabel: string
  expanded: boolean
  onStateChange: (state: ProgramBookState) => void
}

function CurrentProgramTemplate({
  concert,
  detailButtonLabel,
  expanded,
  onStateChange,
}: CurrentProgramTemplateProps) {
  const { enabled, language, translate, href: publicHref } = useSampleLanguage()
  const english = enabled && language === 'en'
  const [bookState, setBookState] = useState<ProgramBookState>('front')
  const sideTimerRef = useRef<number | null>(null)
  const previousExpandedRef = useRef(expanded)
  const dateText = workflowDate(concert.date, formatKoreanDate(concert.date), english, true)
  const programmeNote = concert.description.trim()
    ? translate(concert.description)
    : concert.program.length > 0
      ? english ? 'The announced programme is listed below.' : '발표된 공연 프로그램을 아래에서 확인하세요.'
      : english ? 'Programme details will appear here once confirmed.' : '프로그램이 확정되면 이곳에 안내합니다.'

  useLayoutEffect(() => {
    if (sideTimerRef.current !== null) {
      window.clearTimeout(sideTimerRef.current)
      sideTimerRef.current = null
    }

    const wasExpanded = previousExpandedRef.current
    previousExpandedRef.current = expanded

    if (expanded || wasExpanded) {
      setBookState('side')
      onStateChange('side')
      sideTimerRef.current = window.setTimeout(() => {
        const nextState = expanded ? 'open' : 'front'
        setBookState(nextState)
        onStateChange(nextState)
        sideTimerRef.current = null
      }, 190)
    } else {
      setBookState('front')
      onStateChange('front')
    }

    return () => {
      if (sideTimerRef.current !== null) {
        window.clearTimeout(sideTimerRef.current)
        sideTimerRef.current = null
      }
    }
  }, [concert.id, expanded, onStateChange])

  return (
    <div
      aria-label={`${concert.title} ${english ? 'concert brochure' : '프로그램 템플릿'}`}
      className="home-v4-current-program"
    >
      <div className="motion-program-book" data-state={bookState}>
        <div
          aria-hidden={bookState !== 'open'}
          className="motion-program-spread home-v4-current-program__spread"
          id={`concert-template-details-${concert.id}`}
          inert={bookState !== 'open'}
        >
          <section className="motion-program-panel motion-program-panel-left">
            <div className="motion-program-panel__content">
              <p className="motion-program-kicker">{english ? 'Programme notes' : '프로그램 노트'}</p>
              <h4 className="motion-program-note-title">{english ? 'About this concert' : '공연 소개'}</h4>
              <p className="motion-program-note-body">{programmeNote}</p>
              {concert.program.length > 0 ? <div className="motion-program-repertoire">
                <p>{english ? 'Programme' : '프로그램'}</p>
                <ul>{concert.program.map((item, index) => <li key={`${index}-${item}`}>{translate(item)}</li>)}</ul>
              </div> : null}
            </div>
            <span aria-hidden="true" className="motion-program-folio">01 <i /> 03</span>
          </section>
          <section className="motion-program-panel motion-program-panel-center">
            <div className="motion-program-panel__content">
              <p className="motion-program-kicker">{english ? 'Concert information' : '공연 정보'}</p>
              <h3><ConcertTitle title={concert.title} /></h3>
            </div>
            <dl>
              {dateText ? (
                <div>
                  <dt>{english ? 'Date' : '날짜'}</dt>
                  <dd>{dateText}</dd>
                </div>
              ) : null}
              {concert.time ? (
                <div>
                  <dt>{english ? 'Time' : '시간'}</dt>
                  <dd>{workflowTime(concert.time, english)}</dd>
                </div>
              ) : null}
              {concert.location ? (
                <div>
                  <dt>{english ? 'Venue' : '장소'}</dt>
                  <dd>{concert.location}</dd>
                </div>
              ) : null}
            </dl>
            <span aria-hidden="true" className="motion-program-folio">02 <i /> 03</span>
          </section>
          <section className="motion-program-panel motion-program-panel-right">
            <div className="motion-program-panel__content">
              <p className="motion-program-kicker">{english ? 'Visitor guide' : '관람 안내'}</p>
              <h4>{english ? 'At a glance' : '공연 안내'}</h4>
              <div className="motion-program-statuses">
                <span>{translate(statusLabels[concert.status])}</span>
              </div>
              <p className="motion-program-guide-copy">{english ? 'Find the latest concert information and enquiries through the links below.' : '공연의 자세한 안내와 문의는 아래에서 확인하실 수 있습니다.'}</p>
            </div>
            <div className="motion-program-actions">
              <Button
                href={publicHref(`/concerts/${concert.id}`)}
                showArrow={false}
                variant="gold"
              >
                <HomeCopy sourceKey="home.concertProgram.detailCtaLabel" text={detailButtonLabel} /> <span aria-hidden="true">→</span>
              </Button>
              <Button
                href={publicHref('/contact?section=performance')}
                showArrow={false}
                variant="secondary"
              >
                {translate('공연 문의')} <span aria-hidden="true">→</span>
              </Button>
            </div>
            <span aria-hidden="true" className="motion-program-folio">03 <i /> 03</span>
          </section>
        </div>
      </div>
    </div>
  )
}

function ArchitectureForeground() {
  const clipNames = [
    'top',
    'left-outer',
    'right-outer',
    'sill',
  ] as const

  return (
    <div aria-hidden="true" className="home-v4-architecture__foreground">
      {clipNames.map((clipName) => (
        <img
          alt=""
          className={`home-v4-architecture__clip home-v4-architecture__clip--${clipName}`}
          key={clipName}
          src={ARCHITECTURE_ASSET}
        />
      ))}
      <span className="home-v4-architecture__pocket home-v4-architecture__pocket--left" />
      <span className="home-v4-architecture__pocket home-v4-architecture__pocket--right" />
    </div>
  )
}

function ArchitectureDepthLayer() {
  return (
    <div aria-hidden="true" className="home-v4-architecture__depth-layer">
      <span className="home-v4-architecture__depth home-v4-architecture__depth--left-outer" />
      <span className="home-v4-architecture__depth home-v4-architecture__depth--left-inner" />
      <span className="home-v4-architecture__depth home-v4-architecture__depth--right-inner" />
      <span className="home-v4-architecture__depth home-v4-architecture__depth--right-outer" />
    </div>
  )
}

function ArchitectureBlueprintFrame() {
  return (
    <span
      aria-hidden="true"
      className="home-v4-architecture__blueprint-frame"
    >
      <i data-corner="top-left" />
      <i data-corner="top-right" />
      <i data-corner="bottom-left" />
      <i data-corner="bottom-right" />
    </span>
  )
}

export function HomeV4PerformanceCarousel({
  concertButtonLabel,
  concerts,
  description,
  detailButtonLabel,
  emptyButtonLabel,
  emptyDescription,
  emptyTitle,
  title,
}: HomeV4PerformanceCarouselProps) {
  const { enabled, language, translate, href: publicHref } = useSampleLanguage()
  const english = enabled && language === 'en'
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [programBookState, setProgramBookState] =
    useState<ProgramBookState>('front')
  const [repositioningIndex, setRepositioningIndex] = useState<number | null>(
    null,
  )
  const carouselTimerRef = useRef<number | null>(null)
  const carouselTransitioningRef = useRef(false)
  const visibleConcerts = concerts
    .filter((concert) => concert.is_visible)
    .slice(0, 3)

  const safeActiveIndex = visibleConcerts.length > 0
    ? activeIndex % visibleConcerts.length
    : 0
  const activeConcert = visibleConcerts[safeActiveIndex]
  const isCarouselTransitioning = repositioningIndex !== null

  useLayoutEffect(
    () => () => {
      if (carouselTimerRef.current !== null) {
        window.clearTimeout(carouselTimerRef.current)
      }
    },
    [],
  )

  if (!activeConcert) {
    return (
      <Container className="py-16">
        <div className="mb-8">
          <h2 className="type-section-title">
            <HomeCopy sourceKey="home.concertProgram.title" text={title} />
          </h2>
          <p className="mt-4 type-body text-text-muted">
            <HomeCopy sourceKey="home.concertProgram.description" text={description} />
          </p>
        </div>
        <EmptyState
          action={
            <Button href={publicHref('/concerts')} variant="secondary">
              <HomeCopy sourceKey="home.concertProgram.emptyConcertCtaLabel" text={emptyButtonLabel} />
            </Button>
          }
          description={emptyDescription}
          title={emptyTitle}
        />
      </Container>
    )
  }

  const selectConcert = (
    nextIndex: number,
    requestedDirection?: CarouselDirection,
  ) => {
    if (
      programBookState !== 'front' ||
      carouselTransitioningRef.current ||
      nextIndex === safeActiveIndex
    ) {
      return
    }

    const count = visibleConcerts.length
    const normalizedIndex = (nextIndex + count) % count
    const forwardDistance = (normalizedIndex - safeActiveIndex + count) % count
    const direction =
      requestedDirection ?? (forwardDistance <= count / 2 ? 1 : -1)
    const bypassIndex =
      count > 2
        ? direction === 1
          ? (safeActiveIndex - 1 + count) % count
          : (safeActiveIndex + 1) % count
        : null

    carouselTransitioningRef.current = true
    setRepositioningIndex(bypassIndex)
    setActiveIndex(normalizedIndex)

    if (carouselTimerRef.current !== null) {
      window.clearTimeout(carouselTimerRef.current)
    }

    const transitionDuration = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
      ? 0
      : CAROUSEL_TRANSITION_MS

    carouselTimerRef.current = window.setTimeout(() => {
      carouselTransitioningRef.current = false
      setRepositioningIndex(null)
      carouselTimerRef.current = null
    }, transitionDuration)
  }

  const move = (step: number) => {
    selectConcert(
      safeActiveIndex + step,
      step > 0 ? 1 : -1,
    )
  }

  return (
    <div
      aria-roledescription="carousel"
      className="home-v4-performance-carousel"
      data-v4-performance-carousel="figma-template"
      role="region"
    >
      <div className="home-v4-performance-carousel__copy">
        <div className="home-v4-performance-carousel__rail" aria-hidden="true">
          <span />
        </div>
        <h2><HomeCopy sourceKey="home.concertProgram.title" text={title} /></h2>
        <p className="home-v4-performance-carousel__description">
          <HomeCopy sourceKey="home.concertProgram.description" text={description} />
        </p>
        <div className="home-v4-performance-carousel__active-copy" aria-live="polite">
          <p>NEXT CONCERT</p>
          <h3><ConcertTitle title={activeConcert.title} /></h3>
          <dl>
            <div>
              <dt aria-label={translate('공연 날짜')}>▣</dt>
              <dd>{workflowDate(activeConcert.date, formatKoreanDate(activeConcert.date), english, true)}</dd>
            </div>
            <div>
              <dt aria-label={translate('공연 장소')}>⌖</dt>
              <dd>{activeConcert.location || translate('공연장 추후 안내')}</dd>
            </div>
          </dl>
        </div>
        <div className="home-v4-performance-carousel__actions">
          <Button
            href={publicHref(`/concerts/${activeConcert.id}`)}
            showArrow={false}
            variant="gold"
          >
            <HomeCopy sourceKey="home.concertProgram.detailCtaLabel" text={detailButtonLabel} /> <span aria-hidden="true">→</span>
          </Button>
          <Button href={publicHref('/concerts')} showArrow={false} variant="secondary">
            <HomeCopy sourceKey="home.concertProgram.desktopConcertsCtaLabel" text={concertButtonLabel} /> <span aria-hidden="true">→</span>
          </Button>
        </div>
        <ol
          aria-label={english ? 'Choose a concert brochure' : '공연 템플릿 선택'}
          className="home-v4-performance-carousel__timeline"
        >
          {visibleConcerts.map((concert, index) => (
            <li className={index === safeActiveIndex ? 'is-active' : undefined} key={concert.id}>
              <button
                aria-current={index === safeActiveIndex ? 'true' : undefined}
                aria-label={english ? `View concert ${index + 1}: ${concert.title}` : `${index + 1}번 공연 ${concert.title} 보기`}
                disabled={
                  programBookState !== 'front' || isCarouselTransitioning
                }
                onClick={() => {
                  selectConcert(index)
                }}
                type="button"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <small>{concert.title}</small>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="home-v4-performance-carousel__stage">
        <div
          aria-busy={isCarouselTransitioning}
          className="home-v4-architecture"
          data-carousel-transitioning={
            isCarouselTransitioning ? 'true' : 'false'
          }
          data-template-expanded={
            programBookState === 'front' ? 'false' : 'true'
          }
        >
          <img
            alt=""
            aria-hidden="true"
            className="home-v4-architecture__rear"
            src={ARCHITECTURE_ASSET}
          />
          <ArchitectureDepthLayer />
          <div className="home-v4-architecture__track">
            {visibleConcerts.map((concert, index) => {
              const position = getTemplatePosition(
                index,
                safeActiveIndex,
                visibleConcerts.length,
              )

              return position ? (
                <TemplateFace
                  concert={concert}
                  isRepositioning={index === repositioningIndex}
                  key={concert.id}
                  position={position}
                  programState={
                    position === 'center' ? programBookState : 'front'
                  }
                />
              ) : null
            })}
          </div>
          <button
            aria-label={english ? `Open brochure for ${activeConcert.title}` : `${activeConcert.title} 템플릿 펼치기`}
            className="home-v4-architecture__center-trigger"
            disabled={isCarouselTransitioning}
            onClick={() => setIsTemplateOpen(true)}
            type="button"
          />
          <CurrentProgramTemplate
            key={activeConcert.id}
            concert={activeConcert}
            detailButtonLabel={detailButtonLabel}
            expanded={isTemplateOpen}
            onStateChange={setProgramBookState}
          />
          <ArchitectureForeground />
          <ArchitectureBlueprintFrame />
          <div className="home-v4-architecture__controls">
            <button
              aria-label={english ? 'Previous concert brochure' : '이전 공연 템플릿'}
              disabled={
                visibleConcerts.length < 2 ||
                programBookState !== 'front' ||
                isCarouselTransitioning
              }
              onClick={() => move(-1)}
              type="button"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              aria-expanded={isTemplateOpen}
              aria-controls={`concert-template-details-${activeConcert.id}`}
              aria-label={isTemplateOpen ? translate('공연 템플릿 접기') : translate('공연 템플릿 펼치기')}
              className="home-v4-architecture__expand"
              disabled={isCarouselTransitioning}
              onClick={() => setIsTemplateOpen((current) => !current)}
              type="button"
            >
              {isTemplateOpen ? translate('템플릿 접기') : translate('템플릿 펼치기')}{' '}
              <span aria-hidden="true">{isTemplateOpen ? '×' : '↗'}</span>
            </button>
            <button
              aria-label={english ? 'Next concert brochure' : '다음 공연 템플릿'}
              disabled={
                visibleConcerts.length < 2 ||
                programBookState !== 'front' ||
                isCarouselTransitioning
              }
              onClick={() => move(1)}
              type="button"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          <p className="home-v4-architecture__count">
            {safeActiveIndex + 1} / {visibleConcerts.length}
          </p>
        </div>
      </div>

    </div>
  )
}
