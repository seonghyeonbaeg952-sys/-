import type { Concert, ConcertStatus } from '../../types/content'

export type ConcertScheduleItem = Pick<
  Concert,
  | 'category'
  | 'date'
  | 'id'
  | 'is_visible'
  | 'location'
  | 'status'
  | 'time'
  | 'title'
> &
  Partial<Omit<Concert, 'category' | 'date' | 'id' | 'is_visible' | 'location' | 'status' | 'time' | 'title'>>

export type ConcertPeriod = 'past' | 'upcoming'

export type ConcertSchedule<T extends ConcertScheduleItem> = {
  featured: T | null
  past: T[]
  upcoming: T[]
}

export type ConcertFilters = {
  category: string
  query: string
  year: string
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function normalizeDate(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return ISO_DATE_PATTERN.test(normalized) ? normalized : null
}

function compareDates(
  left: { date: string | null; index: number },
  right: { date: string | null; index: number },
  direction: 'ascending' | 'descending',
) {
  if (left.date && right.date) {
    const dateDifference = left.date.localeCompare(right.date)

    if (dateDifference !== 0) {
      return direction === 'ascending' ? dateDifference : -dateDifference
    }
  } else if (left.date) {
    return -1
  } else if (right.date) {
    return 1
  }

  return left.index - right.index
}

export function getSeoulDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).format(date)
}

export function getConcertPeriod(
  concert: Pick<ConcertScheduleItem, 'date' | 'status'>,
  today: string,
): ConcertPeriod {
  if (concert.status === 'cancelled' || concert.status === 'closed') {
    return 'past'
  }

  const concertDate = normalizeDate(concert.date)

  return concertDate && concertDate < today ? 'past' : 'upcoming'
}

export function buildConcertSchedule<T extends ConcertScheduleItem>(
  sourceRows: readonly T[],
  today: string,
): ConcertSchedule<T> {
  const visibleRows = sourceRows
    .map((concert, index) => ({
      concert,
      date: normalizeDate(concert.date),
      index,
    }))
    .filter(({ concert }) => concert.is_visible !== false)

  const upcoming = visibleRows
    .filter(({ concert }) => getConcertPeriod(concert, today) === 'upcoming')
    .sort((left, right) => compareDates(left, right, 'ascending'))
    .map(({ concert }) => concert)

  const past = visibleRows
    .filter(({ concert }) => getConcertPeriod(concert, today) === 'past')
    .sort((left, right) => compareDates(left, right, 'descending'))
    .map(({ concert }) => concert)

  return {
    featured: upcoming[0] ?? past[0] ?? null,
    past,
    upcoming,
  }
}

export function filterConcerts<T extends ConcertScheduleItem>(
  sourceRows: readonly T[],
  filters: ConcertFilters,
) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('ko-KR')

  return sourceRows.filter((concert) => {
    if (concert.is_visible === false) {
      return false
    }

    const matchesCategory =
      filters.category === 'all' || concert.category === filters.category
    const matchesYear =
      filters.year === 'all' || normalizeDate(concert.date)?.startsWith(filters.year)
    const searchableCopy = `${concert.title} ${concert.location}`.toLocaleLowerCase(
      'ko-KR',
    )

    return (
      matchesCategory &&
      matchesYear &&
      (!normalizedQuery || searchableCopy.includes(normalizedQuery))
    )
  })
}

export function getConcertMetaLine(
  concert: Pick<ConcertScheduleItem, 'location' | 'time'>,
) {
  const time = concert.time.trim() || '시간 미정'
  const location = concert.location.trim() || '장소 추후 안내'

  return `${time} · ${location}`
}

export function getConcertStatusLabel(
  status: ConcertStatus,
  period: ConcertPeriod,
) {
  if (status === 'cancelled') {
    return '취소'
  }

  if (period === 'past') {
    return '지난 공연'
  }

  return status === 'open' ? '예매 가능' : '예정'
}

export function getSafeHttpUrl(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    return null
  }

  try {
    const url = new URL(normalized)

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}
