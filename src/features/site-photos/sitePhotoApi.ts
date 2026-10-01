import { getSupabaseClientSafe } from '../../lib/auth'
import { SITE_PHOTO_ASSETS } from './sitePhotoCatalog'
import { validateSitePhoto, type SitePhotoMap, type SitePhotoRecord, type SitePhotoValue } from './sitePhotoModel'

type Result<T> = { data: T | null; error: string | null }
const keys = new Set(SITE_PHOTO_ASSETS.map(asset => asset.key))
const invalidResponse = '사진 저장 결과를 확인하지 못했습니다. 현재 입력을 유지한 채 다시 시도해 주세요.'
const connectionError = '사진 관리 서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.'
const validVersion = (version: number) => Number.isSafeInteger(version) && version >= 0 && version < Number.MAX_SAFE_INTEGER
const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const clone = <T,>(value: T): T => structuredClone(value)
function readableError(error: unknown): string {
  const code = record(error) ? error.code : null
  if (code === '40001' || code === '23505') return '다른 관리자가 먼저 변경했습니다. 입력 내용은 유지됩니다. 최신 사진을 불러온 뒤 다시 확인해 주세요.'
  if (['PGRST202', 'PGRST205', '42P01', '42883'].includes(String(code))) return '사진 관리 기능의 서버 설치가 필요합니다. 관리자에게 문의해 주세요.'
  if (['42501', 'PGRST301', 'PGRST302'].includes(String(code))) return '관리자 권한을 확인하지 못했습니다. 다시 로그인해 주세요.'
  if (code === '22023') return '사진 주소와 설명·중심 위치를 확인해 주세요. 서버가 저장하지 않았습니다.'
  return connectionError
}
async function rpc(name: string, parameters: Record<string, unknown> = {}, publicRead = false): Promise<Result<unknown>> {
  try {
    const client = getSupabaseClientSafe().data
    if (!client) return { data: null, error: connectionError }
    const result = await client.rpc(name, parameters, ...(publicRead ? [{ get: true }] : []))
    return result.error ? { data: null, error: readableError(result.error) } : { data: result.data, error: null }
  } catch { return { data: null, error: connectionError } }
}
function normalizePhotoRecord(value: unknown): SitePhotoRecord | null {
  const row = Array.isArray(value) && value.length === 1 ? value[0] : value
  if (!record(row) || typeof row.asset_key !== 'string' || !keys.has(row.asset_key) || typeof row.version !== 'number' || !validVersion(row.version)
    || !Object.hasOwn(row, 'draft') || !Object.hasOwn(row, 'published') || validateSitePhoto(row.draft) || validateSitePhoto(row.published)
    || typeof row.updated_at !== 'string' || !Number.isFinite(Date.parse(row.updated_at))
    || !(row.published_at === null || typeof row.published_at === 'string' && Number.isFinite(Date.parse(row.published_at)))) return null
  return { asset_key: row.asset_key, draft: clone(row.draft as SitePhotoValue | null), published: clone(row.published as SitePhotoValue | null), version: row.version, updated_at: row.updated_at, published_at: row.published_at as string | null }
}
export async function loadAdminSitePhotos(): Promise<Result<SitePhotoRecord[]>> {
  const result = await rpc('get_admin_site_photos')
  if (result.error) return { data: null, error: result.error }
  if (!Array.isArray(result.data)) return { data: null, error: invalidResponse }
  const rows: SitePhotoRecord[] = []
  for (const value of result.data) {
    // Newer site releases may have additional slots; old clients safely ignore them.
    if (record(value) && typeof value.asset_key === 'string' && !keys.has(value.asset_key)) continue
    const row = normalizePhotoRecord(value)
    if (!row || rows.some(existing => existing.asset_key === row.asset_key)) return { data: null, error: invalidResponse }
    rows.push(row)
  }
  return { data: rows, error: null }
}
export async function saveSitePhotoDraft(key: string, photo: SitePhotoValue | null, version: number): Promise<Result<SitePhotoRecord>> {
  const error = validateSitePhoto(photo)
  if (!keys.has(key) || !validVersion(version) || error) return { data: null, error: error || '사진 항목과 편집 버전을 확인해 주세요.' }
  const result = await rpc('save_site_photo_draft', { p_asset_key: key, p_photo: clone(photo), p_expected_version: version })
  if (result.error) return { data: null, error: result.error }
  const row = normalizePhotoRecord(result.data)
  return row && row.asset_key === key && row.version === version + 1 ? { data: row, error: null } : { data: null, error: invalidResponse }
}
export async function publishSitePhoto(key: string, version: number): Promise<Result<SitePhotoRecord>> {
  if (!keys.has(key) || !validVersion(version)) return { data: null, error: '사진 항목과 편집 버전을 확인해 주세요.' }
  const result = await rpc('publish_site_photo', { p_asset_key: key, p_expected_version: version })
  if (result.error) return { data: null, error: result.error }
  const row = normalizePhotoRecord(result.data)
  if (!row || row.asset_key !== key || row.version !== version + 1 || !row.published_at) return { data: null, error: invalidResponse }
  invalidateSitePhotoCache()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('site-photos-published'))
    try { window.localStorage.setItem('smyc-photos-published', String(Date.now())) } catch { /* Focus refresh still works when storage is unavailable. */ }
  }
  return { data: row, error: null }
}
let publicCache: { data: SitePhotoMap; expires: number } | null = null
let publicRequest: Promise<Result<SitePhotoMap>> | null = null
let generation = 0
export function invalidateSitePhotoCache() { generation += 1; publicCache = null; publicRequest = null }
export async function loadPublicSitePhotos(): Promise<Result<SitePhotoMap>> {
  if (publicCache && publicCache.expires > Date.now()) return { data: clone(publicCache.data), error: null }
  if (!publicRequest) {
    const requestGeneration = generation
    publicRequest = (async () => {
      const result = await rpc('get_public_site_photos', {}, true)
      if (result.error) return { data: null, error: result.error }
      if (!Array.isArray(result.data)) return { data: null, error: invalidResponse }
      const photos: SitePhotoMap = {}
      for (const value of result.data) {
        if (!record(value) || typeof value.asset_key !== 'string') return { data: null, error: invalidResponse }
        if (!keys.has(value.asset_key)) continue
        if (!value.published || validateSitePhoto(value.published) || Object.hasOwn(photos, value.asset_key)) return { data: null, error: invalidResponse }
        photos[value.asset_key] = { published: clone(value.published as SitePhotoValue) }
      }
      if (requestGeneration === generation) publicCache = { data: photos, expires: Date.now() + 30000 }
      return { data: photos, error: null }
    })().finally(() => { if (requestGeneration === generation) publicRequest = null })
  }
  return clone(await publicRequest)
}
