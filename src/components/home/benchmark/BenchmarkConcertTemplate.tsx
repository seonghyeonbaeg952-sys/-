import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import type { Concert } from '../../../types/content'
import { formatKoreanDate } from '../../../utils/formatDate'
import { Button } from '../../common/Button'
import { EmptyState } from '../../common/EmptyState'
import { ImageTile } from '../ImageTile'

type BenchmarkConcertTemplateProps = {
  concerts: Concert[]
  detailButtonLabel?: string
  inquiryButtonLabel?: string
  programNoteLabel?: string
}

type ProgramBookState = 'folded' | 'front' | 'side' | 'open'

const statusLabels: Record<Concert['status'], string> = {
  cancelled: '취소',
  closed: '종료',
  open: '접수중',
  scheduled: '예정',
}

const slotOffsets = [-330, 0, 330] as const

function getConcertSummary(concert: Concert) {
  if (concert.description.trim()) {
    return concert.description
  }

  if (concert.program.length > 0) {
    return concert.program.slice(0, 2).join(' · ')
  }

  return '서울모테트청소년합창단의 무대를 안내합니다.'
}

function hasNoteContent(concert: Concert) {
  return Boolean(concert.title.trim() && (concert.date.trim() || concert.location.trim()))
}

export function BenchmarkConcertTemplate({
  concerts,
  detailButtonLabel = '자세히 보기',
  inquiryButtonLabel = '문의',
  programNoteLabel = 'PROGRAM NOTE',
}: BenchmarkConcertTemplateProps) {
  const visibleConcerts = concerts.filter((concert) => concert.is_visible).slice(0, 3)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [bookState, setBookState] = useState<ProgramBookState>('folded')
  const sideTimerRef = useRef<number | null>(null)
  const isFocusWithinRef = useRef(false)
  const activeIndex = selectedIndex ?? hoveredIndex
  const mobileConcert = visibleConcerts[0]

  useEffect(() => {
    return () => {
      if (sideTimerRef.current !== null) {
        window.clearTimeout(sideTimerRef.current)
      }
    }
  }, [])

  if (visibleConcerts.length === 0) {
    return (
      <EmptyState
        action={
          <Button href="/concerts" variant="secondary">
            전체 공연 보기
          </Button>
        }
        description="새로운 공연 일정이 확정되면 이 공간에서 안내합니다."
        title="등록된 공연이 없습니다"
      />
    )
  }

  const resetShelf = () => {
    if (sideTimerRef.current !== null) {
      window.clearTimeout(sideTimerRef.current)
      sideTimerRef.current = null
    }

    setHoveredIndex(null)
    setSelectedIndex(null)
    setBookState('folded')
  }

  const openProgram = (index: number) => {
    if (sideTimerRef.current !== null) {
      window.clearTimeout(sideTimerRef.current)
    }

    setHoveredIndex(index)
    setSelectedIndex(index)
    setBookState('side')
    sideTimerRef.current = window.setTimeout(() => {
      setBookState('open')
      sideTimerRef.current = null
    }, 190)
  }

  const previewProgram = (index: number) => {
    if (selectedIndex !== null) {
      return
    }

    setHoveredIndex(index)
    setBookState('front')
  }

  return (
    <div aria-label={programNoteLabel} className="home-concert-template-stack motion-program-root">
      {mobileConcert ? (
        <div className="motion-program-mobile">
          <article className="motion-program-mobile-card">
            <p className="motion-program-kicker">CONCERT</p>
            <h3>{mobileConcert.title}</h3>
            <p className="motion-program-mobile-meta">
              {[formatKoreanDate(mobileConcert.date), mobileConcert.location]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <p>{getConcertSummary(mobileConcert)}</p>
            <div className="motion-program-actions">
              <Button href={`/concerts/${mobileConcert.id}`} variant="gold">
                {detailButtonLabel}
              </Button>
              <Button href="/contact?section=performance" variant="secondary">
                {inquiryButtonLabel}
              </Button>
            </div>
          </article>
        </div>
      ) : null}

      <div
        className="motion-program-shelf"
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            isFocusWithinRef.current = false
          }
        }}
        onFocusCapture={() => {
          isFocusWithinRef.current = true
        }}
        onMouseLeave={(event) => {
          if (
            isFocusWithinRef.current ||
            event.currentTarget.contains(document.activeElement)
          ) {
            return
          }

          resetShelf()
        }}
      >
        {visibleConcerts.map((concert, index) => {
          const isActive = activeIndex === index
          const slotState: ProgramBookState = isActive ? bookState : 'folded'
          const side =
            activeIndex === null || index === activeIndex
              ? 'center'
              : index < activeIndex
                ? 'left'
                : 'right'
          const dateText = formatKoreanDate(concert.date)

          return (
            <article
              className="motion-program-slot"
              data-active={isActive ? 'true' : 'false'}
              data-side={side}
              key={concert.id}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  resetShelf()
                }
              }}
              onFocus={() => previewProgram(index)}
              onMouseEnter={() => previewProgram(index)}
              style={{ '--program-offset': `${slotOffsets[index] ?? 0}px` } as CSSProperties}
            >
              {hasNoteContent(concert) ? (
                <aside
                  aria-hidden="true"
                  className="motion-program-note"
                  data-hidden={isActive ? 'true' : 'false'}
                >
                  <span>{programNoteLabel}</span>
                  <strong>{concert.title}</strong>
                  {concert.location ? <p>{concert.location}</p> : null}
                  {dateText ? <p>{dateText}</p> : null}
                </aside>
              ) : null}

              <div className="motion-program-book" data-state={slotState}>
                <button
                  aria-expanded={slotState === 'open'}
                  className="motion-program-cover"
                  onClick={() => openProgram(index)}
                  type="button"
                >
                  <span>SMYC PROGRAM</span>
                  <strong>{concert.title}</strong>
                  <small>{dateText}</small>
                </button>
                <button
                  aria-label={`${concert.title} 프로그램 펼치기`}
                  className="motion-program-side"
                  onClick={() => openProgram(index)}
                  type="button"
                >
                  <span>SMYC</span>
                </button>
                <div
                  aria-hidden={slotState !== 'open'}
                  className="motion-program-spread"
                  inert={slotState !== 'open'}
                >
                  <section className="motion-program-panel motion-program-panel-left">
                    <div>
                      <p className="motion-program-kicker">{programNoteLabel}</p>
                      <h4>{concert.title}</h4>
                      <p>{getConcertSummary(concert)}</p>
                    </div>
                  </section>
                  <section className="motion-program-panel motion-program-panel-center">
                    <div>
                      <p className="motion-program-kicker">CONCERT</p>
                      <h3>{concert.title}</h3>
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
                      {concert.poster_url.trim() ? (
                        <ImageTile
                          alt={`${concert.title} 포스터`}
                          className="motion-program-poster"
                          fallbackVariant="poster"
                          objectFit="contain"
                          sizes="160px"
                          src={concert.poster_url}
                        />
                      ) : null}
                    </div>
                    <div className="motion-program-actions">
                      <Button href={`/concerts/${concert.id}`} variant="gold">
                        {detailButtonLabel}
                      </Button>
                      <Button href="/contact?section=performance" variant="secondary">
                        {inquiryButtonLabel}
                      </Button>
                    </div>
                  </section>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
