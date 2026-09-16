import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClientSafe } from './auth'
import { emptySiteEditorDocument, isEditorPageId, validateSiteEditorDocument } from './siteEditorModel'
import type { EditorPageId, SiteEditorDocument, SiteEditorPageRecord, SiteEditorRevision } from '../types/siteEditor'

export type EditorApiResult<T> = { data: T | null; error: string | null }
export type PublicEditorPage = { page_key: EditorPageId; document: SiteEditorDocument; published_at: string }

const pageColumns = 'page_key,draft,published,version,updated_at,published_at'
const revisionColumns = 'id,page_key,document,published_at'
const invalidResponse = '서버 응답을 확인하지 못했습니다. 입력 내용은 유지한 채 다시 시도해 주세요.'
const connectionError = '편집 서버에 연결하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
const publicCacheTtl = 30000
let publicCache: { expires: number; pages: PublicEditorPage[] } | null = null
let publicRequest: Promise<EditorApiResult<PublicEditorPage[]>> | null = null
let cacheGeneration = 0

function failure<T>(error: string): EditorApiResult<T> { return { data: null, error } }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function validVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}
function validDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value))
}
function validUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value)
}

function readableError(value: unknown): string {
  const code = isRecord(value) && typeof value.code === 'string' ? value.code : ''
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(code)) return '홈페이지 편집 기능의 서버 설치가 필요합니다. 설치 후 다시 시도해 주세요.'
  if (['42501', 'PGRST301', 'PGRST302'].includes(code)) return '관리자 권한을 확인하지 못했습니다. 다시 로그인한 뒤 시도해 주세요.'
  if (['40001', '23505'].includes(code)) return '다른 관리자가 먼저 변경했습니다. 현재 입력을 보관하고 최신 버전을 불러온 뒤 다시 확인해 주세요.'
  if (code === '22023') return '편집 내용과 입력 범위를 확인해 주세요. 서버가 변경을 저장하지 않았습니다.'
  return connectionError
}

type ServerResult = { data: unknown; error: unknown }
async function request(operation: (client: SupabaseClient) => PromiseLike<ServerResult>): Promise<EditorApiResult<unknown>> {
  try {
    const client = getSupabaseClientSafe()
    if (!client.data) return failure(connectionError)
    const response = await operation(client.data)
    if (!isRecord(response)) return failure(invalidResponse)
    if (response.error) return failure(readableError(response.error))
    return { data: response.data, error: null }
  } catch {
    return failure(connectionError)
  }
}

function normalizePage(value: unknown, expectedPage?: EditorPageId): SiteEditorPageRecord | null {
  const record = Array.isArray(value) && value.length === 1 ? value[0] : value
  if (!isRecord(record) || !isEditorPageId(record.page_key) || (expectedPage && record.page_key !== expectedPage)
    || !validVersion(record.version) || !validDate(record.updated_at) || validateSiteEditorDocument(record.draft)
    || !(record.published_at === null || validDate(record.published_at))
    || !(record.published === null || validateSiteEditorDocument(record.published) === null)
    || (record.published === null) !== (record.published_at === null)) return null
  return {
    page_key: record.page_key, draft: clone(record.draft as SiteEditorDocument),
    published: record.published === null ? null : clone(record.published as SiteEditorDocument),
    version: record.version, updated_at: record.updated_at,
    published_at: record.published_at as string | null,
  }
}

export async function loadEditorPage(page: EditorPageId): Promise<EditorApiResult<SiteEditorPageRecord>> {
  if (!isEditorPageId(page)) return failure('편집할 페이지를 확인해 주세요.')
  const response = await request(client => client.from('site_editor_pages').select(pageColumns).eq('page_key', page).maybeSingle())
  if (response.error) return failure(response.error)
  if (response.data === null || (Array.isArray(response.data) && response.data.length === 0)) {
    return { data: { page_key: page, draft: emptySiteEditorDocument(), published: null, version: 0, updated_at: '', published_at: null }, error: null }
  }
  const record = normalizePage(response.data, page)
  return record ? { data: record, error: null } : failure(invalidResponse)
}

