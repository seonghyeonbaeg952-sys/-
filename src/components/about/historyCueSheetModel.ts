export type HistoryCueSource = {
  content?: string | null
  date?: string | null
  description?: string | null
  display_order?: number | null
  id: string
  image_url?: string | null
  is_visible?: boolean | null
  month?: string | null
  title?: string | null
  year: number | string
}

export type HistoryCueRecord = {
  content: string
  displayOrder: number
  folio: string
  id: string
  imageAlt: string | null
  imageUrl: string | null
  month: string | null
  title: string
  year: string
}

export type HistoryCueSheetModel = {
  countLabel: string
  heroImageAlt: string | null
  heroImageUrl: string | null
  rangeLabel: string
  records: HistoryCueRecord[]
  years: string[]
}

function cleanText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized || null
}

function deriveLegacyMonth(date: string | null | undefined) {
  const normalized = cleanText(date)
  const match = normalized?.match(/^\d{4}-(\d{2})-(\d{2})$/)

  return match ? `${match[1]}.${match[2]}` : null
}

function compareHistorySources(
  left: { index: number; row: HistoryCueSource },
  right: { index: number; row: HistoryCueSource },
) {
  const orderDifference =
    (left.row.display_order ?? 0) - (right.row.display_order ?? 0)

  if (orderDifference !== 0) {
    return orderDifference
  }

  const yearDifference = String(right.row.year).localeCompare(
    String(left.row.year),
    'ko',
  )

  return yearDifference || left.index - right.index
}

export function buildHistoryCueSheetModel(
  sourceRows: readonly HistoryCueSource[],
): HistoryCueSheetModel {
  const orderedRows = sourceRows
    .map((row, index) => ({ index, row }))
    .filter(({ row }) => row.is_visible !== false)
    .sort(compareHistorySources)

  const records = orderedRows.map(({ row }, index): HistoryCueRecord => {
    const year = String(row.year).trim()
    const month = cleanText(row.month) ?? deriveLegacyMonth(row.date)
    const imageUrl = cleanText(row.image_url)
    const title = cleanText(row.title) ?? `${year}년 활동 기록`
    const content = cleanText(row.content) ?? cleanText(row.description) ?? ''

    return {
      content,
      displayOrder: row.display_order ?? 0,
      folio: `F${String(index + 1).padStart(2, '0')}`,
      id: row.id,
      imageAlt: imageUrl
        ? [year, month, title, '연혁 이미지'].filter(Boolean).join(' ')
        : null,
      imageUrl,
      month,
      title,
      year,
    }
  })

  const years = Array.from(new Set(records.map((record) => record.year)))
  const rangeYears = [...years].sort((left, right) =>
    left.localeCompare(right, 'ko'),
  )
  const heroRecord = records.find((record) => record.imageUrl)

  return {
    countLabel: `${records.length} FOLIOS`,
    heroImageAlt: heroRecord?.imageAlt ?? null,
    heroImageUrl: heroRecord?.imageUrl ?? null,
    rangeLabel:
      rangeYears.length > 1
        ? `${rangeYears[0]}—${rangeYears.at(-1)}`
        : (rangeYears[0] ?? ''),
    records,
    years,
  }
}

export function toggleHistoryRecord(
  openIds: ReadonlySet<string>,
  recordId: string,
) {
  const nextOpenIds = new Set(openIds)

  if (nextOpenIds.has(recordId)) {
    nextOpenIds.delete(recordId)
  } else {
    nextOpenIds.add(recordId)
  }

  return nextOpenIds
}

export function toggleAllHistoryRecords(
  openIds: ReadonlySet<string>,
  recordIds: readonly string[],
) {
  const allOpen =
    recordIds.length > 0 && recordIds.every((recordId) => openIds.has(recordId))

  return allOpen ? new Set<string>() : new Set(recordIds)
}

export function resolveActiveHistoryYear(
  selectedYear: string | null,
  previewYear: string | null,
  years: readonly string[],
) {
  if (previewYear && years.includes(previewYear)) {
    return previewYear
  }

  if (selectedYear && years.includes(selectedYear)) {
    return selectedYear
  }

  return years[0] ?? ''
}
