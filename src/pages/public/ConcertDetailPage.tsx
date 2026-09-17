import { FormattedCopy } from '../../components/site-editor/FormattedCopy'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
import { useMemo } from 'react'
import { useParams } from 'react-router'

import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { SeoHead } from '../../components/common/SeoHead'
import { TransitionLink } from '../../components/common/TransitionLink'
import { ConcertPoster } from '../../components/concerts/ConcertPoster'
import {
  getConcertDateLabel,
  getConcertMetaLine,
  getConcertPeriod,
  getSafeHttpUrl,
  getSeoulDateString,
} from '../../components/concerts/concertScheduleModel'
import { useConcertDetailData } from '../../hooks/usePublicData'
import { usePageCopy } from '../../components/site-editor/usePageCopy'
import type { Concert } from '../../types/content'
import '../../styles/concerts-page.css'
import '../../styles/concert-detail.css'

function buildConcertStructuredData(concert: Concert) {
  const isUpcoming = getConcertPeriod(concert, getSeoulDateString()) === 'upcoming'
  const actionUrl = isUpcoming
    ? getSafeHttpUrl(concert.ticket_url) ?? getSafeHttpUrl(concert.apply_url)
    : null
  const posterUrl = getSafeHttpUrl(concert.poster_url)
  const location = concert.location.trim()
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: concert.title,
    startDate: concert.date,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: concert.status === 'cancelled'
      ? 'https://schema.org/EventCancelled'
      : 'https://schema.org/EventScheduled',
    description: concert.description.trim() || `${concert.title} 공연 정보를 서울모테트청소년합창단 홈페이지에서 확인하세요.`,
    ...(posterUrl ? { image: [posterUrl] } : {}),
    ...(location ? { location: { '@type': 'Place', name: location } } : {}),
    performer: { '@type': 'MusicGroup', name: '서울모테트청소년합창단' },
    organizer: { '@type': 'Organization', name: '서울모테트청소년합창단', url: window.location.origin },
    url: new URL(`/concerts/${encodeURIComponent(concert.id)}`, window.location.origin).toString(),
    ...(actionUrl ? { offers: { '@type': 'Offer', url: actionUrl } } : {}),
  }
}