async function mutatePage(
  name: string, parameters: Record<string, string | number | SiteEditorDocument>, version: number, page?: EditorPageId,
): Promise<EditorApiResult<SiteEditorPageRecord>> {
  const response = await request(client => client.rpc(name, parameters))
  if (response.error) return failure(response.error)
  const record = normalizePage(response.data, page)
  if (!record || record.version !== version + 1) return failure(invalidResponse)
  return { data: record, error: null }
}

export async function saveEditorDraft(page: EditorPageId, document: SiteEditorDocument, version: number): Promise<EditorApiResult<SiteEditorPageRecord>> {
  if (!isEditorPageId(page) || !validVersion(version) || version === Number.MAX_SAFE_INTEGER) return failure('페이지와 편집 버전을 확인해 주세요.')
  const validationError = validateSiteEditorDocument(document)
  if (validationError) return failure(validationError)
  return mutatePage('save_site_editor_draft', { p_page_key: page, p_document: clone(document), p_expected_version: version }, version, page)
}

export async function publishEditorPage(page: EditorPageId, version: number): Promise<EditorApiResult<SiteEditorPageRecord>> {
  if (!isEditorPageId(page) || !validVersion(version) || version === Number.MAX_SAFE_INTEGER) return failure('페이지와 편집 버전을 확인해 주세요.')
  const result = await mutatePage('publish_site_editor_page', { p_page_key: page, p_expected_version: version }, version, page)
  if (result.data && result.data.published === null) return failure(invalidResponse)
  if (result.data) invalidateEditorCache()
  return result
}

export async function loadEditorRevisions(page: EditorPageId): Promise<EditorApiResult<SiteEditorRevision[]>> {
  if (!isEditorPageId(page)) return failure('게시 이력을 확인할 페이지를 선택해 주세요.')
  const response = await request(client => client.from('site_editor_revisions').select(revisionColumns).eq('page_key', page).order('published_at', { ascending: false }))
  if (response.error) return failure(response.error)
  if (!Array.isArray(response.data)) return failure(invalidResponse)
  const revisions: SiteEditorRevision[] = []
  for (const record of response.data) {
    if (!isRecord(record) || !validUuid(record.id) || record.page_key !== page || !validDate(record.published_at)
      || validateSiteEditorDocument(record.document)) return failure(invalidResponse)
    revisions.push({ id: record.id, page_key: page, document: clone(record.document as SiteEditorDocument), published_at: record.published_at })
  }
  return { data: revisions, error: null }
}

export async function restoreEditorRevision(id: string, version: number): Promise<EditorApiResult<SiteEditorPageRecord>> {
  if (!validUuid(id) || !validVersion(version) || version === Number.MAX_SAFE_INTEGER) return failure('복원할 게시 이력과 편집 버전을 확인해 주세요.')
  return mutatePage('restore_site_editor_revision', { p_revision_id: id, p_expected_version: version }, version)
}

async function fetchPublicEditorPages(): Promise<EditorApiResult<PublicEditorPage[]>> {
  const response = await request(client => client.rpc('get_public_site_editor_pages', {}, { get: true }))
  if (response.error) return failure(response.error)
  if (!Array.isArray(response.data)) return failure(invalidResponse)
  const pages: PublicEditorPage[] = []
  const seen = new Set<EditorPageId>()
  for (const record of response.data) {
    if (!isRecord(record) || !isEditorPageId(record.page_key) || seen.has(record.page_key)
      || !validDate(record.published_at) || validateSiteEditorDocument(record.document)) return failure(invalidResponse)
    seen.add(record.page_key)
    pages.push({ page_key: record.page_key, document: clone(record.document as SiteEditorDocument), published_at: record.published_at })
  }
  return { data: pages, error: null }
}

export async function loadPublicEditorPages(): Promise<EditorApiResult<PublicEditorPage[]>> {
  if (publicCache && Date.now() < publicCache.expires) return { data: clone(publicCache.pages), error: null }
  if (!publicRequest) {
    const generation = cacheGeneration
    publicRequest = fetchPublicEditorPages().then(result => {
      if (generation === cacheGeneration && result.data) publicCache = { expires: Date.now() + publicCacheTtl, pages: result.data }
      return result
    }).finally(() => {
      if (generation === cacheGeneration) publicRequest = null
    })
  }
  return clone(await publicRequest)
}

export function invalidateEditorCache(): void {
  cacheGeneration += 1
  publicCache = null
  publicRequest = null
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('site-editor-published'))
}
