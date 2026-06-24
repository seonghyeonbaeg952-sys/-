import { useMemo, useState } from 'react'

import { Badge } from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { Reveal } from '../../components/common/Reveal'
import { ImageTile } from '../../components/home/ImageTile'
import { useNoticesData } from '../../hooks/usePublicData'
import type { NoticeCategory } from '../../types/content'
import { formatShortDate } from '../../utils/formatDate'

const categoryLabels: Record<NoticeCategory, string> = {
  news: '소식',
  notice: '공지',
  press: '보도자료',
}

function getExcerpt(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()

  return normalized.length > 110 ? `${normalized.slice(0, 110)}...` : normalized
}

export function NoticesPage() {
  const noticesData = useNoticesData()
  const [categoryFilter, setCategoryFilter] = useState<'all' | NoticeCategory>('all')
  const [searchValue, setSearchValue] = useState('')
  const filteredNotices = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return noticesData.data.filter((notice) => {
      const matchesCategory =
        categoryFilter === 'all' || notice.category === categoryFilter
      const matchesSearch =
        !normalizedSearch ||
        notice.title.toLowerCase().includes(normalizedSearch) ||
        notice.content.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, noticesData.data, searchValue])

  return (
    <>
      <PageHero
        description="입단, 공연, 보도자료와 합창단의 공식 소식을 확인합니다."
        eyebrow="NOTICES"
        title="공지사항"
      />
      <Container className="py-section-mobile lg:py-section-desktop">
        {noticesData.error ? (
          <div className="mb-6">
            <ErrorState
              description="Supabase 공개 데이터를 불러오지 못해 기본 공지 정보를 표시합니다."
              title="기본 공지 정보로 표시 중입니다"
            />
          </div>
        ) : null}

        <Reveal>
          <div className="grid gap-3 rounded-card border border-line-default bg-bg-warm-white p-4 shadow-card md:grid-cols-[1fr_220px]">
            <label>
              <span className="text-xs font-semibold text-text-muted">검색</span>
              <input
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="공지 제목 또는 내용"
                value={searchValue}
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-text-muted">분류</span>
              <select
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) =>
                  setCategoryFilter(event.target.value as 'all' | NoticeCategory)
                }
                value={categoryFilter}
              >
                <option value="all">전체</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Reveal>

        {noticesData.isLoading ? (
          <div className="mt-8">
            <LoadingState label="공지사항을 불러오는 중입니다" />
          </div>
        ) : null}

        {!noticesData.isLoading && filteredNotices.length === 0 ? (
          <div className="mt-8">
            <EmptyState title="조건에 맞는 공지사항이 없습니다" />
          </div>
        ) : null}

        <div className="mt-8 grid gap-4">
          {filteredNotices.map((notice) => (
            <Reveal key={notice.id}>
              <Card
                className={[
                  'overflow-hidden',
                  notice.is_important ? 'border-gold-warm/70' : '',
                ].join(' ')}
                hoverable
              >
                <a
                  className="grid gap-5 p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm md:grid-cols-[168px_1fr_auto] md:items-center"
                  href={`/notices/${notice.id}`}
                >
                  <ImageTile
                    alt={`${notice.title} 대표 이미지`}
                    className="aspect-[16/10] rounded-button md:aspect-[4/3]"
                    src={notice.cover_image_url}
                  />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={notice.is_important ? 'navy' : 'gold'}>
                        {notice.is_important
                          ? '중요'
                          : categoryLabels[notice.category]}
                      </Badge>
                      <span className="text-sm text-text-muted">
                        {formatShortDate(notice.created_at)}
                      </span>
                    </div>
                    <h2 className="mt-3 break-keep text-xl font-semibold leading-7 text-navy-deep">
                      {notice.title}
                    </h2>
                    {notice.content ? (
                      <p className="mt-2 line-clamp-2 break-keep text-sm leading-6 text-text-muted">
                        {getExcerpt(notice.content)}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-gold-warm md:justify-self-end">
                    자세히 보기
                  </span>
                </a>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </>
  )
}
