import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { Badge } from '../../components/common/Badge'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { SeoHead } from '../../components/common/SeoHead'
import { Reveal } from '../../components/common/Reveal'
import { ImageTile } from '../../components/home/ImageTile'
import { useNoticesData } from '../../hooks/usePublicData'
import type { NoticeCategory } from '../../types/content'
import { getCollectionLayoutMode } from '../../utils/collectionLayout'
import { formatShortDate } from '../../utils/formatDate'

const categoryLabels: Record<NoticeCategory, string> = {
  concert: '공연',
  join: '모집',
  news: '소식',
  notice: '공지',
  press: '보도자료',
  rehearsal: '연습',
}

const noticeFilterTabs: Array<{
  label: string
  value: 'all' | 'important'
}> = [
  { label: '전체', value: 'all' },
  { label: '중요공지', value: 'important' },
]

function getExcerpt(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()

  return normalized.length > 110 ? `${normalized.slice(0, 110)}...` : normalized
}

export function NoticesPage() {
  const noticesData = useNoticesData()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedNoticeFilter = searchParams.get('filter')
  const [categoryFilter, setCategoryFilter] = useState<'all' | NoticeCategory>('all')
  const [searchValue, setSearchValue] = useState('')
  const importantOnly = requestedNoticeFilter === 'important'

  const updateNoticeFilter = (nextFilter: 'all' | 'important') => {
    const nextParams = new URLSearchParams(searchParams)

    if (nextFilter === 'important') {
      nextParams.set('filter', 'important')
    } else {
      nextParams.delete('filter')
    }

    setSearchParams(nextParams, { replace: true })
  }

  const filteredNotices = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return noticesData.data.filter((notice) => {
      const matchesImportance = !importantOnly || notice.is_important
      const matchesCategory =
        categoryFilter === 'all' || notice.category === categoryFilter
      const matchesSearch =
        !normalizedSearch ||
        notice.title.toLowerCase().includes(normalizedSearch) ||
        notice.content.toLowerCase().includes(normalizedSearch)

      return matchesImportance && matchesCategory && matchesSearch
    })
  }, [categoryFilter, importantOnly, noticesData.data, searchValue])
  const noticeLayoutMode = getCollectionLayoutMode(filteredNotices.length)

  return (
    <>
      <SeoHead
        description="서울모테트청소년합창단의 입단, 공연, 보도자료와 공식 소식을 확인합니다."
        path="/notices"
        title="공지사항"
      />
      <PageHero
        description="입단, 공연, 보도자료와 합창단의 공식 소식을 확인합니다."
        eyebrow="NOTICES"
        title="공지사항"
      />
      <Container className="page-main">
        {noticesData.error ? (
          <div className="mb-6">
            <ErrorState
              description="Supabase 공개 데이터를 불러오지 못해 기본 공지 정보를 표시합니다."
              title="기본 공지 정보로 표시 중입니다"
            />
          </div>
        ) : null}

        <Reveal>
          <div className="grid gap-4 rounded-formal border border-line-default/85 bg-bg-warm-white/95 p-4 shadow-card lg:grid-cols-[auto_1fr_220px] lg:items-end">
            <div>
              <span className="text-xs font-semibold text-text-muted">필터</span>
              <AnimatedSectionTabs
                activeValue={importantOnly ? 'important' : 'all'}
                ariaLabel="공지 필터"
                className="mt-2 inline-flex rounded-pill border border-line-default bg-bg-ivory/65 p-1"
                onChange={updateNoticeFilter}
                tabs={noticeFilterTabs}
              />
            </div>
            <label>
              <span className="text-xs font-semibold text-text-muted">검색</span>
              <input
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-ivory/65 px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="공지 제목 또는 내용"
                value={searchValue}
              />
            </label>
            <label>
              <span className="text-xs font-semibold text-text-muted">분류</span>
              <select
                className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-ivory/65 px-4 text-sm outline-none focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
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
            <EmptyState compact title="조건에 맞는 공지사항이 없습니다" />
          </div>
        ) : null}

        <div
          className="notice-collection-list mt-8"
          data-mode={noticeLayoutMode}
        >
          {filteredNotices.map((notice) => (
            <Reveal key={notice.id}>
              <Card
                className={[
                  'relative overflow-hidden',
                  notice.is_important ? 'border-gold-warm/65' : '',
                ].join(' ')}
                hoverable
                radius="formal"
              >
                <span
                  aria-hidden="true"
                  className={[
                    'absolute inset-y-0 left-0 w-1',
                    notice.is_important ? 'bg-gold-warm' : 'bg-line-default',
                  ].join(' ')}
                />
                <a
                  className="notice-card-link grid gap-5 p-5 pl-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-ink md:grid-cols-[168px_1fr_auto] md:items-center"
                  href={`/notices/${notice.id}`}
                >
                  <ImageTile
                    alt={`${notice.title} 대표 이미지`}
                    className="aspect-[16/10] rounded-formal md:aspect-[4/3]"
                    sizes="(min-width: 768px) 168px, calc(100vw - 64px)"
                    src={notice.cover_image_url}
                    transform={{
                      quality: 76,
                      resize: 'cover',
                      width: 420,
                      widths: [240, 360, 520],
                    }}
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
                  <span className="text-sm font-semibold text-gold-ink md:justify-self-end">
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