function ConcertInformation({ concert }: { concert: Concert }) {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('concert-detail')
  const dateLabel = getConcertDateLabel(concert.date)
  const today = getSeoulDateString()
  const period = getConcertPeriod(concert, today)
  const posterUrl = getSafeHttpUrl(concert.poster_url)
  const ticketUrl = period === 'upcoming' ? getSafeHttpUrl(concert.ticket_url) : null
  const applyUrl = period === 'upcoming' ? getSafeHttpUrl(concert.apply_url) : null
  let statusLabel = period === 'past' ? '지난 공연' : '공연 예정'
  if (concert.status === 'closed' && (dateLabel === '날짜 미정' || concert.date.trim() >= today)) {
    statusLabel = '접수·예매 마감'
  }
  if (concert.status === 'cancelled') statusLabel = '공연 취소'
  const statusKey = `concert-detail.status.${concert.status === 'cancelled' ? 'cancelled' : concert.status === 'closed' && (dateLabel === '날짜 미정' || concert.date.trim() >= today) ? 'closed' : period === 'past' ? 'past' : 'upcoming'}`

  return (
    <article className={`concert-detail__article${posterUrl ? ' concert-detail__article--with-poster' : ''}`}>
      <div className="concert-detail__summary">
        <p className="concert-detail__status"><FormattedCopy page="concert-detail" id={statusKey} text={copyText('concert-detail', statusKey, statusLabel)}>{copyText('concert-detail', statusKey, statusLabel)}</FormattedCopy></p>
        <h1>{concert.title}</h1>
        <time className="concert-detail__date" dateTime={dateLabel === '날짜 미정' ? undefined : concert.date}>
          {dateLabel}
        </time>
        <p className="concert-detail__meta">{getConcertMetaLine(concert)}</p>
      </div>

      {posterUrl ? <ConcertPoster key={posterUrl} src={posterUrl} title={concert.title} /> : null}

      <div className="concert-detail__actions">
        {ticketUrl ? <a className="concert-detail__button concert-detail__button--primary" href={ticketUrl} rel="noopener noreferrer" target="_blank">{<FormattedCopy page="concert-detail" id="concert-detail.ticket" text={t('ticket')}>{t('ticket')}</FormattedCopy>} <span aria-hidden="true">↗</span></a> : null}
        {applyUrl ? <a className="concert-detail__button concert-detail__button--primary" href={applyUrl} rel="noopener noreferrer" target="_blank">{<FormattedCopy page="concert-detail" id="concert-detail.apply" text={t('apply')}>{t('apply')}</FormattedCopy>} <span aria-hidden="true">↗</span></a> : null}
        <TransitionLink className={`concert-detail__button${ticketUrl || applyUrl ? '' : ' concert-detail__button--primary'}`} to="/concerts">{<FormattedCopy page="concert-detail" id="concert-detail.list" text={t('list')}>{t('list')}</FormattedCopy>}</TransitionLink>
        <TransitionLink className="concert-detail__button" to="/contact#form">{<FormattedCopy page="concert-detail" id="concert-detail.inquiry" text={t('inquiry')}>{t('inquiry')}</FormattedCopy>}</TransitionLink>
      </div>

      {concert.description.trim() || concert.program.length || concert.performers.length ? (
        <div className="concert-detail__body">
          {concert.description.trim() ? <section aria-labelledby="concert-description"><h2 id="concert-description">{<FormattedCopy page="concert-detail" id="concert-detail.introduction" text={t('introduction')}>{t('introduction')}</FormattedCopy>}</h2><p>{concert.description}</p></section> : null}
          {concert.program.length > 0 ? <section aria-labelledby="concert-program"><h2 id="concert-program">{<FormattedCopy page="concert-detail" id="concert-detail.program" text={t('program')}>{t('program')}</FormattedCopy>}</h2><ul>{concert.program.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section> : null}
          {concert.performers.length > 0 ? <section aria-labelledby="concert-performers"><h2 id="concert-performers">{<FormattedCopy page="concert-detail" id="concert-detail.performers" text={t('performers')}>{t('performers')}</FormattedCopy>}</h2><ul>{concert.performers.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section> : null}
        </div>
      ) : null}
    </article>
  )
}

export function ConcertDetailPage() {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('concert-detail')
  const { concertId } = useParams()
  const concertData = useConcertDetailData(concertId)
  const concert = !concertData.error && !concertData.isLoading ? concertData.data : null
  const structuredData = useMemo(
    () => concert && getConcertDateLabel(concert.date) !== '날짜 미정' ? buildConcertStructuredData(concert) : undefined,
    [concert],
  )

  return (
    <div className="concert-detail">
      <SeoHead
        description={concert?.description || '서울모테트청소년합창단 공연 상세 정보'}
        image={getSafeHttpUrl(concert?.poster_url) ?? undefined}
        jsonLd={structuredData}
        noIndex={!concertData.isLoading && !concert}
        path={concertId ? `/concerts/${encodeURIComponent(concertId)}` : '/concerts'}
        title={concert?.title || '공연 상세'}
      />
      <div className="concert-detail__container">
        <nav aria-label={copyText("concert-detail", "concert-detail.fixed.ConcertDetailPage.a631fbd972", "공연 탐색")} className="concert-detail__breadcrumb">
          <TransitionLink to="/concerts"><span aria-hidden="true">←</span> {<FormattedCopy page="concert-detail" id="concert-detail.back" text={t('back')}>{t('back')}</FormattedCopy>}</TransitionLink>
        </nav>
        {concertData.isLoading ? <LoadingState label={t('loading')} /> : null}
        {!concertData.isLoading && concertData.error ? (
          <ErrorState action={<Button onClick={concertData.refetch}>{<FormattedCopy page="concert-detail" id="concert-detail.retry" text={t('retry')}>{t('retry')}</FormattedCopy>}</Button>} description={concertData.error} />
        ) : null}
        {!concertData.isLoading && !concertData.error && !concert ? (
          <EmptyState action={<Button href="/concerts" variant="secondary">{<FormattedCopy page="concert-detail" id="concert-detail.list" text={t('list')}>{t('list')}</FormattedCopy>}</Button>} title={t('missing')} />
        ) : null}
        {concert ? <ConcertInformation concert={concert} /> : null}
      </div>
    </div>
  )
}
