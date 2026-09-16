import { getSupabaseClientSafe } from './auth'
import type { CmsResult } from '../types/cms'

export type IntakeLimit = { kind: 'contact' | 'pledge' | 'join'; hourly_total: number; hourly_contact: number }
const columns = 'kind,hourly_total,hourly_contact'
const invalid = '전체 접수는 시간당 10–10,000건, 동일 연락처는 1–100건의 정수로 입력해 주세요. 동일 연락처 제한은 전체 제한보다 클 수 없습니다.'
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) }
function validNumbers(value: unknown): value is Omit<IntakeLimit, 'kind'> {
  return record(value) && typeof value.hourly_total === 'number' && Number.isInteger(value.hourly_total)
    && value.hourly_total >= 10 && value.hourly_total <= 10000
    && typeof value.hourly_contact === 'number' && Number.isInteger(value.hourly_contact)
    && value.hourly_contact >= 1 && value.hourly_contact <= 100 && value.hourly_contact <= value.hourly_total
}
function validRow(value: unknown): value is IntakeLimit {
  return validNumbers(value) && 'kind' in value && ['contact', 'pledge', 'join'].includes(String(value.kind))
}
function failure(error: unknown) {
  return record(error) && error.code === '42501'
    ? '접수 보호 설정을 수정할 관리자 권한이 없습니다. 다시 로그인해 확인해 주세요.'
    : '접수 보호 설정을 확인하지 못했습니다. 연결과 데이터베이스 설치 상태를 확인해 주세요.'
}
export async function loadIntakeLimits(): Promise<CmsResult<IntakeLimit[]>> {
  const client = getSupabaseClientSafe()
  if (!client.data) return { data: null, error: client.error }
  try {
    const { data, error } = await client.data.from('intake_limits').select(columns).order('kind')
    if (error || !Array.isArray(data) || data.length !== 3 || !data.every(validRow) || new Set(data.map(row => row.kind)).size !== 3) return { data: null, error: failure(error) }
    return { data, error: null }
  } catch { return { data: null, error: failure(null) } }
}
export async function saveIntakeLimit(expected: IntakeLimit, values: unknown): Promise<CmsResult<IntakeLimit>> {
  if (!validRow(expected) || !validNumbers(values) || Object.keys(values).some(key => !['hourly_total', 'hourly_contact'].includes(key))) return { data: null, error: invalid }
  const client = getSupabaseClientSafe()
  if (!client.data) return { data: null, error: client.error }
  try {
    const { data, error } = await client.data.from('intake_limits')
      .update({ hourly_total: values.hourly_total, hourly_contact: values.hourly_contact })
      .eq('kind', expected.kind).eq('hourly_total', expected.hourly_total).eq('hourly_contact', expected.hourly_contact)
      .select(columns).maybeSingle()
    if (error) return { data: null, error: failure(error) }
    if (!validRow(data) || data.kind !== expected.kind || data.hourly_total !== values.hourly_total || data.hourly_contact !== values.hourly_contact) return { data: null, error: '다른 관리자 변경 또는 권한 문제로 저장을 확인하지 못했습니다. 입력을 기록한 뒤 화면을 새로고침해 최신값과 비교해 주세요.' }
    return { data, error: null }
  } catch { return { data: null, error: failure(null) } }
}
