import type { Concert } from '../../types/content'
import { getColorSampleHref } from '../../utils/colorSamplePath'
import { formatKoreanDate } from '../../utils/formatDate'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'
import { StaffFrame } from '../common/StaffFrame'
import { StaffLines } from '../common/StaffLines'
import { ImageTile } from './ImageTile'

type UpcomingConcertsPreviewProps = {
  buttonLabel?: string
  concerts: Concert[]
  description?: string
  title?: string
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

function PosterFallback({ date, title }: { date?: string; title: string }) {
  return (
    <div className="relative flex aspect-[3/4] min-w-0 flex-col justify-between overflow-hidden rounded-formal bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight p-5 text-bg-warm-white">
      <StaffLines
        className="absolute inset-x-5 top-16 opacity-80"
        density="light"
        variant="inverted"
      />
      <div>
        <p className="type-eyebrow text-gold-soft">SMYC</p>
        <div aria-hidden="true" className="mt-5 h-px w-16 bg-gold-warm" />
      </div>
      <div className="relative">
        {date ? (
          <p className="type-date mb-4 inline-flex rounded-pill border border-gold-warm/45 px-3 py-1 text-xs text-gold-soft">
            {formatKoreanDate(date)}
          </p>
        ) : null}
        <p className="type-card-title text-bg-warm-white">{title}</p>
      </div>
      <p className="type-eyebrow text-bg-ivory/55">Concert Archive</p>
    </div>
  )
}

function ConcertTicketCard({ concert }: { concert: Concert }) {
  const formattedDate = formatKoreanDate(concert.date)
  const hasMeta = Boolean(concert.location.trim() || concert.time)

  return (
    <Card className="group overflow-hidden" hoverable radius="formal">
      <a
        className="flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-ink md:grid md:grid-cols-[170px_minmax(0,1fr)] lg:flex lg:flex-col"
        href={getColorSampleHref(`/concerts/${concert.id}`)}
      >
        <div className="relative min-w-0 bg-bg-ivory p-4">
          {concert.poster_url ? (
            <StaffFrame
              className="shadow-[0_14px_34px_rgb(16_35_63/0.14)]"
              linePosition="top"
              radius="formal"
            >
              <ImageTile
                alt={`${concert.title} 포스터`}
                className="aspect-[3/4] rounded-formal bg-bg-warm-white bg-none"
                fallbackVariant="poster"
                imgClassName="transition duration-300 group-hover:scale-[1.015] motion-reduce:group-hover:scale-100"
                objectFit="contain"
                sizes="(min-width: 1280px) 340px, (min-width: 1024px) 30vw, (min-width: 768px) 170px, calc(100vw - 64px)"
                src={concert.poster_url}
              />
            </StaffFrame>
          ) : (
            <PosterFallback date={concert.date} title={concert.title} />
          )}
        </div>
        <div className="flex min-w-0 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">
              {categoryLabels[concert.category] ?? concert.category}
            </Badge>
            <Badge variant={concert.status === 'open' ? 'navy' : 'gold'}>
              {statusLabels[concert.status]}
            </Badge>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(5.5rem,7rem)_minmax(0,1fr)] lg:grid-cols-1">
            <div className="flex min-w-0 flex-col items-center justify-center rounded-button border border-gold-warm/45 bg-bg-ivory px-3 py-4 text-center">
              <span className="type-eyebrow text-gold-ink">DATE</span>
              <StaffLines className="my-2 opacity-70" density="light" variant="gold" />
              <span className="type-date mt-2 break-keep text-sm leading-5 text-navy-deep">
                {formattedDate}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="type-card-title text-navy-deep">{concert.title}</h3>
              {hasMeta ? (
                <p className="mt-3 break-keep text-sm leading-6 text-text-muted">
                  {concert.location}
                  {concert.location && concert.time ? ' · ' : ''}
                  {concert.time}
                </p>
              ) : null}
            </div>
          </div>
          <span className="mt-auto pt-6 text-sm font-semibold text-gold-ink">
            자세히 보기
          </span>
        </div>
      </a>
    </Card>
  )
}

export function UpcomingConcertsPreview({
  buttonLabel = '전체 공연 보기',
  concerts,
  description = '서울모테트청소년합창단의 무대를 만나보세요.',
  title = '다가오는 공연',
}: UpcomingConcertsPreviewProps) {
  const visibleConcerts = [...concerts]
    .filter((concert) => concert.is_visible)
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 3)

  return (
    <section className="relative overflow-hidden bg-bg-warm-white py-[clamp(4rem,8vw,8rem)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-line-default to-transparent"
      />
      <Container>
        <Reveal variant="fade-up">
          <SectionTitle
            action={
              <Button href="/concerts" variant="secondary">
                {buttonLabel}
              </Button>
            }
            description={description}
            eyebrow="CONCERTS"
            title={title}
          />
        </Reveal>

        {visibleConcerts.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              description="새로운 공연 일정이 확정되면 이 공간에서 안내합니다."
              title="등록된 공연이 없습니다"
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-[clamp(1rem,2vw,1.5rem)] lg:grid-cols-3">
            {visibleConcerts.map((concert, index) => (
              <Reveal key={concert.id} staggerIndex={index} variant="card-rise">
                <ConcertTicketCard concert={concert} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
