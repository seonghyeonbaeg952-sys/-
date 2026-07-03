import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import type { Concert } from '../../types/content'
import { formatKoreanDate } from '../../utils/formatDate'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { StaffLines } from '../common/StaffLines'
import { ImageTile } from './ImageTile'

type ConcertTemplatePanelProps = {
  concert?: Concert
  detailButtonLabel?: string
  inquiryButtonLabel?: string
}

const statusLabels: Record<Concert['status'], string> = {
  cancelled: '취소',
  closed: '종료',
  open: '접수중',
  scheduled: '예정',
}

const categoryLabels: Record<string, string> = {
  church: '교회·예배 연주',
  invited: '초청연주',
  other: '기타',
  past: '지난 공연',
  regular: '정기연주회',
  special: '특별연주',
}

function isBrokenText(value: string) {
  return /[�怨湲留덉꾩쒖쨌媛臾醫遺異淵낅꽌뒿듬占筌]|[?]{2,}/.test(value)
}

function getConcertSummary(concert: Concert) {
  if (concert.description.trim() && !isBrokenText(concert.description)) {
    return concert.description
  }

  if (concert.program.length > 0) {
    return concert.program.slice(0, 3).join(' · ')
  }

  return '서울모테트청소년합창단의 무대는 음악교육의 과정과 공동체의 울림을 함께 전합니다.'
}

function useDesktopFinePointer() {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
    const handleChange = () => setMatches(query.matches)

    handleChange()
    query.addEventListener('change', handleChange)

    return () => {
      query.removeEventListener('change', handleChange)
    }
  }, [])

  return matches
}

export function ConcertTemplatePanel({
  concert,
  detailButtonLabel = '자세히 보기',
  inquiryButtonLabel = '문의',
}: ConcertTemplatePanelProps) {
  const [isPinned, setIsPinned] = useState(false)
  const [isTransientOpen, setIsTransientOpen] = useState(false)
  const articleRef = useRef<HTMLElement>(null)
  const pinButtonRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const isDesktopInteractive = useDesktopFinePointer() && !prefersReducedMotion
  const isOpen = !isDesktopInteractive || isPinned || isTransientOpen

  if (!concert) {
    return (
      <div className="concert-template-panel concert-template-panel-empty">
        <EmptyState
          action={
            <Button href="/concerts" variant="secondary">
              전체 공연 보기
            </Button>
          }
          description="새로운 공연 일정이 확정되면 이 공간에서 안내합니다."
          title="등록된 공연이 없습니다"
        />
      </div>
    )
  }

  const detailId = `concert-template-details-${concert.id}`
  const detailHref = `/concerts/${concert.id}`
  const hasPoster = Boolean(concert.poster_url.trim())
  const primaryProgram = concert.program.filter(Boolean).slice(0, 3)
  const formattedDate = formatKoreanDate(concert.date)
  const hasWhen = Boolean(formattedDate || concert.time)
  const hasLocation = Boolean(concert.location.trim())
  const togglePinned = () => {
    setIsPinned((current) => !current)
  }

  const closePanel = () => {
    setIsPinned(false)
    setIsTransientOpen(false)
  }

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return
    }

    if (!isPinned) {
      setIsTransientOpen(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !isDesktopInteractive) {
      return
    }

    closePanel()
    pinButtonRef.current?.focus()
  }

  return (
    <article
      className="concert-template-panel"
      data-interactive={isDesktopInteractive ? 'true' : 'false'}
      data-open={isOpen ? 'true' : 'false'}
      data-pinned={isPinned ? 'true' : 'false'}
      onBlurCapture={handleBlur}
      onFocusCapture={() => {
        if (isDesktopInteractive) {
          setIsTransientOpen(true)
        }
      }}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        if (isDesktopInteractive) {
          setIsTransientOpen(true)
        }
      }}
      onMouseLeave={() => {
        if (isDesktopInteractive && !isPinned) {
          setIsTransientOpen(false)
        }
      }}
      ref={articleRef}
    >
      <div className="concert-template-panel__shell">
        <button
          aria-controls={detailId}
          aria-expanded={isOpen}
          aria-label={
            isPinned ? '공연 프로그램 패널 고정 해제' : '공연 프로그램 패널 고정'
          }
          aria-pressed={isPinned}
          className="concert-template-panel__cover"
          onClick={togglePinned}
          ref={pinButtonRef}
          type="button"
        >
          <span className="concert-template-panel__cover-label">SMYC PROGRAM</span>
          <strong>{concert.title}</strong>
          <span>
            {formatKoreanDate(concert.date)}
            {concert.time ? ` · ${concert.time}` : ''}
          </span>
          <small>{isPinned ? '고정 해제' : '패널 펼치기'}</small>
        </button>

        <div className="concert-template-panel__content">
          <section className="concert-template-panel__leaf concert-template-panel__leaf--note">
            <p className="type-eyebrow text-gold-warm">PROGRAM NOTE</p>
            <h4>{categoryLabels[concert.category] ?? concert.category ?? '공연 안내'}</h4>
            <p className="concert-template-panel__summary">
              {getConcertSummary(concert)}
            </p>
            {primaryProgram.length > 0 ? (
              <ul className="concert-template-panel__program-list">
                {primaryProgram.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>

          <section
            aria-label={`${concert.title} 프로그램 상세`}
            className="concert-template-panel__leaf concert-template-panel__leaf--center"
            id={detailId}
          >
            <div>
              <p className="type-eyebrow text-gold-warm">CONCERT TEMPLATE</p>
              <h3 className="concert-template-panel__title">{concert.title}</h3>
              <dl className="concert-template-panel__facts">
                {hasWhen ? (
                  <div>
                    <dt>일시</dt>
                    <dd>
                      {formattedDate}
                      {concert.time ? ` · ${concert.time}` : ''}
                    </dd>
                  </div>
                ) : null}
                {hasLocation ? (
                  <div>
                    <dt>장소</dt>
                    <dd>{concert.location}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </section>

          <section className="concert-template-panel__leaf concert-template-panel__leaf--guide">
            <div className="concert-template-panel__tools">
              <span className="program-status">{statusLabels[concert.status]}</span>
              {concert.category ? (
                <span className="program-status muted">
                  {categoryLabels[concert.category] ?? concert.category}
                </span>
              ) : null}
            </div>
            <div className="concert-template-panel__media">
              {hasPoster ? (
                <ImageTile
                  alt={`${concert.title} 포스터`}
                  className="concert-template-panel__poster"
                  fallbackVariant="poster"
                  objectFit="contain"
                  sizes="(min-width: 1024px) 260px, calc(100vw - 48px)"
                  src={concert.poster_url}
                />
              ) : (
                <div className="concert-template-panel__poster-fallback">
                  <StaffLines density="light" variant="inverted" />
                  <p>SMYC PROGRAM</p>
                  <strong>{concert.title}</strong>
                </div>
              )}
            </div>
            <footer className="concert-template-panel__actions">
              <Button href={detailHref} variant="gold">
                {detailButtonLabel}
              </Button>
              <Button href="/contact?section=performance" variant="secondary">
                {inquiryButtonLabel}
              </Button>
            </footer>
          </section>
        </div>
      </div>
    </article>
  )
}
