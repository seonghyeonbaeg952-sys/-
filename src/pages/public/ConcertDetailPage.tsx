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

  return (
    <article className={`concert-detail__article${posterUrl ? ' concert-detail__article--with-poster' : ''}`}>
      <div className="concert-detail__summary">
        <p className="concert-detail__status">{statusLabel}</p>
        <h1>{concert.title}</h1>
        <time className="concert-detail__date" dateTime={dateLabel === '날짜 미정' ? undefined : concert.date}>
          {dateLabel}
        </time>
        <p className="concert-detail__meta">{getConcertMetaLine(concert)}</p>
      </div>

      {posterUrl ? <ConcertPoster key={posterUrl} src={posterUrl} title={concert.title} /> : null}

      <div className="concert-detail__actions">
        {ticketUrl ? <a className="concert-detail__button concert-detail__button--primary" href={ticketUrl} rel="noopener noreferrer" target="_blank">예매하기 <span aria-hidden="true">↗</span></a> : null}
        {applyUrl ? <a className="concert-detail__button concert-detail__button--primary" href={applyUrl} rel="noopener noreferrer" target="_blank">신청하기 <span aria-hidden="true">↗</span></a> : null}
        <TransitionLink className={`concert-detail__button${ticketUrl || applyUrl ? '' : ' concert-detail__button--primary'}`} to="/concerts">공연 목록으로</TransitionLink>
        <TransitionLink className="concert-detail__button" to="/contact#form">공연 문의</TransitionLink>
      </div>

      {concert.description.trim() || concert.program.length || concert.performers.length ? (
        <div className="concert-detail__body">
          {concert.description.trim() ? <section aria-labelledby="concert-description"><h2 id="concert-description">공연 소개</h2><p>{concert.description}</p></section> : null}
          {concert.program.length > 0 ? <section aria-labelledby="concert-program"><h2 id="concert-program">프로그램</h2><ul>{concert.program.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section> : null}
          {concert.performers.length > 0 ? <section aria-labelledby="concert-performers"><h2 id="concert-performers">출연</h2><ul>{concert.performers.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section> : null}
        </div>
      ) : null}
    </article>
  )
}

export function ConcertDetailPage() {
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
        <nav aria-label="공연 탐색" className="concert-detail__breadcrumb">
          <TransitionLink to="/concerts"><span aria-hidden="true">←</span> 공연·소식</TransitionLink>
        </nav>
        {concertData.isLoading ? <LoadingState label="공연 상세를 불러오는 중입니다" /> : null}
        {!concertData.isLoading && concertData.error ? (
          <ErrorState action={<Button onClick={concertData.refetch}>다시 불러오기</Button>} description={concertData.error} />
        ) : null}
        {!concertData.isLoading && !concertData.error && !concert ? (
          <EmptyState action={<Button href="/concerts" variant="secondary">공연 목록으로</Button>} title="공연 정보를 찾을 수 없습니다" />
        ) : null}
        {concert ? <ConcertInformation concert={concert} /> : null}
      </div>
    </div>
  )
}
