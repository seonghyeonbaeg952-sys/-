import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import type { Concert } from '../../../types/content'
import { formatKoreanDate } from '../../../utils/formatDate'
import { Button } from '../../common/Button'
import './HomeV4PerformanceCarousel.css'

type HomeV4PerformanceCarouselProps = {
  concerts: Concert[]
  detailButtonLabel: string
  emptyButtonLabel: string
  emptyDescription: string
  emptyTitle: string
}

type TemplatePosition = 'center' | 'left' | 'right'
type ProgramBookState = 'folded' | 'front' | 'side' | 'open'

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

function getConcertSummary(concert: Concert) {
  if (concert.description.trim()) {
    return concert.description
  }

  if (concert.program.length > 0) {
    return concert.program.slice(0, 2).join(' · ')
  }

  return '서울모테트청소년합창단의 무대를 안내합니다.'
}

const V4_FALLBACK_CONCERTS: Concert[] = [
  {
    id: 'v4-performance-11',
    title: '제11회 정기연주회',
    category: 'regular',
    date: '2026-05-16',
    time: '17:00',
    location: '세라믹팔레스홀',
    poster_url: '',
    description: '정통 합창음악과 교회음악의 깊이를 청소년의 맑은 목소리로 전합니다.',
    program: ['정통 합창 작품', '한국 합창 작품', '교회음악 레퍼토리'],
    performers: [],
    ticket_url: '',
    apply_url: '',
    status: 'closed',
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'v4-performance-12',
    title: '제12회 정기연주회',
    category: 'regular',
    date: '2026-09-19',
    time: '17:00',
    location: '세라믹팔레스홀',
    poster_url: '',
    description: '서로 다른 목소리가 하나의 음악으로 이어지는 정기연주회입니다.',
    program: ['W. A. Mozart', '한국 합창 작품', '현대 성가'],
    performers: [],
    ticket_url: '',
    apply_url: '',
    status: 'scheduled',
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'v4-performance-13',
    title: '제13회 정기연주회',
    category: 'regular',
    date: '2027-03-20',
    time: '17:00',
    location: '세라믹팔레스홀',
    poster_url: '',
    description: '다음 세대의 노래가 새로운 무대로 이어지는 공연입니다.',
    program: ['고전 합창 작품', '한국 창작 합창', '교회음악 레퍼토리'],
    performers: [],
    ticket_url: '',
    apply_url: '',
    status: 'scheduled',
    is_visible: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
]

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
  position,
  programState = 'front',
}: {
  concert: Concert
  position: TemplatePosition
  programState?: ProgramBookState
}) {
  const style = {
    '--home-v4-template-paper': `url("${PAPER_TEXTURE_ASSET}")`,
  } as CSSProperties

  return (
    <article
      aria-hidden={position !== 'center'}
      className={`home-v4-template-face home-v4-template-face--${position}`}
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
          {concert.location || '공연장 추후 안내'}
        </p>
        <time className="home-v4-template-face__date" dateTime={concert.date}>
          {formatKoreanDate(concert.date)}
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
  const [bookState, setBookState] = useState<ProgramBookState>('front')
  const sideTimerRef = useRef<number | null>(null)
  const previousExpandedRef = useRef(expanded)
  const dateText = formatKoreanDate(concert.date)

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
      aria-label={`${concert.title} 프로그램 템플릿`}
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
            <div>
              <p className="motion-program-kicker">PROGRAM NOTE</p>
              <h4><ConcertTitle title={concert.title} /></h4>
              <p>{getConcertSummary(concert)}</p>
            </div>
          </section>
          <section className="motion-program-panel motion-program-panel-center">
            <div>
              <p className="motion-program-kicker">CONCERT</p>
              <h3><ConcertTitle title={concert.title} /></h3>
            </div>
            <dl>
              {dateText ? (
                <div>
                  <dt>DATE</dt>
                  <dd>{dateText}</dd>
                </div>
              ) : null}
              {concert.time ? (
                <div>
                  <dt>TIME</dt>
                  <dd>{concert.time}</dd>
                </div>
              ) : null}
              {concert.location ? (
                <div>
                  <dt>PLACE</dt>
                  <dd>{concert.location}</dd>
                </div>
              ) : null}
            </dl>
          </section>
          <section className="motion-program-panel motion-program-panel-right">
            <div>
              <p className="motion-program-kicker">GUIDE</p>
              <div className="motion-program-statuses">
                <span>{statusLabels[concert.status]}</span>
              </div>
            </div>
            <div className="motion-program-actions">
              <Button
                href={`/sample/concerts/${concert.id}`}
                showArrow={false}
                variant="gold"
              >
                {detailButtonLabel} <span aria-hidden="true">→</span>
              </Button>
              <Button
                href="/sample/contact?section=performance"
                showArrow={false}
                variant="secondary"
              >
                공연 문의 <span aria-hidden="true">→</span>
              </Button>
            </div>
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
      <span className="home-v4-architecture__depth home-v4-architecture__depth--left-outer" />
      <span className="home-v4-architecture__depth home-v4-architecture__depth--right-outer" />
    </div>
  )
}

