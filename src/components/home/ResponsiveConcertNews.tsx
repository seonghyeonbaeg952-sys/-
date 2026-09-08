import { useId } from 'react'

import type { Concert, Notice } from '../../types/content'
import { formatShortDate } from '../../utils/formatDate'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'
import { TransitionLink } from '../common/TransitionLink'
import '../../styles/home-responsive-concerts.css'

type ResponsiveConcertNewsProps = {
  concert?: Concert
  concertButtonLabel: string
  description: string
  detailButtonLabel: string
  emptyConcertButtonLabel: string
  emptyConcertText: string
  emptyConcertTitle: string
  emptyNoticeButtonLabel: string
  emptyNoticeText: string
  emptyNoticeTitle: string
  eyebrow: string
  notices: Notice[]
  noticePanelButtonLabel: string
  noticePanelTitle: string
  programNoteLabel: string
  responsiveCardEyebrow: string
  responsiveNoticeImportantLabel?: string
  title: string
}

function getTicketDate(dateString: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null

  const date = new Date(`${dateString}T12:00:00Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateString) {
    return null
  }

  return {
    label: new Intl.DateTimeFormat('ko-KR', {
      day: 'numeric', month: 'long', timeZone: 'UTC', weekday: 'long', year: 'numeric',
    }).format(date),
    monthDay: `${dateString.slice(5, 7)}.${dateString.slice(8, 10)}`,
    weekday: new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'UTC', weekday: 'long',
    }).format(date),
    year: dateString.slice(0, 4),
  }
}

export function ResponsiveConcertNews({
  concert,
  concertButtonLabel,
  description,
  detailButtonLabel,
  emptyConcertButtonLabel,
  emptyConcertText,
  emptyConcertTitle,
  emptyNoticeButtonLabel,
  emptyNoticeText,
  emptyNoticeTitle,
  eyebrow,
  notices,
  noticePanelButtonLabel,
  noticePanelTitle,
  programNoteLabel,
  responsiveCardEyebrow,
  responsiveNoticeImportantLabel = '중요 안내',
  title,
}: ResponsiveConcertNewsProps) {
  const headingId = useId()
  const noticesHeadingId = useId()
  const date = concert ? getTicketDate(concert.date) : null

  return (
    <section
      aria-labelledby={headingId}
      className="flow-section home-section home-section--responsive-concerts"
      data-flow-section="concert-program"
      data-performance-presentation="responsive-editorial"
      id="home-responsive-concerts"
    >
      <div className="responsive-concerts__content">
        <header className="responsive-concerts__heading">
          {eyebrow ? <p className="responsive-concerts__eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId}>{title}</h2>
          {description ? <p className="responsive-concerts__description">{description}</p> : null}
        </header>

        {concert ? (
          <article className="responsive-concerts__ticket">
            <div className="responsive-concerts__date-panel">
              {responsiveCardEyebrow ? (
                <p className="responsive-concerts__card-eyebrow">{responsiveCardEyebrow}</p>
              ) : null}
              {date ? (
                <time aria-label={date.label} className="responsive-concerts__date" dateTime={concert.date}>
                  <span aria-hidden="true" className="responsive-concerts__month-day">{date.monthDay}</span>
                  <span aria-hidden="true" className="responsive-concerts__date-detail">
                    <span>{date.year}</span>
                    <span className="responsive-concerts__date-separator">·</span>
                    <span>{date.weekday}</span>
                  </span>
                </time>
              ) : null}
            </div>
            <div className="responsive-concerts__details">
              <h3>{concert.title}</h3>
              {concert.location || concert.time ? (
                <div className="responsive-concerts__venue">
                  {concert.location ? <p>{concert.location}</p> : null}
                  {concert.time ? <p>{concert.time}</p> : null}
                </div>
              ) : null}
              <Button
                className="responsive-concerts__action responsive-concerts__action--detail"
                href={`/concerts/${concert.id}`}
                variant="gold"
              >
                {detailButtonLabel}
              </Button>
            </div>
          </article>
        ) : (
          <div className="responsive-concerts__empty">
            <EmptyState
              action={
                <Button className="responsive-concerts__action" href="/concerts" variant="secondary">
                  {emptyConcertButtonLabel}
                </Button>
              }
              description={emptyConcertText}
              title={emptyConcertTitle}
            />
          </div>
        )}

        <aside aria-labelledby={noticesHeadingId} className="responsive-concerts__notices">
          {programNoteLabel ? (
            <p className="responsive-concerts__notice-eyebrow">{programNoteLabel}</p>
          ) : null}
          <div className="responsive-concerts__notice-heading">
            <h3 id={noticesHeadingId}>{noticePanelTitle}</h3>
            <Button className="responsive-concerts__all-notices" href="/notices" showArrow={false} size="sm" variant="ghost">
              {noticePanelButtonLabel}
              <span aria-hidden="true" className="btn-arrow responsive-concerts__notice-arrow--mobile">→</span>
              <span aria-hidden="true" className="btn-arrow responsive-concerts__notice-arrow--tablet">↗</span>
            </Button>
          </div>
          {notices.length ? (
            <ul className="responsive-concerts__notice-list">
              {notices.map((notice) => (
                <li key={notice.id}>
                  <TransitionLink className="responsive-concerts__notice-row" to={`/notices/${notice.id}`}>
                    <strong>{notice.title}</strong>
                    <span className="responsive-concerts__notice-date">
                      {notice.is_important && responsiveNoticeImportantLabel ? (
                        <span className="responsive-concerts__notice-important">{responsiveNoticeImportantLabel} · </span>
                      ) : null}
                      <span className="responsive-concerts__notice-date--compact">{formatShortDate(notice.created_at).replaceAll(' ', '').replace(/\.$/, '')}</span>
                      <span className="responsive-concerts__notice-date--spaced">{formatShortDate(notice.created_at)}</span>
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          ) : (
            <div className="responsive-concerts__empty">
              <EmptyState
                action={
                  <Button className="responsive-concerts__action" href="/notices" variant="secondary">
                    {emptyNoticeButtonLabel}
                  </Button>
                }
                description={emptyNoticeText}
                title={emptyNoticeTitle}
              />
            </div>
          )}
        </aside>

        <Button className="responsive-concerts__action responsive-concerts__all-concerts" href="/concerts" variant="secondary">
          {concertButtonLabel}
        </Button>
      </div>
    </section>
  )
}
