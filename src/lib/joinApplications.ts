import { getSupabaseClientSafe } from './auth'
import { buildJoinApplicationPayload, validateJoinApplicationValues, type JoinApplicationValues } from '../components/join/joinApplicationModel'

export type JoinApplicationConfig = {
  form_version: 2
  server_now: string
  recruitment_starts_at: string | null
  recruitment_ends_at: string | null
}
type Result<T> = { data: T | null; error: string | null }

export async function getJoinApplicationConfig(joinInfoId: string): Promise<Result<JoinApplicationConfig>> {
  const client = getSupabaseClientSafe()
  if (!client.data) return { data: null, error: '접수 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' }
  try {
    const { data, error } = await client.data.rpc('get_join_application_config', { p_join_info_id: joinInfoId }, { get: true })
    if (error) {
      return { data: null, error: error.code === 'PGRST202'
        ? '새 지원서의 서버 연결을 준비하고 있습니다. 잠시 후 다시 시도하거나 입단 문의를 이용해 주세요.'
        : '접수 정보를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.' }
    }
    const config = Array.isArray(data) ? data[0] : null
    if (!config || config.form_version !== 2 || typeof config.server_now !== 'string' || !Number.isFinite(Date.parse(config.server_now))) {
      return { data: null, error: '현재 공개된 접수 정보를 확인할 수 없습니다. 입단 문의를 이용해 주세요.' }
    }
    return { data: {
      form_version: 2,
      server_now: config.server_now,
      recruitment_starts_at: typeof config.recruitment_starts_at === 'string' ? config.recruitment_starts_at : null,
      recruitment_ends_at: typeof config.recruitment_ends_at === 'string' ? config.recruitment_ends_at : null,
    }, error: null }
  } catch {
    return { data: null, error: '접수 정보를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.' }
  }
}

export async function submitJoinApplication(values: JoinApplicationValues, joinInfoId: string, submissionId: string, now = new Date()): Promise<Result<true>> {
  if (values.website.trim()) return { data: null, error: '입력 내용을 확인한 뒤 다시 시도해 주세요.' }
  const errors = validateJoinApplicationValues(values, now)
  if (Object.keys(errors).length) return { data: null, error: Object.values(errors)[0] ?? '입력 내용을 확인해 주세요.' }
  const guideUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
  const submissionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!guideUuid.test(joinInfoId) || !submissionUuid.test(submissionId)) return { data: null, error: '접수 요청을 확인할 수 없습니다. 페이지를 새로 연 뒤 다시 시도해 주세요.' }
  const client = getSupabaseClientSafe()
  if (!client.data) return { data: null, error: '접수 서버에 연결할 수 없습니다. 입력 내용은 유지됩니다.' }
  try {
    const { data, error } = await client.data.rpc('submit_join_application_v2', buildJoinApplicationPayload(values, joinInfoId, submissionId))
    if (error) {
      const allowedMessages = [
        '현재 지원서를 접수할 수 없습니다. 최신 입단 안내를 확인해 주세요.',
        '같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.',
        '필수 항목과 입력 내용을 확인해 주세요.',
        '개인정보 수집 및 이용에 동의해 주세요.',
      ]
      return { data: null, error: allowedMessages.includes(error.message) ? error.message : '접수 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.' }
    }
    return data === true
      ? { data: true, error: null }
      : { data: null, error: '접수가 확인되지 않았습니다. 다시 시도해 주세요.' }
  } catch {
    return { data: null, error: '접수 결과를 확인하지 못했습니다. 인터넷 연결을 확인한 뒤 같은 내용으로 다시 시도해 주세요.' }
  }
}