export function HomeV4PerformanceCarousel({
  concerts,
  detailButtonLabel,
}: HomeV4PerformanceCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [programBookState, setProgramBookState] =
    useState<ProgramBookState>('front')
  const visibleConcerts =
    concerts.length > 0
      ? [...concerts.slice(0, 3), ...V4_FALLBACK_CONCERTS].slice(0, 3)
      : V4_FALLBACK_CONCERTS

  const safeActiveIndex = activeIndex % visibleConcerts.length
  const activeConcert = visibleConcerts[safeActiveIndex]

  const move = (step: number) => {
    if (programBookState !== 'front') {
      return
    }

    setActiveIndex(
      (currentIndex) =>
        (currentIndex + step + visibleConcerts.length) % visibleConcerts.length,
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
        <p className="home-v4-performance-carousel__eyebrow">PERFORMANCE</p>
        <h2>공연과 소식</h2>
        <p className="home-v4-performance-carousel__description">
          다가오는 공연의 날짜, 장소, 공지사항을 확인합니다.
          <br />
          공연 정보가 확정되면 이 섹션에 반영됩니다.
        </p>
        <div className="home-v4-performance-carousel__active-copy" aria-live="polite">
          <p>NEXT CONCERT</p>
          <h3><ConcertTitle title={activeConcert.title} /></h3>
          <dl>
            <div>
              <dt aria-label="공연 날짜">▣</dt>
              <dd>{formatKoreanDate(activeConcert.date)}</dd>
            </div>
            <div>
              <dt aria-label="공연 장소">⌖</dt>
              <dd>{activeConcert.location || '공연장 추후 안내'}</dd>
            </div>
          </dl>
        </div>
        <div className="home-v4-performance-carousel__actions">
          <Button
            href={`/sample/concerts/${activeConcert.id}`}
            showArrow={false}
            variant="gold"
          >
            {detailButtonLabel} <span aria-hidden="true">→</span>
          </Button>
          <Button href="/sample/concerts" showArrow={false} variant="secondary">
            전체 일정 <span aria-hidden="true">→</span>
          </Button>
        </div>
        <ol
          aria-label="공연 템플릿 선택"
          className="home-v4-performance-carousel__timeline"
        >
          {visibleConcerts.map((concert, index) => (
            <li className={index === safeActiveIndex ? 'is-active' : undefined} key={concert.id}>
              <button
                aria-current={index === safeActiveIndex ? 'true' : undefined}
                aria-label={`${index + 1}번 공연 ${concert.title} 보기`}
                disabled={programBookState !== 'front'}
                onClick={() => {
                  setActiveIndex(index)
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
          className="home-v4-architecture"
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
            aria-label={`${activeConcert.title} 템플릿 펼치기`}
            className="home-v4-architecture__center-trigger"
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
          <div className="home-v4-architecture__controls">
            <button
              aria-label="이전 공연 템플릿"
              disabled={
                visibleConcerts.length < 2 || programBookState !== 'front'
              }
              onClick={() => move(-1)}
              type="button"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              aria-expanded={isTemplateOpen}
              aria-controls={`concert-template-details-${activeConcert.id}`}
              aria-label={isTemplateOpen ? '공연 템플릿 접기' : '공연 템플릿 펼치기'}
              className="home-v4-architecture__expand"
              onClick={() => setIsTemplateOpen((current) => !current)}
              type="button"
            >
              {isTemplateOpen ? '템플릿 접기' : '템플릿 펼치기'}{' '}
              <span aria-hidden="true">{isTemplateOpen ? '×' : '↗'}</span>
            </button>
            <button
              aria-label="다음 공연 템플릿"
              disabled={
                visibleConcerts.length < 2 || programBookState !== 'front'
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
