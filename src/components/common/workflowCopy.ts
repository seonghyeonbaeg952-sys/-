export type WorkflowTranslate = (source: string, key?: string) => string

/** Translate the template before inserting record titles or user-supplied text. */
export function workflowCopy(translate: WorkflowTranslate, source: string, values: Record<string, string | number>) {
  return translate(source).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (token, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : token,
  )
}

/** Original routes keep their existing date format, including invalid-date fallbacks. */
export function workflowDate(value: string, original: string, english: boolean, weekday = false) {
  if (!english || !value) return original
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value)
  if (!Number.isFinite(date.getTime()) || dateOnly && date.toISOString().slice(0, 10) !== value) return original
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
    ...(weekday ? { weekday: 'short' } : {}),
  }).format(date)
}

export function workflowTime(source: string, english: boolean) {
  if (!english) return source
  const match = /^(오전|오후)\s*(\d{1,2})시(?:\s*(\d{1,2})분)?$/.exec(source.trim())
  if (!match) return source
  const hour = Number(match[2])
  const minutes = Number(match[3] ?? '0')
  if (hour < 1 || hour > 12 || minutes > 59) return source
  return `${hour}:${String(minutes).padStart(2, '0')} ${match[1] === '오전' ? 'AM' : 'PM'}`
}

/** Recruitment boundaries have already been validated and formatted in Korean time. */
export function workflowRecruitmentPeriod(source: string, translate: WorkflowTranslate) {
  const range = /^(.*) ~ (.*) \(한국 시간\)$/.exec(source)
  if (range) return workflowCopy(translate, '{start} ~ {end} (한국 시간)', { start: range[1], end: range[2] })
  const start = /^(.*)부터 \(한국 시간\)$/.exec(source)
  if (start) return workflowCopy(translate, '{date}부터 (한국 시간)', { date: start[1] })
  const end = /^(.*)까지 \(한국 시간\)$/.exec(source)
  return end ? workflowCopy(translate, '{date}까지 (한국 시간)', { date: end[1] }) : source
}

export function workflowTextLanguage(value: string, english: boolean) {
  return english && /[가-힣]/.test(value) ? 'ko' : undefined
}
