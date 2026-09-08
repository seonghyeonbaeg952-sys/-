export type JoinRecruitmentPeriod = {
  recruitment_starts_at?: string | null
  recruitment_ends_at?: string | null
}

export type JoinRecruitment = {
  status: 'unconfigured' | 'before' | 'open' | 'closed' | 'invalid'
  label: string
  periodLabel: string
  canApply: boolean
  nextChangeAt: number | null
}

const seoulFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

// A timezone is required: a CMS timestamp must not depend on the viewer's device.
function parseTimestamp(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}(?::?\d{2})?)$/.exec(value.trim())
  if (!match) return Number.NaN
  const dateTime = `${match[1]}T${match[2]}:${match[3] ?? '00'}`
  const calendarTime = Date.parse(`${dateTime}Z`)
  if (!Number.isFinite(calendarTime) || new Date(calendarTime).toISOString().slice(0, 19) !== dateTime) {
    return Number.NaN
  }
  const offset = match[5].length === 3 ? `${match[5]}:00` : match[5]
  return Date.parse(`${dateTime}${match[4] ? `.${match[4]}` : ''}${offset}`)
}

export function toSeoulDateTimeLocal(value: string | null | undefined): string {
  const timestamp = parseTimestamp(value)
  if (timestamp === null || !Number.isFinite(timestamp)) return ''
  const parts = Object.fromEntries(seoulFormatter.formatToParts(timestamp).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function fromSeoulDateTimeLocal(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  if (!normalized || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) return null
  const timestamp = parseTimestamp(`${normalized}:00+09:00`)
  return timestamp !== null && Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : null
}

export function prepareJoinRecruitmentPeriod(
  values: JoinRecruitmentPeriod,
  previous?: JoinRecruitmentPeriod | null,
): JoinRecruitmentPeriod {
  const result: JoinRecruitmentPeriod = {}
  for (const key of ['recruitment_starts_at', 'recruitment_ends_at'] as const) {
    const value = values[key]?.trim() ?? ''
    // Do not send nonexistent columns when editing old, unconfigured content.
    if (previous && !(key in previous) && !value) continue
    const previousValue = previous?.[key]
    if (value && previousValue && value === toSeoulDateTimeLocal(previousValue)) {
      result[key] = previousValue
    } else {
      // Preserve malformed nonempty input so validation cannot turn it into an open boundary.
      result[key] = fromSeoulDateTimeLocal(value) ?? (value || null)
    }
  }
  return result
}

export function validateJoinRecruitmentPeriod(info: JoinRecruitmentPeriod): string | null {
  const start = parseTimestamp(info.recruitment_starts_at)
  const end = parseTimestamp(info.recruitment_ends_at)
  if (start !== null && !Number.isFinite(start)) return '모집 시작 일시를 올바르게 입력해 주세요.'
  if (end !== null && !Number.isFinite(end)) return '모집 종료 일시를 올바르게 입력해 주세요.'
  if (start !== null && end !== null && start >= end) return '모집 종료 일시는 시작 일시보다 늦어야 합니다.'
  return null
}

function formatPeriod(info: JoinRecruitmentPeriod): string {
  const format = (value: string | null | undefined) => toSeoulDateTimeLocal(value).replaceAll('-', '.').replace('T', ' ')
  const start = format(info.recruitment_starts_at)
  const end = format(info.recruitment_ends_at)
  if (start && end) return `${start} ~ ${end} (한국 시간)`
  if (start) return `${start}부터 (한국 시간)`
  if (end) return `${end}까지 (한국 시간)`
  return ''
}

export function getJoinRecruitment(
  info: JoinRecruitmentPeriod,
  now: Date | number = new Date(),
): JoinRecruitment {
  const start = parseTimestamp(info.recruitment_starts_at)
  const end = parseTimestamp(info.recruitment_ends_at)
  if (start === null && end === null) {
    return { status: 'unconfigured', label: '', periodLabel: '', canApply: true, nextChangeAt: null }
  }
  const timestamp = now instanceof Date ? now.getTime() : now
  if (validateJoinRecruitmentPeriod(info) || !Number.isFinite(timestamp)) {
    return { status: 'invalid', label: '모집 일정 확인 중', periodLabel: '', canApply: false, nextChangeAt: null }
  }
  const periodLabel = formatPeriod(info)
  if (start !== null && timestamp < start) {
    return { status: 'before', label: '모집 예정', periodLabel, canApply: false, nextChangeAt: start }
  }
  if (end !== null && timestamp >= end) {
    return { status: 'closed', label: '모집 마감', periodLabel, canApply: false, nextChangeAt: null }
  }
  return { status: 'open', label: '모집 중', periodLabel, canApply: true, nextChangeAt: end }
}
