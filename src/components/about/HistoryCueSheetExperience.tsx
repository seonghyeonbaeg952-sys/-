import { useMemo, useState } from 'react'

import { legacyHistorySeed } from '../../constants/legacyContent'
import type { HistoryRow } from '../../types/cms'
import { EmptyState } from '../common/EmptyState'
import { OptimizedImage } from '../common/OptimizedImage'
import {
  buildHistoryCueSheetModel,
  resolveActiveHistoryYear,
  toggleAllHistoryRecords,
  toggleHistoryRecord,
  type HistoryCueSource,
} from './historyCueSheetModel'
import '../../styles/history-cue-sheet.css'

const FALLBACK_HERO_IMAGE = '/images/about/smyc-11th-concert-2025.jpg'

type HistoryCueSheetExperienceProps = {
  compact?: boolean
  defaultOpenIds?: readonly string[]
  history: HistoryRow[]
  shouldUseLegacyFallback: boolean
}

export function HistoryCueSheetExperience({
  compact = false,
  defaultOpenIds = [],
  history,
  shouldUseLegacyFallback,
}: HistoryCueSheetExperienceProps) {
  const sourceRows = useMemo<readonly HistoryCueSource[]>(() => {
    if (history.length > 0) {
      return history
    }

    return shouldUseLegacyFallback ? legacyHistorySeed : []
  }, [history, shouldUseLegacyFallback])
  const model = useMemo(
    () => buildHistoryCueSheetModel(sourceRows),
    [sourceRows],
  )
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(defaultOpenIds),
  )
  const [selectedYear, setSelectedYear] = useState(() => {
    const initiallyOpenRecord = model.records.find((record) =>
      defaultOpenIds.includes(record.id),
    )

    return initiallyOpenRecord?.year ?? model.years[0] ?? ''
  })
  const [previewYear, setPreviewYear] = useState<string | null>(null)
  const recordIds = useMemo(
    () => model.records.map((record) => record.id),
    [model.records],
  )
  const allOpen =
    recordIds.length > 0 && recordIds.every((recordId) => openIds.has(recordId))
  const currentYear = resolveActiveHistoryYear(
    selectedYear,
    null,
    model.years,
  )
  const activeYear = resolveActiveHistoryYear(
    currentYear,
    previewYear,
    model.years,
  )
  const cmsHeroImage = model.heroImageUrl
  const heroImageUrl = cmsHeroImage ?? FALLBACK_HERO_IMAGE
  const heroImageAlt =
    model.heroImageAlt ??
    (heroImageUrl
      ? '서울모테트청소년합창단 2025 제11회 정기연주회 무대 사진'
      : '')
  const Heading = compact ? 'h2' : 'h1'

  if (model.records.length === 0) {
    return (
      <section className="history-cue history-cue--empty" id="history">
        <div className="history-cue__empty-inner">
          <EmptyState title="등록된 연혁이 없습니다" />
        </div>
      </section>
    )
  }

  return (
    <section
      className={`history-cue${compact ? ' history-cue--compact' : ''}`}
      id="history"
    >
      {compact ? (
        <header className="history-cue__compact-intro">
          <p className="history-cue__eyebrow">HISTORY / CUE SHEET</p>
          <Heading>함께한 무대의 기록</Heading>
          <p>연도를 고르고, 필요한 장면을 펼쳐보세요.</p>
        </header>
      ) : (
        <header className="history-cue__hero">
          <div
            className={`history-cue__hero-inner${heroImageUrl ? '' : ' is-text-only'}`}
          >
            <div className="history-cue__hero-copy">
              <p className="history-cue__eyebrow">HISTORY / CUE SHEET</p>
              <span aria-hidden="true" className="history-cue__accent-rule" />
              <Heading>
                한 줄의 기록이
                <br />
                한 장면으로 펼쳐집니다.
              </Heading>
              <p className="history-cue__hero-description">
                창단 이후의 무대와 배움, 그리고 함께한 목소리를
                공연 기록지처럼 차례로 펼쳐봅니다.
              </p>
              <p className="history-cue__range">
                <em>{model.rangeLabel}</em>
                <span aria-hidden="true">·</span>
                <strong>{model.countLabel}</strong>
              </p>
            </div>

            {heroImageUrl ? (
              <figure className="history-cue__hero-plate">
                <OptimizedImage
                  alt={heroImageAlt}
                  className="history-cue__hero-image"
                  fallbackSrcs={cmsHeroImage ? [FALLBACK_HERO_IMAGE] : undefined}
                  fallbackVariant="gallery"
                  objectFit="contain"
                  priority
                  sizes="(min-width: 1200px) 620px, (min-width: 768px) calc(100vw - 112px), calc(100vw - 56px)"
                  src={heroImageUrl}
                  transform={{
                    quality: 88,
                    resize: 'contain',
                    width: 1240,
                    widths: [390, 656, 920, 1240],
                  }}
                />
                <figcaption>
                  <span aria-hidden="true" />
                  <strong>
                    {cmsHeroImage
                      ? '첫 번째 공개 사진 기록'
                      : 'FOLIO 18 · 2025 11TH REGULAR CONCERT'}
                  </strong>
                </figcaption>
              </figure>
            ) : null}
          </div>
        </header>
      )}

      <div className="history-cue__records-section">
        <div className="history-cue__records-shell">
          <div className="history-cue__controls">
            <p>PERFORMANCE INDEX</p>
            <button
              aria-pressed={allOpen}
              onClick={() =>
                setOpenIds((current) =>
                  toggleAllHistoryRecords(current, recordIds),
                )
              }
              type="button"
            >
              <span>{allOpen ? '모두 접기' : '모두 펼치기'}</span>
              <span aria-hidden="true">{allOpen ? '−' : '+'}</span>
            </button>
          </div>

          <div className="history-cue__index-layout">
            <nav aria-label="연도별 연혁 바로가기" className="history-cue__year-index">
              <p>YEAR / INDEX</p>
              <div className="history-cue__year-links">
                {model.years.map((year) => (
                  <a
                    aria-current={year === currentYear ? 'location' : undefined}
                    className={year === activeYear ? 'is-active' : undefined}
                    href={`#history-cue-year-${encodeURIComponent(year)}`}
                    key={year}
                    onBlur={() => setPreviewYear(null)}
                    onClick={() => setSelectedYear(year)}
                    onFocus={() => setPreviewYear(year)}
                    onMouseEnter={() => setPreviewYear(year)}
                    onMouseLeave={() => setPreviewYear(null)}
                  >
                    {year}
                  </a>
                ))}
              </div>
            </nav>

            <ol aria-label="합창단 연혁" className="history-cue__record-list">
              {model.records.map((record, index) => {
                const isOpen = openIds.has(record.id)
                const panelId = `history-cue-panel-${index}`
                const triggerId = `history-cue-trigger-${index}`
                const previousYear = model.records[index - 1]?.year

                return (
                  <li
                    className="history-cue__record"
                    data-open={isOpen || undefined}
                    data-year-active={record.year === activeYear || undefined}
                    id={
                      previousYear !== record.year
                        ? `history-cue-year-${record.year}`
                        : undefined
                    }
                    key={record.id}
                  >
                    <div aria-hidden="true" className="history-cue__record-mark">
                      <span />
                      <strong>PERFORMANCE RECORD</strong>
                    </div>
                    <h3>
                      <button
                        aria-controls={panelId}
                        aria-expanded={isOpen}
                        id={triggerId}
                        onClick={() => {
                          setSelectedYear(record.year)
                          setOpenIds((current) =>
                            toggleHistoryRecord(current, record.id),
                          )
                        }}
                        type="button"
                      >
                        <span className="history-cue__folio">{record.folio}</span>
                        <span className="history-cue__date">
                          <strong>{record.year}</strong>
                          {record.month ? <small>{record.month}</small> : null}
                        </span>
                        <span className="history-cue__title">{record.title}</span>
                        <span aria-hidden="true" className="history-cue__toggle">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                    </h3>

                    {isOpen ? (
                      <div
                        aria-labelledby={triggerId}
                        className="history-cue__panel"
                        id={panelId}
                      >
                        <div className="history-cue__stage-note">
                          <p>STAGE NOTE</p>
                          <div>
                            {record.content || '상세 기록은 준비 중입니다.'}
                          </div>
                        </div>
                        {record.imageUrl ? (
                          <OptimizedImage
                            alt={record.imageAlt ?? '서울모테트청소년합창단 연혁 이미지'}
                            className="history-cue__record-image"
                            fallbackVariant="gallery"
                            objectFit="contain"
                            sizes="(min-width: 1200px) 390px, (min-width: 768px) calc(100vw - 196px), calc(100vw - 48px)"
                            src={record.imageUrl}
                            transform={{
                              quality: 86,
                              resize: 'contain',
                              width: 960,
                              widths: [342, 572, 780, 960],
                            }}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      {compact ? null : (
        <footer className="history-cue__closing">
          <div>
            <span aria-hidden="true" />
            <p>LIVING ARCHIVE / {model.countLabel}</p>
            <h2>기록은 끝나지 않고, 다음 목소리로 이어집니다.</h2>
          </div>
        </footer>
      )}
    </section>
  )
}
