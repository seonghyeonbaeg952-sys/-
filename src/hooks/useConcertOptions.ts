import { useMemo } from 'react'

import { useCrudList } from './useCrudList'
import type { CmsFilterOption, CmsOrderOption } from '../lib/cms'
import type { ConcertRow } from '../types/cms'

function formatConcertOptionLabel(concert: ConcertRow) {
  const dateLabel = concert.concert_date ? ` · ${concert.concert_date}` : ''

  return `${concert.title}${dateLabel}`
}

export function useConcertOptions() {
  const filters = useMemo<Array<CmsFilterOption<'concerts'>>>(() => [], [])
  const order = useMemo<CmsOrderOption<'concerts'>>(
    () => ({ column: 'concert_date', ascending: false }),
    [],
  )
  const concerts = useCrudList({
    filters,
    order,
    table: 'concerts',
  })

  const options = useMemo(() => {
    const emptyLabel = concerts.isLoading
      ? '공연 목록 불러오는 중'
      : concerts.rows.length === 0
        ? '등록된 공연이 없습니다'
        : '관련 공연 없음'

    return [
      { label: emptyLabel, value: '' },
      ...concerts.rows.map((concert) => ({
        label: formatConcertOptionLabel(concert),
        value: concert.id,
      })),
    ]
  }, [concerts.isLoading, concerts.rows])

  return {
    error: concerts.error,
    isLoading: concerts.isLoading,
    options,
  }
}
