import { getSupabaseClientSafe } from './auth'
import { getSampleSubmissionMessage } from './sampleSubmissionGuard'
import { isSiteEditorPreview, PREVIEW_SUBMISSION_MESSAGE } from './siteEditorPreview'
import {
  buildJoinApplicationPayload,
  getJoinApplicationFileMediaType,
  joinApplicationFileRules,
  validateJoinApplicationValues,
  type JoinApplicationAttachmentKind,
  type JoinApplicationValues,
} from '../components/join/joinApplicationModel'

export type JoinApplicationConfig = {
  form_version: 2 | 3
  server_now: string
  recruitment_starts_at: string | null
  recruitment_ends_at: string | null
}
type Result<T> = { data: T | null; error: string | null }
type Attachment = { blob: Blob; filename: string }
const isMissingRpc = (code: string | undefined) => code === 'PGRST202' || code === '42883'

export const joinApplicationAttachmentMarkers = {
  photo: 'join-intake-v3:photo',
  recommendation: 'join-intake-v3:recommendation',
} as const

export async function getJoinApplicationConfig(joinInfoId: string): Promise<Result<JoinApplicationConfig>> {
  const client = getSupabaseClientSafe()
  if (!client.data) return { data: null, error: '접수 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' }
  try {
    const args = { p_join_info_id: joinInfoId }
    let { data, error } = await client.data.rpc('get_join_application_config_v3', args, { get: true })
    if (isMissingRpc(error?.code)) {
      ({ data, error } = await client.data.rpc('get_join_application_config', args, { get: true }))
    }
    if (error) {
      return { data: null, error: isMissingRpc(error.code)
        ? '새 지원서의 서버 연결을 준비하고 있습니다. 잠시 후 다시 시도하거나 입단 문의를 이용해 주세요.'
        : '접수 정보를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.' }
    }
    const config = Array.isArray(data) ? data[0] : null
    if (!config || (config.form_version !== 2 && config.form_version !== 3) || typeof config.server_now !== 'string' || !Number.isFinite(Date.parse(config.server_now))) {
      return { data: null, error: '현재 공개된 접수 정보를 확인할 수 없습니다. 입단 문의를 이용해 주세요.' }
    }
    return { data: {
      form_version: config.form_version,
      server_now: config.server_now,
      recruitment_starts_at: typeof config.recruitment_starts_at === 'string' ? config.recruitment_starts_at : null,
      recruitment_ends_at: typeof config.recruitment_ends_at === 'string' ? config.recruitment_ends_at : null,
    }, error: null }
  } catch {
    return { data: null, error: '접수 정보를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.' }
  }
}

async function encodeAttachment(file: File | null, kind: JoinApplicationAttachmentKind) {
  if (!file) return null
  const media_type = getJoinApplicationFileMediaType(file, kind)
  if (!media_type) throw new Error('지원하지 않는 파일 형식입니다.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const chunks: string[] = []
  for (let offset = 0; offset < bytes.length; offset += 32768) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)))
  }
  return { media_type, base64: btoa(chunks.join('')) }
}

export async function submitJoinApplication(values: JoinApplicationValues, joinInfoId: string, submissionId: string, now = new Date()): Promise<Result<true>> {
  const sampleMessage = getSampleSubmissionMessage('application')
  if (sampleMessage) return { data: null, error: sampleMessage }
  if (isSiteEditorPreview()) return { data: null, error: PREVIEW_SUBMISSION_MESSAGE }
  if (values.website.trim()) return { data: null, error: '입력 내용을 확인한 뒤 다시 시도해 주세요.' }
  const errors = validateJoinApplicationValues(values, now)
  if (Object.keys(errors).length) return { data: null, error: Object.values(errors)[0] ?? '입력 내용을 확인해 주세요.' }
  const guideUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
  const submissionUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!guideUuid.test(joinInfoId) || !submissionUuid.test(submissionId)) return { data: null, error: '접수 요청을 확인할 수 없습니다. 페이지를 새로 연 뒤 다시 시도해 주세요.' }
  const client = getSupabaseClientSafe()
  if (!client.data) return { data: null, error: '접수 서버에 연결할 수 없습니다. 입력 내용은 유지됩니다.' }
  try {
    const [photo, recommendation] = await Promise.all([
      encodeAttachment(values.photo_file, 'photo'),
      encodeAttachment(values.recommendation_file, 'recommendation'),
    ])
    const { data, error } = await client.data.rpc('submit_join_application_v3', {
      ...buildJoinApplicationPayload(values, joinInfoId, submissionId),
      p_photo: photo,
      p_recommendation: recommendation,
    })
    if (error) {
      if (isMissingRpc(error.code)) {
        return { data: null, error: '새 지원서의 서버 연결을 준비하고 있습니다. 잠시 후 다시 시도하거나 입단 문의를 이용해 주세요.' }
      }
      const allowedMessages = [
        '현재 지원서를 접수할 수 없습니다. 최신 입단 안내를 확인해 주세요.',
        '같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.',
        '필수 항목과 입력 내용을 확인해 주세요.',
        '개인정보 수집 및 이용에 동의해 주세요.',
        '접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.',
        '사진은 3:4 비율의 2MB 이하 JPG 또는 PNG 파일을 선택해 주세요.',
        '추천서는 3MB 이하의 PDF 파일을 선택해 주세요.',
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

export async function getJoinApplicationAttachment(applicationId: string, kind: JoinApplicationAttachmentKind): Promise<Result<Attachment>> {
  const failure = { data: null, error: '첨부 파일을 불러오지 못했습니다. 관리자 로그인 상태를 확인하고 다시 시도해 주세요.' }
  try {
    const client = getSupabaseClientSafe().data
    if (!client) return failure
    const { data, error } = await client.rpc('get_join_application_attachment_v3', {
      p_application_id: applicationId,
      p_kind: kind,
    })
    const files: Record<string, string> = kind === 'photo'
      ? { 'image/jpeg': '지원자-사진.jpg', 'image/png': '지원자-사진.png' }
      : { 'application/pdf': '추천서.pdf' }
    const mediaType = data?.media_type
    const encoded = data?.base64
    if (error || typeof mediaType !== 'string' || !Object.hasOwn(files, mediaType)
      || typeof encoded !== 'string' || encoded.length > Math.ceil(joinApplicationFileRules[kind].maxBytes / 3) * 4) return failure
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0))
    if (!bytes.length || bytes.length > joinApplicationFileRules[kind].maxBytes) return failure
    return { data: { blob: new Blob([bytes], { type: mediaType }), filename: files[mediaType] }, error: null }
  } catch {
    return failure
  }
}
