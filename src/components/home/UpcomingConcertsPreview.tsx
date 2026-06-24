import type { Concert } from '../../types/content'
import { formatKoreanDate } from '../../utils/formatDate'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'

type UpcomingConcertsPreviewProps = {
  concerts: Concert[]
}

const statusLabels: Record<Concert['status'], string> = {
  cancelled: '취소',
  closed: '마감',
  open: '예매 가능',
  scheduled: '예정 공연',
}

const categoryLabels: Record<string, string> = {
  church: '교회/예배연주',
  invited: '초청연주',
  other: '기타',
  past: '지난 공연',
  regular: '정기연주회',
  special: '특별연주',
}

function PosterFallback({ title }: { title: string }) {
  return (
    <div className="flex aspect-[3/4] min-h-64 flex-col justify-between rounded-button bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight p-5 text-bg-warm-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
          SMYC
        </p>
        <div className="mt-5 h-px w-16 bg-gold-warm" aria-hidden="true" />
      </div>
      <p className="break-keep text-xl font-semibold leading-7">{title}</p>
      <p className="text-xs uppercase tracking-[0.18em] text-bg-ivory/55">
        Concert Archive
      </p>
    </div>
  )
}

function ConcertTicketCard({ concert }: { concert: Concert }) {
  return (
    <Card className="group overflow-hidden" hoverable>
      <a
        className="grid h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm md:grid-cols-[150px_1fr]"
        href={`/concerts/${concert.id}`}
      >
        <div className="relative bg-bg-ivory p-4">
          {concert.poster_url ? (
            <img
              alt={`${concert.title} 포스터`}
              className="aspect-[3/4] size-full rounded-button object-cover shadow-[0_14px_34px_rgb(16_35_63/0.14)] transition duration-300 group-hover:scale-[1.015] motion-reduce:group-hover:scale-100"
              loading="lazy"
              src={concert.poster_url}
            />
          ) : (
            <PosterFallback title={concert.title} />
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
          <div className="mt-5 flex gap-4">
            <div className="flex min-w-20 flex-col items-center justify-center rounded-button border border-gold-warm/45 bg-bg-ivory px-3 py-4 text-center">
              <span className="text-xs font-semibold text-gold-warm">DATE</span>
              <span className="mt-2 break-keep text-sm font-bold leading-5 text-navy-deep">
                {formatKoreanDate(concert.date)}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="break-keep text-xl font-semibold leading-7 text-navy-deep">
                {concert.title}
              </h3>
              <p className="mt-3 break-keep text-sm leading-6 text-text-muted">
                {concert.location || '장소 미정'}
                {concert.time ? ` · ${concert.time}` : ''}
              </p>
            </div>
          </div>
          <span className="mt-auto pt-6 text-sm font-semibold text-gold-warm">
            자세히 보기
          </span>
        </div>
      </a>
    </Card>
  )
}

export function UpcomingConcertsPreview({ concerts }: UpcomingConcertsPreviewProps) {
  const visibleConcerts = [...concerts]
    .filter((concert) => concert.is_visible)
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 3)

  return (
    <section className="bg-bg-warm-white py-section-mobile lg:py-section-desktop">
      <Container>
        <Reveal>
          <SectionTitle
            action={
              <Button href="/concerts" variant="secondary">
                전체 공연 보기
              </Button>
            }
            description="서울모테트청소년합창단의 무대를 만나보세요."
            eyebrow="CONCERTS"
            title="다가오는 공연"
          />
        </Reveal>

        {visibleConcerts.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              description="공개 상태의 공연을 등록하면 이 영역에 표시됩니다."
              title="등록된 공연이 없습니다"
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {visibleConcerts.map((concert) => (
              <Reveal key={concert.id}>
                <ConcertTicketCard concert={concert} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
