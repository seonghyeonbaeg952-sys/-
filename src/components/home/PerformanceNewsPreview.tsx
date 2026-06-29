import type { Concert, Notice } from '../../types/content'
import { formatKoreanDate, formatShortDate } from '../../utils/formatDate'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'
import { StaffLines } from '../common/StaffLines'
import { ImageTile } from './ImageTile'

type PerformanceNewsPreviewProps = {
  concerts: Concert[]
  notices: Notice[]
}

const concertStatusLabels: Record<Concert['status'], string> = {
  cancelled: '취소',
  closed: '마감',
  open: '예매 가능',
  scheduled: '예정 공연',
}

const noticeCategoryLabels: Record<Notice['category'], string> = {
  concert: '공연',
  join: '모집',
  news: '소식',
  notice: '공지',
  press: '보도자료',
  rehearsal: '연습',
}

function FeaturedConcertCard({ concert }: { concert?: Concert }) {
  if (!concert) {
    return (
      <div className="featured-concert-card">
        <EmptyState
          action={
            <Button href="/concerts" variant="secondary">
              전체 공연 보기
            </Button>
          }
          description="새로운 공연 일정이 준비되면 이 공간에서 안내합니다."
          title="등록된 공연이 없습니다"
        />
      </div>
    )
  }

  return (
    <Card className="featured-concert-card overflow-hidden" hoverable radius="soft">
      <a
        className="featured-concert-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
        href={`/concerts/${concert.id}`}
      >
        <div className="featured-concert-poster">
          {concert.poster_url ? (
            <ImageTile
              alt={`${concert.title} 포스터`}
              className="size-full rounded-formal bg-bg-ivory"
              fallbackVariant="poster"
              objectFit="contain"
              sizes="(min-width: 1024px) 300px, (min-width: 640px) 34vw, calc(100vw - 96px)"
              src={concert.poster_url}
            />
          ) : (
            <div className="relative flex size-full flex-col justify-between overflow-hidden rounded-formal bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight p-5 text-bg-warm-white">
              <StaffLines
                className="absolute inset-x-5 top-16 opacity-75"
                density="light"
                variant="inverted"
              />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
                SMYC
              </p>
              <p className="relative mt-auto break-keep text-xl font-semibold leading-7">
                {concert.title}
              </p>
            </div>
          )}
        </div>

        <div className="featured-concert-content">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold">다가오는 공연</Badge>
            <Badge variant={concert.status === 'open' ? 'navy' : 'gold'}>
              {concertStatusLabels[concert.status]}
            </Badge>
          </div>
          <div className="mt-6 rounded-button border border-gold-warm/35 bg-bg-ivory px-4 py-3">
            <p className="text-xs font-semibold text-gold-warm">DATE</p>
            <p className="mt-2 break-keep text-base font-bold leading-6 text-navy-deep">
              {formatKoreanDate(concert.date)}
            </p>
          </div>
          <h3 className="mt-6 break-keep text-3xl font-semibold leading-tight text-navy-deep">
            {concert.title}
          </h3>
          <p className="mt-4 break-keep text-base leading-7 text-text-muted">
            {concert.location || '장소 미정'}
            {concert.time ? ` · ${concert.time}` : ''}
          </p>
          <span className="mt-auto inline-flex pt-6 text-sm font-semibold text-gold-warm">
            자세히 보기
          </span>
        </div>
      </a>
    </Card>
  )
}

function NoticeListCard({ notices }: { notices: Notice[] }) {
  return (
    <Card className="notice-list-card" radius="soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-warm">
            NOTICE
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-navy-deep">중요 안내</h3>
        </div>
        <Button href="/notices" size="sm" variant="secondary">
          공지사항 보기
        </Button>
      </div>

      {notices.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            description="새로운 공지와 합창단 소식을 준비하고 있습니다."
            title="등록된 공지사항이 없습니다"
          />
        </div>
      ) : (
        <div className="mt-5">
          {notices.map((notice) => (
            <a
              className="notice-item group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
              href={`/notices/${notice.id}`}
              key={notice.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={notice.is_important ? 'navy' : 'gold'}>
                  {notice.is_important ? '중요' : noticeCategoryLabels[notice.category]}
                </Badge>
                <span className="text-xs text-text-muted">
                  {formatShortDate(notice.created_at)}
                </span>
              </div>
              <h4 className="break-keep text-lg font-semibold leading-7 text-navy-deep transition group-hover:text-gold-warm">
                {notice.title}
              </h4>
            </a>
          ))}
        </div>
      )}
    </Card>
  )
}

export function PerformanceNewsPreview({ concerts, notices }: PerformanceNewsPreviewProps) {
  const featuredConcert = [...concerts]
    .filter((concert) => concert.is_visible)
    .sort((first, second) => first.date.localeCompare(second.date))[0]
  const visibleNotices = [...notices]
    .filter((notice) => notice.is_visible)
    .sort((first, second) => {
      if (first.is_important !== second.is_important) {
        return first.is_important ? -1 : 1
      }

      return second.created_at.localeCompare(first.created_at)
    })
    .slice(0, 4)

  return (
    <section className="home-section relative overflow-hidden bg-bg-warm-white">
      <Container>
        <Reveal variant="fade-up">
          <SectionTitle
            action={
              <div className="flex flex-wrap gap-2">
                <Button href="/concerts" variant="secondary">
                  전체 공연 보기
                </Button>
                <Button href="/notices" variant="secondary">
                  공지사항 보기
                </Button>
              </div>
            }
            description="서울모테트청소년합창단의 무대와 중요한 안내를 확인하세요."
            eyebrow="CONCERTS"
            title="공연과 소식"
          />
        </Reveal>
        <div className="home-performance-news-grid mt-9">
          <Reveal variant="card-rise">
            <FeaturedConcertCard concert={featuredConcert} />
          </Reveal>
          <Reveal delay={80} variant="card-rise">
            <NoticeListCard notices={visibleNotices} />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
