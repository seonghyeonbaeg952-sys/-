import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { ConcertFilterDrawer } from '../../components/concerts/ConcertFilterDrawer'
import {
  buildConcertSchedule,
  filterConcerts,
  getConcertMetaLine,
  getConcertPeriod,
  getConcertStatusLabel,
  getSafeHttpUrl,
  getSeoulDateString,
} from '../../components/concerts/concertScheduleModel'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { FilterSelect } from '../../components/common/FilterSelect'
import { LoadingState } from '../../components/common/LoadingState'
import { SeoHead } from '../../components/common/SeoHead'
import { TransitionLink } from '../../components/common/TransitionLink'
import { useConcertsData } from '../../hooks/usePublicData'
import '../../styles/concerts-page.css'
import type { Concert } from '../../types/content'

type PeriodFilter = 'all' | 'past' | 'upcoming'

const FEATURED_ARCHIVE_IMAGE = '/images/about/conductor/smyc-performance-2026.jpg'

const categoryLabels: Record<string, string> = {
  church: '교회·예배연주',
  invited: '초청연주',
  other: '기타',
  past: '지난 공연',
  regular: '정기연주회',
  special: '특별연주',
}

const concertsPageDescription =
  '서울모테트청소년합창단의 정기연주회, 초청연주, 특별연주 일정과 공연 정보를 확인합니다.'

const monthLabels = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

function getCategoryLabel(category: string) {
  return categoryLabels[category] ?? (category.trim() || '기타')
}

function getDateParts(dateString: string) {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return {
      day: '—',
      month: 'DATE',
      monthDay: '—.—',
      weekday: '',
      year: '',
    }
  }

  const [, year, month, day] = match
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(utcDate)

  return {
    day,
    month: monthLabels[Number(month) - 1] ?? 'DATE',
    monthDay: `${month}.${day}`,
    weekday,
    year,
  }
}

function getPeriodFilter(value: string | null): PeriodFilter {
  if (value === 'all' || value === 'past' || value === 'upcoming') {
    return value
  }

  return value ? 'all' : 'upcoming'
}

function PosterPlate({ concert }: { concert: Concert }) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null)
  const safePosterUrl = getSafeHttpUrl(concert.poster_url)
  const canShowPoster = Boolean(safePosterUrl && safePosterUrl !== failedPosterUrl)

  return (
    <div
      aria-label={
        canShowPoster
          ? `${concert.title} 포스터`
          : `${concert.title} 포스터 준비 중`
      }
      className="concerts-page__poster-plate"
      role="img"
    >
      {canShowPoster ? (
        <img
          alt=""
          onError={() => setFailedPosterUrl(safePosterUrl)}
          src={safePosterUrl ?? undefined}
        />
      ) : (
        <div className="concerts-page__poster-fallback">
          <span>SEOUL MOTET YOUTH CHOIR</span>
          <i aria-hidden="true" />
          <strong>SMYC</strong>
          <small>CONCERT PROGRAM</small>
        </div>
      )}
    </div>
  )
}

function FeaturedStage({ concert, today }: { concert: Concert | null; today: string }) {
  if (!concert) {
    return (
      <div className="concerts-page__stage concerts-page__stage--empty">
        <img alt="" aria-hidden="true" src={FEATURED_ARCHIVE_IMAGE} />
        <div className="concerts-page__stage-wash" />
        <div className="concerts-page__stage-empty-copy">
          <span>CONCERT PROGRAM</span>
          <strong>새로운 공연 소식을 준비하고 있습니다.</strong>
        </div>
      </div>
    )
  }

  const dateParts = getDateParts(concert.date)
  const period = getConcertPeriod(concert, today)

  return (
    <div className="concerts-page__stage">
      <img alt="" aria-hidden="true" src={FEATURED_ARCHIVE_IMAGE} />
      <div className="concerts-page__stage-wash" />
      <div aria-hidden="true" className="concerts-page__stage-orbit" />
      <div className="concerts-page__stage-copy">
        <p>{period === 'upcoming' ? 'NEXT PERFORMANCE' : 'LATEST RECORD'}</p>
        <strong className="concerts-page__stage-date">{dateParts.monthDay}</strong>
        <h2>{concert.title}</h2>
        <span>
          {[dateParts.weekday, concert.time.trim() || '시간 미정']
            .filter(Boolean)
            .join(' · ')}
          <br />
          {concert.location.trim() || '장소 추후 안내'}
        </span>
        <TransitionLink
          aria-label={`${concert.title} 공연 상세 보기`}
          className="concerts-page__stage-link"
          to={`/concerts/${concert.id}`}
        >
          공연 상세 <span aria-hidden="true">→</span>
        </TransitionLink>
      </div>
      <div className="concerts-page__stage-poster">
        <PosterPlate concert={concert} />
      </div>
    </div>
  )
}

