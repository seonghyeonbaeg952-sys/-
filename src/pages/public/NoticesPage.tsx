import { FormattedCopy } from '../../components/site-editor/FormattedCopy'
import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
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
import { usePageCopy } from '../../components/site-editor/usePageCopy'
import { CopyLines } from '../../components/site-editor/SiteCopy'
import '../../styles/notices-page.css'

const categoryOptions = [
  { value: 'all', label: '전체 분류' },
  ...Object.entries(noticeCategoryLabels).map(([value, label]) => ({ value, label })),
]

export function NoticesPage() {
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('notices')
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
        description={copyText("notices", "notices.fixed.NoticesPage.0d93e0e1fe", "서울모테트청소년합창단의 입단, 공연, 보도자료와 공식 소식을 확인합니다.")}
        path="/notices"
        title={copyText("notices", "notices.fixed.NoticesPage.a8f562bb9b", "공지사항")}
      />
      <header className="notices-page__hero notices-page__shell">
        <div>
          <p className="notices-page__eyebrow">{<FormattedCopy page="notices" id="notices.fixed.NoticesPage.6441d0206e" text={copyText("notices", "notices.fixed.NoticesPage.6441d0206e", "NEWS & NOTICES")}>{copyText("notices", "notices.fixed.NoticesPage.6441d0206e", "NEWS & NOTICES")}</FormattedCopy>}</p>
          <h1 className="notices-page__title">{<FormattedCopy page="notices" id="notices.title" text={t('title')}>{t('title')}</FormattedCopy>}</h1>
          <p className="notices-page__description">
            <FormattedCopy page="notices" id="notices.description" text={t('description')} lineBreaks><CopyLines text={t('description')} /></FormattedCopy>
          </p>
        </div>
        <div aria-hidden="true" className="notices-page__signature">
          <i>{<FormattedCopy page="notices" id="notices.fixed.NoticesPage.10317061d0" text={copyText("notices", "notices.fixed.NoticesPage.10317061d0", "Notices.")}>{copyText("notices", "notices.fixed.NoticesPage.10317061d0", "Notices.")}</FormattedCopy>}</i>
          <span>{<FormattedCopy page="notices" id="notices.fixed.NoticesPage.f34c03131f" text={copyText("notices", "notices.fixed.NoticesPage.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}>{copyText("notices", "notices.fixed.NoticesPage.f34c03131f", "SEOUL MOTET YOUTH CHOIR")}</FormattedCopy>}</span>
        </div>
      </header>

      <section aria-label={copyText("notices", "notices.fixed.NoticesPage.4eb02c31f4", "공지 목록")} className="notices-page__content notices-page__shell">
        <div className="notices-page__controls">
          <div aria-label={copyText("notices", "notices.fixed.NoticesPage.f889c1a401", "공지 필터")} className="notices-page__tabs" role="group">
            <button
              aria-controls="notice-results"
              aria-pressed={!importantOnly}
              className="notices-page__filter"
              onClick={() => updateFilter('filter', 'all')}
              type="button"
            >
              {<FormattedCopy page="notices" id="notices.all" text={t('all')}>{t('all')}</FormattedCopy>}{!noticesData.isLoading && !noticesData.error ? ` ${total}` : ''}
            </button>
            <button
              aria-controls="notice-results"
              aria-pressed={importantOnly}
              className="notices-page__filter"
              onClick={() => updateFilter('filter', 'important')}
              type="button"
            >
              {<FormattedCopy page="notices" id="notices.important" text={t('important')}>{t('important')}</FormattedCopy>}
            </button>
          </div>
          <form aria-label={copyText("notices", "notices.fixed.NoticesPage.5e802054bd", "공지 검색")} className="notices-page__search" onSubmit={submitSearch} role="search">
            <label className="sr-only" htmlFor="notice-search">{t('searchPlaceholder')}</label>
            <input
              autoComplete="off"
              id="notice-search"
              onChange={(event) => setSearch({ urlQuery: query, value: event.target.value })}
              placeholder={t('searchPlaceholder')}
              type="search"
              value={searchValue}
            />
            <button type="submit">{<FormattedCopy page="notices" id="notices.search" text={t('search')}>{t('search')}</FormattedCopy>}</button>
          </form>
          <FilterSelect className="notices-page__category" label={t('category')} onChange={(value) => updateFilter('category', value)} options={categoryOptions} value={category} />
        </div>

        <div
          aria-busy={noticesData.isLoading}
          aria-label={copyText("notices", "notices.fixed.NoticesPage.e71eb2b6df", "공지 검색 결과")}
          className="notices-page__results"
          id="notice-results"
          ref={resultsRef}
          tabIndex={-1}
        >
          {noticesData.isLoading ? (
            <div className="notices-page__state"><LoadingState label={t('loading')} /></div>
          ) : noticesData.error ? (
            <div className="notices-page__state" role="alert">
              <ErrorState
                title={t('error')}
                description={t('connection')}
                action={<button className="notices-page__action" onClick={noticesData.refetch} type="button">{<FormattedCopy page="notices" id="notices.retry" text={t('retry')}>{t('retry')}</FormattedCopy>}</button>}
              />
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="notices-page__state" role="status">
              <h2>{hasFilters ? <FormattedCopy page="notices" id="notices.noResults" text={t('noResults')}>{t('noResults')}</FormattedCopy> : <FormattedCopy page="notices" id="notices.empty" text={t('empty')}>{t('empty')}</FormattedCopy>}</h2>
              <p>{hasFilters ? <FormattedCopy page="notices" id="notices.noResultsHelp" text={t('noResultsHelp')}>{t('noResultsHelp')}</FormattedCopy> : <FormattedCopy page="notices" id="notices.emptyHelp" text={t('emptyHelp')}>{t('emptyHelp')}</FormattedCopy>}</p>
              {hasFilters ? <button className="notices-page__action" onClick={resetFilters} type="button">{<FormattedCopy page="notices" id="notices.allAction" text={t('allAction')}>{t('allAction')}</FormattedCopy>}</button> : null}
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
            <p aria-live="polite" aria-atomic="true" className="notices-page__count">{<FormattedCopy page="notices" id="notices.fixed.NoticesPage.90252b07ab" text={copyText("notices", "notices.fixed.NoticesPage.90252b07ab", "총 ")}>{copyText("notices", "notices.fixed.NoticesPage.90252b07ab", "총 ")}</FormattedCopy>}{filteredNotices.length}{<FormattedCopy page="notices" id="notices.fixed.NoticesPage.ef7c0bca0a" text={copyText("notices", "notices.fixed.NoticesPage.ef7c0bca0a", "건의 공지사항")}>{copyText("notices", "notices.fixed.NoticesPage.ef7c0bca0a", "건의 공지사항")}</FormattedCopy>}</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
