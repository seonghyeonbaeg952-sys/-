export const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const
export type DateParts = { year: string; month: string; day: string }

export function daysInMonth(year: string, month: string) {
  const y = Number(year), m = Number(month)
  if (!Number.isInteger(m) || m < 1 || m > 12) return 31
  if (m === 2) return !/^\d{4}$/.test(year) || (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28
  return [4, 6, 9, 11].includes(m) ? 30 : 31
}

export function splitISODate(value: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) } : { year: '', month: '', day: '' }
}

export function joinISODate(parts: DateParts) {
  const y = Number(parts.year), m = Number(parts.month), d = Number(parts.day)
  if (!/^\d{4}$/.test(parts.year) || y < 1 || y > 9999 || !Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(d) || d < 1 || d > daysInMonth(parts.year, parts.month)) return ''
  return `${parts.year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function changeDatePart(parts: DateParts, key: keyof DateParts, value: string): DateParts {
  const next = { ...parts, [key]: value }
  if (Number(next.day) > daysInMonth(next.year, next.month)) next.day = ''
  return next
}