function ConcertRow({ concert, today }: { concert: Concert; today: string }) {
  const dateParts = getDateParts(concert.date)
  const period = getConcertPeriod(concert, today)
  const hasPoster = Boolean(getSafeHttpUrl(concert.poster_url))

  return (
    <article className="concerts-page__event" data-has-poster={hasPoster}>
      <TransitionLink
        aria-label={`${concert.title} ${period === 'past' ? '공연 기록' : '공연 상세'} 보기`}
        className="concerts-page__event-link"
        to={`/concerts/${concert.id}`}
      >
        <time className="concerts-page__event-date" dateTime={concert.date || undefined}>
          <strong>{dateParts.day}</strong>
          <span>
            {dateParts.month}
            {dateParts.year ? ` · ${dateParts.year}` : ''}
          </span>
        </time>

        {hasPoster ? (
          <span className="concerts-page__event-poster">
            <PosterPlate concert={concert} />
          </span>
        ) : null}

        <div className="concerts-page__event-copy">
          <p>
            {getCategoryLabel(concert.category)} ·{' '}
            {getConcertStatusLabel(concert.status, period)}
          </p>
          <h3>{concert.title}</h3>
          <span>{getConcertMetaLine(concert)}</span>
        </div>

        <span className="concerts-page__event-action">
          <span className="concerts-page__event-action-label">
            {period === 'past' ? '기록 보기' : '공연 상세'}
          </span>
          <span aria-hidden="true">→</span>
        </span>
      </TransitionLink>
    </article>
  )
}

