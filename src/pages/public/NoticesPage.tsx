import { useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { SeoHead } from '../../components/common/SeoHead'
import { FilterSelect } from '../../components/common/FilterSelect'
import {
  filterNotices,
  formatNoticeDate,
  getNoticeCategoryLabel,
  getNoticeExcerpt,
  isNoticeCategory,
  noticeCategoryLabels,
} from '../../components/notices/noticeViewModel'
import { useNoticesData } from '../../hooks/usePublicData'
import '../../styles/notices-page.css'

const categoryOptions = [
  { value: 'all', label: '전체 분류' },
  ...Object.entries(noticeCategoryLabels).map(([value, label]) => ({ value, label })),
]

export function NoticesPage() {
  const noticesData = useNoticesData()
  const [searchParams, setSearchParams] = useSearchParams()
  const resultsRef = useRef<HTMLDivElement>(null)
  const requestedCategory = searchParams.get('category')
  const category = isNoticeCategory(requestedCategory) ? requestedCategory : 'all'
  const query = searchParams.get('q') ?? ''
  const [search, setSearch] = useState({ urlQuery: query, value: query })
  // Keep typing synchronous; router transitions must not overwrite new keystrokes.
  // Sync only when navigation actually changes the saved query (back / reload).
  if (search.urlQuery !== query) setSearch({ urlQuery: query, value: query })
  const searchValue = search.value
  const importantOnly = searchParams.get('filter') === 'important'
  const hasFilters = importantOnly || category !== 'all' || searchValue.trim() !== ''

  const filteredNotices = useMemo(
    () => filterNotices(noticesData.data, { category, importantOnly, query: searchValue }),
    [noticesData.data, category, importantOnly, searchValue],
  )
  const total = noticesData.data.filter((notice) => notice.is_visible).length

  function updateFilter(key: 'q' | 'category' | 'filter', value: string) {
    const nextParams = new URLSearchParams(listParams)
    if (!value || (key !== 'q' && value === 'all')) nextParams.delete(key)
    else nextParams.set(key, value)
    setSearchParams(nextParams, { replace: true, preventScrollReset: true })
  }

  function resetFilters() {
    setSearch({ urlQuery: query, value: '' })
    const nextParams = new URLSearchParams(searchParams)
    for (const key of ['q', 'category', 'filter']) nextParams.delete(key)
    setSearchParams(nextParams, { replace: true, preventScrollReset: true })
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateFilter('q', searchValue)
    resultsRef.current?.focus({ preventScroll: true })
  }

  const listParams = new URLSearchParams(searchParams)
  if (searchValue) listParams.set('q', searchValue)
  else listParams.delete('q')
  const listSearch = listParams.toString()

  return (
    <div className="notices-page">
      <SeoHead
        description="서울모테트청소년합창단의 입단, 공연, 보도자료와 공식 소식을 확인합니다."
        path="/notices"
        title="공지사항"
      />
      <header className="notices-page__hero notices-page__shell">
        <div>
          <p className="notices-page__eyebrow">NEWS &amp; NOTICES</p>
          <h1 className="notices-page__title">공지사항</h1>
          <p className="notices-page__description">
            입단 안내부터 공연 소식까지,<br />
            서울모테트청소년합창단의 공식 소식을 전합니다.
          </p>
        </div>
        <div aria-hidden="true" className="notices-page__signature">
          <i>Notices.</i>
          <span>SEOUL MOTET YOUTH CHOIR</span>
        </div>
      </header>

      <section aria-label="공지 목록" className="notices-page__content notices-page__shell">
        <div className="notices-page__controls">
          <div aria-label="공지 필터" className="notices-page__tabs" role="group">
            <button
              aria-controls="notice-results"
              aria-pressed={!importantOnly}
              className="notices-page__filter"
              onClick={() => updateFilter('filter', 'all')}
              type="button"
            >
              전체{!noticesData.isLoading && !noticesData.error ? ` ${total}` : ''}
            </button>
            <button
              aria-controls="notice-results"
              aria-pressed={importantOnly}
              className="notices-page__filter"
              onClick={() => updateFilter('filter', 'important')}
              type="button"
            >
              중요 공지
            </button>
          </div>
          <form aria-label="공지 검색" className="notices-page__search" onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor="notice-search">공지 제목 또는 내용 검색</label>
            <input
              autoComplete="off"
              id="notice-search"
              onChange={(event) => setSearch({ urlQuery: query, value: event.target.value })}
              placeholder="공지 제목 또는 내용 검색"
              type="search"
              value={searchValue}
            />
            <button type="submit">검색</button>
          </form>
          <FilterSelect className="notices-page__category" label="공지 분류" onChange={(value) => updateFilter('category', value)} options={categoryOptions} value={category} />
        </div>

        <div
          aria-busy={noticesData.isLoading}
          aria-label="공지 검색 결과"
          className="notices-page__results"
          id="notice-results"
          ref={resultsRef}
          tabIndex={-1}
        >
          {noticesData.isLoading ? (
            <div className="notices-page__state"><LoadingState label="공지사항을 불러오는 중입니다" /></div>
          ) : noticesData.error ? (
            <div className="notices-page__state" role="alert">
              <ErrorState
                title="공지사항을 불러오지 못했습니다"
                description="연결 상태를 확인한 뒤 다시 시도해 주세요."
                action={<button className="notices-page__action" onClick={noticesData.refetch} type="button">다시 시도</button>}
              />
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="notices-page__state" role="status">
              <h2>{hasFilters ? '조건에 맞는 공지가 없습니다.' : '등록된 공지사항이 없습니다.'}</h2>
              <p>{hasFilters ? '분류를 바꾸거나 전체 공지를 확인해 주세요.' : '새로운 소식이 등록되면 이곳에서 안내합니다.'}</p>
              {hasFilters ? <button className="notices-page__action" onClick={resetFilters} type="button">전체 공지 보기</button> : null}
            </div>
          ) : (
            <ul className="notices-page__list">
              {filteredNotices.map((notice) => (
                <li key={notice.id}>
                  <Link
                    className={`notices-page__row${notice.is_important ? ' notices-page__row--important' : ''}`}
                    to={{ pathname: `/notices/${encodeURIComponent(notice.id)}`, search: listSearch ? `?${listSearch}` : '' }}
                  >
                    <span className="notices-page__row-category">
                      {notice.is_important ? '중요 공지' : getNoticeCategoryLabel(notice.category)}
                    </span>
                    <div className="notices-page__row-copy">
                      <h2>{notice.title}</h2>
                      {notice.content ? <p>{getNoticeExcerpt(notice.content)}</p> : null}
                    </div>
                    <time className="notices-page__row-date" dateTime={notice.created_at}>{formatNoticeDate(notice.created_at)}</time>
                    <span aria-hidden="true" className="notices-page__row-arrow">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {!noticesData.isLoading && !noticesData.error ? (
            <p aria-live="polite" aria-atomic="true" className="notices-page__count">
              총 {filteredNotices.length}건의 공지사항
            </p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
