import { getSupabaseClientSafe } from '../../lib/auth'
import { buildContentPhotoPayload, PHOTO_FIELDS, type ContentPhotoTarget, type PhotoTable } from './sitePhotoModel'

type ContentRow = { id: string; [key: string]: unknown }
type SourceConfig = { table: PhotoTable; title: string; field: string; nameField: string; folder: string; manager: string; href: string; altField?: string }
export type ContentPhotoItem = {
  key: string; title: string; sourceTitle: string; src: string; alt: string; visible: boolean; folder: string; manager: string; href: string;
  target: ContentPhotoTarget & { id: string; previousAlt?: string | null }
}
export const CONTENT_PHOTO_SOURCES: readonly SourceConfig[] = [
  { table: 'hero_slides', title: '홈 슬라이드', field: 'image_url', altField: 'image_alt', nameField: 'title', folder: 'hero', manager: '/admin/hero-slides', href: '/' },
  { table: 'popup_notices', title: '홈 팝업', field: 'image_url', altField: 'image_alt', nameField: 'title', folder: 'popups', manager: '/admin/popups', href: '/' },
  { table: 'conductor', title: '지휘자 프로필', field: 'photo_url', altField: 'profile_image_alt', nameField: 'name', folder: 'conductor', manager: '/admin/conductor', href: '/about?section=conductor' },
  { table: 'conductor', title: '지휘자 활동사진', field: 'activity_images', nameField: 'name', folder: 'conductor', manager: '/admin/conductor', href: '/about?section=conductor' },
  { table: 'accompanist', title: '반주자 프로필', field: 'photo_url', nameField: 'name', folder: 'accompanist', manager: '/admin/accompanist', href: '/about?section=accompanist' },
  { table: 'concerts', title: '공연 포스터', field: 'poster_url', nameField: 'title', folder: 'concerts', manager: '/admin/concerts', href: '/concerts' },
  { table: 'notices', title: '공지 대표사진', field: 'cover_image_url', nameField: 'title', folder: 'notices', manager: '/admin/notices', href: '/notices' },
  { table: 'gallery', title: '갤러리 사진', field: 'image_url', nameField: 'title', folder: 'gallery', manager: '/admin/gallery', href: '/gallery?tab=photos' },
  { table: 'posters', title: '기록 포스터', field: 'image_url', nameField: 'title', folder: 'posters', manager: '/admin/posters', href: '/gallery?tab=posters' },
  { table: 'history', title: '연혁 사진', field: 'image_url', nameField: 'title', folder: 'history', manager: '/admin/history', href: '/about?section=history' },
  { table: 'locations', title: '오시는 길 사진', field: 'image_url', altField: 'image_alt', nameField: 'place_name', folder: 'locations', manager: '/admin/location', href: '/contact?section=location' },
  { table: 'sponsors', title: '후원사 로고', field: 'logo_url', nameField: 'name', folder: 'sponsors', manager: '/admin/sponsors', href: '/contact?section=sponsors' },
  { table: 'videos', title: '영상 썸네일', field: 'thumbnail_url', nameField: 'title', folder: 'gallery', manager: '/admin/videos', href: '/gallery?tab=videos' },
]
const string = (value: unknown) => typeof value === 'string' ? value : ''
export function contentPhotoItems(table: PhotoTable, rows: ContentRow[]): ContentPhotoItem[] {
  if (!Object.hasOwn(PHOTO_FIELDS, table)) throw new RangeError('공개 사진 항목이 아닙니다.')
  return CONTENT_PHOTO_SOURCES.filter(source => source.table === table).flatMap(source => rows.flatMap(row => {
    const previous = typeof row[source.field] === 'string' ? row[source.field] as string : null
    const name = string(row[source.nameField]).trim() || source.title
    const item = (src: string, alt: string, index?: number): ContentPhotoItem => ({
      key: `${table}:${row.id}:${source.field}${index === undefined ? '' : `:${index}`}`,
      title: `${name}${index === undefined ? '' : ` · 활동사진 ${index + 1}`}`, sourceTitle: source.title, src, alt,
      visible: row.is_visible !== false, folder: source.folder, manager: source.manager,
      href: table === 'concerts' || table === 'notices' ? `${source.href}/${row.id}` : source.href,
      target: { table, field: source.field, altField: source.altField, id: row.id, index, previous, previousAlt: source.altField ? typeof row[source.altField] === 'string' ? row[source.altField] as string : null : undefined },
    })
    if (source.field === 'activity_images') {
      const lines = (previous || '').split('\n')
      const entries = lines.flatMap((line, index) => {
        if (!line.trim()) return []
        const [src, alt] = line.split('|').map(value => value.trim())
        return [item(src, alt || name, index)]
      })
      return entries.length ? entries : [item('', name, 0)]
    }
    const automaticVideo = table === 'videos' && /^[a-zA-Z0-9_-]{11}$/.test(string(row.youtube_id)) ? `https://img.youtube.com/vi/${row.youtube_id}/hqdefault.jpg` : ''
    return [item(previous || automaticVideo, string(source.altField ? row[source.altField] : '') || name)]
  }))
}
export async function loadContentPhotos(): Promise<{ data: ContentPhotoItem[]; errors: string[] }> {
  const client = getSupabaseClientSafe().data
  if (!client) return { data: [], errors: ['사진 콘텐츠 서버에 연결하지 못했습니다.'] }
  const results = await Promise.all([...new Set(CONTENT_PHOTO_SOURCES.map(source => source.table))].map(async table => {
    const rows: ContentRow[] = []
    try {
      for (let offset = 0; ; offset += 100) {
        const result = await client.from(table).select('*').order('id').range(offset, offset + 99)
        if (result.error || !Array.isArray(result.data)) return { rows: contentPhotoItems(table, rows), error: `${CONTENT_PHOTO_SOURCES.find(source => source.table === table)!.title} 목록을 불러오지 못했습니다. 다시 불러오기를 눌러 주세요.` }
        rows.push(...result.data as ContentRow[])
        if (result.data.length < 100) break
      }
      return { rows: contentPhotoItems(table, rows), error: null }
    } catch { return { rows: contentPhotoItems(table, rows), error: `${table} 사진 연결이 끊겼습니다. 다시 시도해 주세요.` } }
  }))
  return { data: results.flatMap(result => result.rows), errors: results.flatMap(result => result.error ? [result.error] : []) }
}
export async function saveContentPhoto(item: ContentPhotoItem, src: string, alt: string): Promise<{ error: string | null }> {
  try {
    const payload = buildContentPhotoPayload(item.target, src, alt)
    const client = getSupabaseClientSafe().data
    if (!client) return { error: '사진 저장 서버에 연결하지 못했습니다.' }
    let query = client.from(item.target.table).update(payload).eq('id', item.target.id)
    query = item.target.previous === null ? query.is(item.target.field, null) : query.eq(item.target.field, item.target.previous)
    if (item.target.altField) query = item.target.previousAlt === null ? query.is(item.target.altField, null) : query.eq(item.target.altField, item.target.previousAlt)
    const result = await query.select('id').maybeSingle()
    if (result.error) return { error: '사진을 저장하지 못했습니다. 관리자 권한과 인터넷 연결을 확인한 뒤 다시 시도해 주세요.' }
    if (result.data?.id !== item.target.id) return { error: '다른 관리자가 사진을 먼저 변경했거나 항목이 삭제됐습니다. 입력을 보관하고 최신 사진을 불러와 주세요.' }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('site-photos-published'))
      try { window.localStorage.setItem('smyc-photos-published', String(Date.now())) } catch { /* Reload/focus is the fallback. */ }
    }
    return { error: null }
  } catch { return { error: '교체할 사진 주소와 설명을 확인해 주세요. 입력은 유지됩니다.' } }
}
export function mergeEnglishPhoto(draft: Record<string, string>, field: string, src: string | null) {
  const next = { ...draft }
  if (src) next[field] = src
  else delete next[field]
  return next
}
export async function publishEnglishPhoto(table: PhotoTable, id: string, field: string, version: number): Promise<{ error: string | null }> {
  const client = getSupabaseClientSafe().data
  if (!client) return { error: '영어 사진 저장 서버에 연결하지 못했습니다.' }
  try {
    const result = await client.rpc('publish_sample_english_photo', { p_resource: table, p_record_id: id, p_field: field, p_expected_version: version })
    if (result.error) return { error: result.error.code === '40001' ? '다른 관리자가 영어 항목을 먼저 변경했습니다. 최신 버전을 불러와 주세요.' : '영어 사진을 게시하지 못했습니다. 관리자 권한과 연결 상태를 확인해 주세요.' }
    if (!result.data || result.data.version !== version + 1) return { error: '영어 사진의 게시 결과를 확인하지 못했습니다. 다시 불러와 주세요.' }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sample-english-content-published'))
      try { window.localStorage.setItem('smyc-photos-published', String(Date.now())) } catch { /* Focus refresh still works. */ }
    }
    return { error: null }
  } catch { return { error: '영어 사진을 게시하지 못했습니다. 입력은 유지됩니다.' } }
}
