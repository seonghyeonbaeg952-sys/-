import { getSupabaseClientSafe } from '../../lib/auth'
import { isSampleContentResource, validateEnglishContent, type EnglishContentFields, type EnglishContentRecord, type PublishedEnglishContent, type SampleContentResource } from './sampleContentModel'

export type ContentResult<T> = { data: T | null; error: string | null }
const columns = 'resource,record_id,draft,published,version,updated_at,published_at'
const validId = (id: unknown): id is string => typeof id === 'string' && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)
const validVersion = (version: unknown): version is number => Number.isSafeInteger(version) && Number(version) >= 0 && Number(version) < Number.MAX_SAFE_INTEGER
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
const fail = <T,>(error: string): ContentResult<T> => ({ data: null, error })

function message(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : ''
  if (['40001', '23505'].includes(String(code))) return '다른 관리자가 먼저 변경했습니다. 입력 내용을 보관한 뒤 최신 버전을 다시 불러오세요.'
  if (String(code) === '42501') return '관리자 권한을 확인하지 못했습니다. 다시 로그인해 주세요.'
  if (String(code) === '22023') return '콘텐츠와 입력 범위를 확인해 주세요. 서버가 변경을 저장하지 않았습니다.'
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(String(code))) return '영문 콘텐츠 저장 기능의 서버 설치가 필요합니다. 현재 입력은 유지됩니다.'
  return '영문 콘텐츠를 불러오거나 저장하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
}

function normalise(value: unknown, resource: SampleContentResource, id: string): EnglishContentRecord | null {
  const row = Array.isArray(value) && value.length === 1 ? value[0] : value
  if (!row || typeof row !== 'object') return null
  const r = row as Record<string, unknown>
  if (r.resource !== resource || r.record_id !== id || !validVersion(r.version) || r.version === 0 || !date(r.updated_at)
    || validateEnglishContent(resource, r.draft) || (r.published !== null && validateEnglishContent(resource, r.published))
    || (r.published === null) !== (r.published_at === null) || (r.published_at !== null && !date(r.published_at))) return null
  return { resource, record_id: id, draft: r.draft as EnglishContentFields, published: r.published as EnglishContentFields | null, version: r.version,
    updated_at: r.updated_at, published_at: r.published_at as string | null }
}

export async function loadEnglishContent(resource: SampleContentResource, id: string): Promise<ContentResult<EnglishContentRecord>> {
  if (!isSampleContentResource(resource) || !validId(id)) return fail('영문으로 작성할 항목을 확인해 주세요.')
  try {
    const client = getSupabaseClientSafe()
    if (!client.data) return fail(message(null))
    const result = await client.data.from('sample_english_content').select(columns).eq('resource', resource).eq('record_id', id).maybeSingle()
    if (result.error) return fail(message(result.error))
    if (result.data === null) return { data: { resource, record_id: id, draft: {}, published: null, version: 0, updated_at: '', published_at: null }, error: null }
    const data = normalise(result.data, resource, id)
    return data ? { data, error: null } : fail('서버 응답을 확인하지 못했습니다. 다시 불러오세요.')
  } catch { return fail(message(null)) }
}

async function mutate(name: 'save_sample_english_content_draft' | 'publish_sample_english_content', resource: SampleContentResource, id: string, version: number, fields?: EnglishContentFields): Promise<ContentResult<EnglishContentRecord>> {
  if (!isSampleContentResource(resource) || !validId(id) || !validVersion(version)) return fail('항목과 저장 버전을 확인해 주세요.')
  if (fields) { const error = validateEnglishContent(resource, fields); if (error) return fail(error) }
  try {
    const client = getSupabaseClientSafe()
    if (!client.data) return fail(message(null))
    const result = await client.data.rpc(name, { p_resource: resource, p_record_id: id, p_expected_version: version, ...(fields ? { p_fields: fields } : {}) })
    if (result.error) return fail(message(result.error))
    const data = normalise(result.data, resource, id)
    if (!data || data.version !== version + 1) return fail('저장 결과를 확인하지 못했습니다. 입력 내용을 보관한 뒤 최신 버전을 확인해 주세요.')
    if (name === 'publish_sample_english_content' && !data.published) return fail('게시 결과를 확인하지 못했습니다. 최신 버전을 다시 불러오세요.')
    if (name === 'publish_sample_english_content' && typeof window !== 'undefined') window.dispatchEvent(new Event('sample-english-content-published'))
    return { data, error: null }
  } catch { return fail(message(null)) }
}

export const saveEnglishContentDraft = (resource: SampleContentResource, id: string, draft: EnglishContentFields, version: number) => mutate('save_sample_english_content_draft', resource, id, version, draft)
export const publishEnglishContent = (resource: SampleContentResource, id: string, version: number) => mutate('publish_sample_english_content', resource, id, version)

/** One small metadata query per CMS page, never 25 full-draft requests. */
export async function loadEnglishContentStates(resource: SampleContentResource, ids: string[]): Promise<ContentResult<Record<string, 'draft' | 'published'>>> {
  if (!isSampleContentResource(resource) || ids.length > 25 || ids.some(id => !validId(id))) return fail('목록 항목을 확인해 주세요.')
  if (!ids.length) return { data: {}, error: null }
  try {
    const client = getSupabaseClientSafe()
    if (!client.data) return fail(message(null))
    const result = await client.data.from('sample_english_content').select('record_id,published_at').eq('resource', resource).in('record_id', ids)
    if (result.error || !Array.isArray(result.data)) return fail(message(result.error))
    return { data: Object.fromEntries(result.data.map(row => [row.record_id, row.published_at ? 'published' : 'draft'])), error: null }
  } catch { return fail(message(null)) }
}

export async function loadPublishedEnglishContent(): Promise<ContentResult<PublishedEnglishContent[]>> {
  try {
    const client = getSupabaseClientSafe()
    if (!client.data) return fail(message(null))
    const result = await client.data.rpc('get_public_sample_english_content', {}, { get: true })
    if (result.error) return fail(message(result.error))
    if (!Array.isArray(result.data)) return fail(message(null))
    const data: PublishedEnglishContent[] = []
    for (const r of result.data as Record<string, unknown>[]) {
      if (!isSampleContentResource(r.resource) || !validId(r.record_id) || validateEnglishContent(r.resource, r.published) || !date(r.published_at)) return fail(message(null))
      data.push({ resource: r.resource, record_id: r.record_id, published: r.published as EnglishContentFields, published_at: r.published_at })
    }
    return { data, error: null }
  } catch { return fail(message(null)) }
}
