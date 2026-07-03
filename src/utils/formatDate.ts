export function formatKoreanDate(dateString: string): string {
  if (!dateString) {
    return ''
  }

  const date = new Date(`${dateString}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    weekday: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatShortDate(dateString: string): string {
  if (!dateString) {
    return ''
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