export function ConcertsPage() {
  const concertsData = useConcertsData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedArchiveYear, setSelectedArchiveYear] = useState('')
  const today = useMemo(() => getSeoulDateString(), [])
  const periodFilter = getPeriodFilter(searchParams.get('filter'))

  const categories = useMemo(
    () =>
      Array.from(
        new Set(concertsData.data.map((concert) => concert.category).filter(Boolean)),
      ).sort((left, right) => left.localeCompare(right, 'ko-KR')),
    [concertsData.data],
  )

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          concertsData.data
            .map((concert) => getDateParts(concert.date).year)
            .filter(Boolean),
        ),
      ).sort((left, right) => right.localeCompare(left)),
    [concertsData.data],
  )

  const rawSchedule = useMemo(
    () => buildConcertSchedule(concertsData.data, today),
    [concertsData.data, today],
  )

  const filteredConcerts = useMemo(
    () =>
      filterConcerts(concertsData.data, {
        category: categoryFilter,
        query: searchValue,
        year: yearFilter,
      }),
    [categoryFilter, concertsData.data, searchValue, yearFilter],
  )

  const filteredSchedule = useMemo(
    () => buildConcertSchedule(filteredConcerts, today),
    [filteredConcerts, today],
  )

  const archiveYears = useMemo(
    () =>
      Array.from(
        new Set(
          filteredSchedule.past
            .map((concert) => getDateParts(concert.date).year)
            .filter(Boolean),
        ),
      ),
    [filteredSchedule.past],
  )

  const activeArchiveYear = archiveYears.includes(selectedArchiveYear)
    ? selectedArchiveYear
    : (archiveYears[0] ?? '')
  const archiveRowsForYear = filteredSchedule.past.filter(
    (concert) => !activeArchiveYear || getDateParts(concert.date).year === activeArchiveYear,
  )
  const displayedArchiveRows =
    periodFilter === 'upcoming' ? archiveRowsForYear.slice(0, 1) : archiveRowsForYear
  const showUpcoming = periodFilter !== 'past'
  const showArchive = periodFilter !== 'upcoming' || displayedArchiveRows.length > 0
  const activeFilterCount = Number(categoryFilter !== 'all') + Number(yearFilter !== 'all')
  const resultCount = filteredSchedule.upcoming.length + filteredSchedule.past.length

  const categoryOptions = useMemo(
    () => [
      { label: '전체 유형', value: 'all' },
      ...categories.map((category) => ({
        label: getCategoryLabel(category),
        value: category,
      })),
    ],
    [categories],
  )
  const yearOptions = useMemo(
    () => [
      { label: '날짜 전체', value: 'all' },
      ...years.map((year) => ({ label: `${year}년`, value: year })),
    ],
    [years],
  )

  const concertListStructuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [...rawSchedule.upcoming, ...rawSchedule.past]
        .slice(0, 20)
        .map((concert, index) => ({
          '@type': 'ListItem',
          name: concert.title,
          position: index + 1,
          url: new URL(`/concerts/${concert.id}`, window.location.origin).toString(),
        })),
    }),
    [rawSchedule.past, rawSchedule.upcoming],
  )

  const updatePeriodFilter = (value: PeriodFilter) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('filter', value)
    setSearchParams(nextParams, { replace: true })
  }

  const resetFilters = () => {
    setCategoryFilter('all')
    setYearFilter('all')
    setSearchValue('')
  }

  return (
    <>
      <SeoHead
        description={concertsPageDescription}
        jsonLd={concertListStructuredData}
        path="/concerts"
        title="공연·소식"
      />

      <div className="concerts-page">
        <section className="concerts-page__hero" aria-labelledby="concerts-page-title">
          <div className="concerts-page__hero-inner">
            <div className="concerts-page__hero-copy">
              <p>
                CONCERT PROGRAM ·{' '}
                {getDateParts(rawSchedule.featured?.date ?? '').year || today.slice(0, 4)}{' '}
                SEASON
              </p>
              <i aria-hidden="true" />
              <h1 id="concerts-page-title">
                공연 일정과 지난 기록을
                <br />
                한눈에 확인합니다.
              </h1>
              <span>공연 날짜, 시간, 장소와 신청·예매 여부를 확인하세요.</span>
              <nav aria-label="공연·소식 바로가기" className="concerts-page__local-nav">
                <a aria-current="page" href="#concert-discovery">
                  공연 일정
                </a>
                <TransitionLink to="/notices">공지사항</TransitionLink>
              </nav>
            </div>
            <FeaturedStage concert={rawSchedule.featured} today={today} />
          </div>
        </section>

        <section className="concerts-page__discovery" id="concert-discovery">
          <div className="concerts-page__discovery-inner">
            <div className="concerts-page__discovery-heading">
              <h2>공연 찾기</h2>
              <p aria-live="polite">전체 {resultCount}개 · 날짜순</p>
            </div>

            <div className="concerts-page__filter-bar">
              <div aria-label="공연 기간" className="concerts-page__period-tabs" role="group">
                {(
                  [
                    ['all', `전체 ${resultCount}`],
                    ['upcoming', `예정 공연 ${filteredSchedule.upcoming.length}`],
                    ['past', `지난 공연 ${filteredSchedule.past.length}`],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    aria-label={label}
                    aria-pressed={periodFilter === value}
                    className={periodFilter === value ? 'is-active' : ''}
                    key={value}
                    onClick={() => updatePeriodFilter(value)}
                    type="button"
                  >
                    <span className="concerts-page__period-long">{label}</span>
                    <span className="concerts-page__period-short">
                      {value === 'all'
                        ? '전체'
                        : value === 'upcoming'
                          ? `예정 ${filteredSchedule.upcoming.length}`
                          : `지난 ${filteredSchedule.past.length}`}
                    </span>
                  </button>
                ))}
              </div>

              <div className="concerts-page__controls">
                <label className="concerts-page__search">
                  <span className="sr-only">공연명 또는 장소 검색</span>
                  <input
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="공연명·장소 검색"
                    type="search"
                    value={searchValue}
                  />
                </label>

                <div className="concerts-page__desktop-filters">
                  <FilterSelect
                    label="날짜 선택"
                    onChange={setYearFilter}
                    options={yearOptions}
                    value={yearFilter}
                  />
                  <FilterSelect
                    label="공연 유형"
                    onChange={setCategoryFilter}
                    options={categoryOptions}
                    value={categoryFilter}
                  />
                  <button className="concerts-page__reset" onClick={resetFilters} type="button">
                    초기화
                  </button>
                </div>

                <button
                  aria-expanded={isFilterOpen}
                  aria-haspopup="dialog"
                  className="concerts-page__filter-trigger"
                  onClick={() => setIsFilterOpen(true)}
                  type="button"
                >
                  <span>필터 {activeFilterCount}</span>
                  <span aria-hidden="true">＋</span>
                </button>
              </div>
            </div>

            <p className="concerts-page__filter-summary">
              {periodFilter === 'all'
                ? '전체 공연'
                : periodFilter === 'past'
                  ? '지난 공연'
                  : '예정 공연'}{' '}
              · {categoryFilter === 'all' ? '전체 유형' : getCategoryLabel(categoryFilter)} ·{' '}
              {yearFilter === 'all' ? '날짜 제한 없음' : `${yearFilter}년`}
            </p>
          </div>
        </section>

        {concertsData.isLoading ? (
          <section className="concerts-page__state" aria-label="공연 목록 로딩">
            <LoadingState label="공연 목록을 불러오는 중입니다" />
          </section>
        ) : null}

        {!concertsData.isLoading && concertsData.error ? (
          <section className="concerts-page__state">
            <ErrorState
              action={
                <button
                  className="concerts-page__state-action"
                  onClick={() => void concertsData.refetch()}
                  type="button"
                >
                  다시 불러오기
                </button>
              }
              description="공연 정보를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요."
              title="공연 목록을 불러오지 못했습니다"
            />
          </section>
        ) : null}

        {!concertsData.isLoading && !concertsData.error ? (
          <>
            {showUpcoming ? (
              <section
                aria-labelledby="upcoming-concerts-title"
                className="concerts-page__upcoming"
                id="upcoming-concerts"
              >
                <div className="concerts-page__section-inner">
                  <div className="concerts-page__section-heading">
                    <h2 id="upcoming-concerts-title">다가오는 공연</h2>
                    <p>가까운 날짜순 · {filteredSchedule.upcoming.length}개</p>
                  </div>
                  <div aria-hidden="true" className="concerts-page__section-rule" />

                  {filteredSchedule.upcoming.length > 0 ? (
                    <div className="concerts-page__event-list">
                      {filteredSchedule.upcoming.map((concert) => (
                        <ConcertRow concert={concert} key={concert.id} today={today} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      compact
                      description="검색어나 날짜·유형 필터를 조정해 보세요."
                      title="조건에 맞는 예정 공연이 없습니다"
                    />
                  )}
                </div>
              </section>
            ) : null}

            {showArchive ? (
              <section
                aria-labelledby="past-concerts-title"
                className="concerts-page__archive"
                id="past-concerts"
              >
                <div className="concerts-page__section-inner">
                  <div className="concerts-page__section-heading">
                    <h2 id="past-concerts-title">지난 공연 기록</h2>
                    <p>
                      {activeArchiveYear ? `${activeArchiveYear}년` : '기록'} ·{' '}
                      {displayedArchiveRows.length}개
                    </p>
                  </div>

                  {archiveYears.length > 0 ? (
                    <div aria-label="지난 공연 연도" className="concerts-page__archive-years">
                      {archiveYears.map((year) => (
                        <button
                          aria-pressed={activeArchiveYear === year}
                          className={activeArchiveYear === year ? 'is-active' : ''}
                          key={year}
                          onClick={() => setSelectedArchiveYear(year)}
                          type="button"
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  {displayedArchiveRows.length > 0 ? (
                    <div className="concerts-page__event-list concerts-page__event-list--archive">
                      {displayedArchiveRows.map((concert) => (
                        <ConcertRow concert={concert} key={concert.id} today={today} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      compact
                      description="공개된 지난 공연이 등록되면 이곳에 표시됩니다."
                      title="지난 공연 기록이 없습니다"
                    />
                  )}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      <ConcertFilterDrawer
        category={categoryFilter}
        categoryOptions={categoryOptions}
        isOpen={isFilterOpen}
        onCategoryChange={setCategoryFilter}
        onClose={() => setIsFilterOpen(false)}
        onReset={resetFilters}
        onYearChange={setYearFilter}
        resultCount={resultCount}
        year={yearFilter}
        yearOptions={yearOptions}
      />
    </>
  )
}
