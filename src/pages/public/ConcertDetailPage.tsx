import { useParams } from 'react-router'

import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { ImageTile } from '../../components/home/ImageTile'
import { useConcertDetailData } from '../../hooks/usePublicData'
import { formatKoreanDate } from '../../utils/formatDate'

export function ConcertDetailPage() {
  const { concertId } = useParams()
  const concertData = useConcertDetailData(concertId)
  const concert = concertData.data

  return (
    <>
      <PageHero
        description={concert?.description || '공연 상세 정보를 확인합니다.'}
        eyebrow="CONCERT DETAIL"
        title={concert?.title || '공연 상세'}
      />
      <Container className="py-section-mobile lg:py-section-desktop">
        {concertData.isLoading ? (
          <LoadingState label="공연 상세를 불러오는 중입니다" />
        ) : null}

        {!concertData.isLoading && concertData.error ? (
          <ErrorState description={concertData.error} />
        ) : null}

        {!concertData.isLoading && !concertData.error && !concert ? (
          <EmptyState
            action={
              <Button href="/concerts" variant="secondary">
                공연 목록으로
              </Button>
            }
            title="공연 정보를 찾을 수 없습니다"
          />
        ) : null}

        {!concertData.isLoading && concert ? (
          <article className="grid gap-8 lg:grid-cols-[420px_1fr]">
            <ImageTile
              alt={`${concert.title} 포스터`}
              className="aspect-[3/4] rounded-formal bg-bg-warm-white bg-none shadow-card"
              fallbackVariant="poster"
              objectFit="contain"
              sizes="(min-width: 1024px) 420px, calc(100vw - 40px)"
              src={concert.poster_url}
            />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="gold">{concert.category}</Badge>
                <Badge variant={concert.status === 'open' ? 'navy' : 'gold'}>
                  {concert.status === 'open' ? '접수/예매 가능' : '공연 정보'}
                </Badge>
              </div>
              <h2 className="mt-5 text-3xl font-bold leading-tight text-navy-deep">
                {concert.title}
              </h2>
              <dl className="mt-6 grid gap-3 rounded-formal border border-line-default bg-bg-warm-white p-5 text-sm leading-6 text-text-muted sm:grid-cols-2">
                <div className="rounded-button bg-bg-ivory px-4 py-3">
                  <dt className="font-semibold text-navy-deep">일시</dt>
                  <dd>
                    {formatKoreanDate(concert.date)}
                    {concert.time ? ` · ${concert.time}` : ''}
                  </dd>
                </div>
                <div className="rounded-button bg-bg-ivory px-4 py-3">
                  <dt className="font-semibold text-navy-deep">장소</dt>
                  <dd>{concert.location}</dd>
                </div>
              </dl>

              {concert.description ? (
                <p className="mt-6 whitespace-pre-line break-keep text-base leading-8 text-text-muted">
                  {concert.description}
                </p>
              ) : null}

              <div className="mt-8 grid gap-5">
                {concert.program.length > 0 ? (
                  <Card className="p-5" radius="formal">
                    <h3 className="text-lg font-semibold text-navy-deep">프로그램</h3>
                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-text-muted">
                      {concert.program.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
                {concert.performers.length > 0 ? (
                  <Card className="p-5" radius="formal">
                    <h3 className="text-lg font-semibold text-navy-deep">출연</h3>
                    <ul className="mt-4 grid gap-2 text-sm leading-6 text-text-muted">
                      {concert.performers.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {concert.ticket_url ? (
                  <Button href={concert.ticket_url} variant="gold">
                    예매하기
                  </Button>
                ) : null}
                {concert.apply_url ? (
                  <Button href={concert.apply_url} variant="primary">
                    신청하기
                  </Button>
                ) : null}
                <Button href="/concerts" variant="secondary">
                  목록으로 돌아가기
                </Button>
              </div>
            </div>
          </article>
        ) : null}
      </Container>
    </>
  )
}
