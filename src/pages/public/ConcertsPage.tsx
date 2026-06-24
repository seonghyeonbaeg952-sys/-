import { useMemo, useState } from 'react'

import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { ImageTile } from '../../components/home/ImageTile'
import { useConcertsData } from '../../hooks/usePublicData'
import type { Concert, ConcertStatus } from '../../types/content'
import { formatKoreanDate } from '../../utils/formatDate'

const statusLabels: Record<ConcertStatus, string> = {
  cancelled: '취소',
  closed: '마감',
  open: '접수/예매 가능',
  scheduled: '예정',
}

const categoryLabels: Record<string, string> = {
  church: '교회/예배연주',
  invited: '초청연주',
  other: '기타',
  past: '지난 공연',
  regular: '정기연주회',
  special: '특별연주',
}

function isPastConcert(concert: Concert) {
  if (concert.status === 'closed' || concert.status === 'cancelled') {
    return true
  }

  if (!concert.date) {
    return false
  }

  return new Date(`${concert.date}T23:59:59`).getTime() < Date.now()
}

function PosterFallback({ title }: { title: string }) {
  return (
    <div className="flex aspect-[3/4] flex-col justify-between rounded-button bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight p-5 text-bg-warm-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
          SMYC
        </p>
        <div className="mt-5 h-px w-16 bg-gold-warm" aria-hidden="true" />
      </div>
      <p className="break-keep text-xl font-semibold leading-7">{title}</p>
      <p className="text-xs uppercase tracking-[0.18em] text-bg-ivory/55">
        Concert
      </p>
    </div>
  )
}

export function ConcertsPage() {
  const concertsData = useConcertsData()
  const [periodFilter, setPeriodFilter] = useState<'all' | 'past' | 'upcoming'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | ConcertStatus>('all')
  const [searchValue, setSearchValue] = useState('')

  const categories = useMemo(() => {
    return Array.from(new Set(concertsData.data.map((concert) => concert.category)))
  }, [concertsData.data])

  const filteredConcerts = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return concertsData.data.filter((concert) => {
      const isPast = isPastConcert(concert)
      const matchesPeriod =
        periodFilter === 'all' ||
        (periodFilter === 'past' ? isPast : !isPast)
      const matchesCategory =
        categoryFilter === 'all' || concert.category === categoryFilter
      const matchesStatus =
        statusFilter === 'all' || concert.status === statusFilter
      const matchesSearch =
        !normalizedSearch ||
        concert.title.toLowerCase().includes(normalizedSearch) ||
        concert.location.toLowerCase().includes(normalizedSearch)

      return matchesPeriod && matchesCategory && matchesStatus && matchesSearch
    })
  }, [categoryFilter, concertsData.data, periodFilter, searchValue, statusFilter])

  return (
    <>
      <PageHero
        description="정기연주회, 초청연주, 특별연주 일정을 확인합니다."
        eyebrow="CONCERTS"
        title="공연·소식"
      />
      <Container className="py-section-mobile lg:py-section-desktop">
        {concertsData.error ? (
          <div className="mb-6">
            <ErrorState
              description="Supabase 공개 데이터를 불러오지 못해 기본 공연 정보를 표시합니다."
              title="기본 공연 정보로 표시 중입니다"
            />
          </div>
        ) : null}

        <Reveal>
          <div className="grid gap-3 rounded-card border border-line-default bg-bg-warm-white p-4 shadow-card md:grid-cols-4">
            <label className="md:col-span-1">
              <span className="text-xs font-semibold text-text-muted">검색</span>
              <input
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="공연명 또는 장소"
                value={searchValue}
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-text-muted">기간</span>
              <select
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) =>
                  setPeriodFilter(event.target.value as 'all' | 'past' | 'upcoming')
                }
                value={periodFilter}
              >
                <option value="all">전체</option>
                <option value="upcoming">예정 공연</option>
                <option value="past">지난 공연</option>
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold text-text-muted">카테고리</span>
              <select
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) => setCategoryFilter(event.target.value)}
                value={categoryFilter}
              >
                <option value="all">전체</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabels[category] ?? category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs font-semibold text-text-muted">상태</span>
              <select
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | ConcertStatus)
                }
                value={statusFilter}
              >
                <option value="all">전체</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Reveal>

        {concertsData.isLoading ? (
          <div className="mt-8">
            <LoadingState label="공연 목록을 불러오는 중입니다" />
          </div>
        ) : null}

        {!concertsData.isLoading && filteredConcerts.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="조건에 맞는 공연이 없습니다" />
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredConcerts.map((concert) => (
            <Reveal key={concert.id}>
              <Card className="group overflow-hidden" hoverable>
                <a
                  className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                  href={`/concerts/${concert.id}`}
                >
                  <div className="relative bg-bg-ivory p-4">
                    {concert.poster_url ? (
                      <ImageTile
                        alt={`${concert.title} 포스터`}
                        className="aspect-[3/4] rounded-button shadow-[0_14px_30px_rgb(16_35_63/0.12)]"
                        imgClassName="object-cover transition duration-300 group-hover:scale-[1.015] motion-reduce:group-hover:scale-100"
                        src={concert.poster_url}
                      />
                    ) : (
                      <PosterFallback title={concert.title} />
                    )}
                    <div className="absolute left-7 top-7 rounded-button border border-bg-warm-white/70 bg-bg-warm-white/90 px-3 py-2 text-xs font-semibold leading-5 text-navy-deep shadow-sm backdrop-blur-sm">
                      {formatKoreanDate(concert.date)}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="gold">
                        {categoryLabels[concert.category] ?? concert.category}
                      </Badge>
                      <Badge variant={concert.status === 'open' ? 'navy' : 'gold'}>
                        {statusLabels[concert.status]}
                      </Badge>
                    </div>
                    <h2 className="mt-4 break-keep text-xl font-semibold leading-7 text-navy-deep">
                      {concert.title}
                    </h2>
                    <dl className="mt-4 grid gap-2 text-sm leading-6 text-text-muted">
                      <div>
                        <dt className="sr-only">날짜</dt>
                        <dd>{formatKoreanDate(concert.date)}</dd>
                      </div>
                      {concert.time ? (
                        <div>
                          <dt className="sr-only">시간</dt>
                          <dd>{concert.time}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="sr-only">장소</dt>
                        <dd className="break-keep">{concert.location}</dd>
                      </div>
                    </dl>
                    <span className="mt-5 inline-block text-sm font-semibold text-gold-warm">
                      자세히 보기
                    </span>
                  </div>
                </a>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-10">
          <Button href="/notices" variant="secondary">
            공지사항 보기
          </Button>
        </div>
      </Container>
    </>
  )
}
