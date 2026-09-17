import type { CmsMutationPayload, CmsValue } from '../types/cms'

function isCalendarDate(value: CmsValue | undefined): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
}

export function validatePopupNoticeFields(values: CmsMutationPayload) {
  const errors: Partial<Record<'starts_on' | 'ends_on', string>> = {}
  for (const [name, label] of [['starts_on', '노출 시작일'], ['ends_on', '노출 종료일']] as const) {
    const value = values[name]
    if (value == null || (typeof value === 'string' && !value.trim())) continue
    if (!isCalendarDate(value)) errors[name] = `${label}을 올바른 날짜로 입력해 주세요.`
  }

  // PostgreSQL DATE boundaries are inclusive and have no timezone conversion.
  if (isCalendarDate(values.starts_on) && isCalendarDate(values.ends_on) && values.starts_on > values.ends_on) {
    errors.ends_on = '노출 종료일은 시작일과 같거나 이후여야 합니다.'
  }
  return errors
}
