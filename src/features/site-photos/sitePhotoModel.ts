export type SitePhotoValue = {
  src: string
  altKo: string
  altEn: string
  positionX: number
  positionY: number
}
export type SitePhotoRecord = {
  asset_key: string
  draft: SitePhotoValue | null
  published: SitePhotoValue | null
  version: number
  updated_at: string
  published_at: string | null
}
export type SitePhotoMap = Record<string, { published: SitePhotoValue | null }>
export type PhotoTable = 'hero_slides' | 'popup_notices' | 'conductor' | 'accompanist' | 'concerts' | 'notices' | 'gallery' | 'posters' | 'history' | 'locations' | 'sponsors' | 'videos'
export type ContentPhotoTarget = { table: PhotoTable; field: string; altField?: string; index?: number; previous?: string | null }
export const PHOTO_FIELDS: Record<PhotoTable, readonly string[]> = {
  hero_slides: ['image_url'], popup_notices: ['image_url'], conductor: ['photo_url', 'activity_images'],
  accompanist: ['photo_url'], concerts: ['poster_url'], notices: ['cover_image_url'], gallery: ['image_url'],
  posters: ['image_url'], history: ['image_url'], locations: ['image_url'], sponsors: ['logo_url'], videos: ['thumbnail_url'],
}
const ALT_FIELDS: Partial<Record<PhotoTable, string>> = {
  hero_slides: 'image_alt', popup_notices: 'image_alt', conductor: 'profile_image_alt', locations: 'image_alt',
}

export function isSafePhotoUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\s"'<>\\()]/.test(value) || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return false
  if (value.startsWith('/images/')) return !value.includes('..') && /^\/images\/[a-zA-Z0-9_./-]+$/.test(value)
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && Boolean(url.hostname)
  } catch { return false }
}

export function validateSitePhoto(value: unknown): string | null {
  if (value === null) return null // Null means restore the bundled original, not hide it.
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '사진 설정 형식을 확인해 주세요.'
  const record = value as Record<string, unknown>
  if (Object.keys(record).length !== 5 || Object.keys(record).some(key => !['src', 'altKo', 'altEn', 'positionX', 'positionY'].includes(key))) return '사진 설정 항목을 확인해 주세요.'
  if (!isSafePhotoUrl(record.src)) return 'HTTPS 이미지 주소 또는 /images/ 경로를 입력해 주세요. 공백·스크립트·로그인 정보가 포함된 주소는 사용할 수 없습니다.'
  for (const key of ['altKo', 'altEn']) if (typeof record[key] !== 'string' || record[key].length > 500 || [...record[key]].some(char => char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0)))) return '사진 설명은 500자 이내로 입력해 주세요.'
  for (const key of ['positionX', 'positionY']) if (typeof record[key] !== 'number' || !Number.isFinite(record[key]) || record[key] < 0 || record[key] > 100) return '사진 중심 위치는 0~100 사이로 입력해 주세요.'
  return null
}

export function resolveSitePhoto(records: SitePhotoMap, key: string | undefined, src: string, alt: string, language: 'ko' | 'en') {
  const published = key ? records[key]?.published : null
  if (!published || validateSitePhoto(published)) return { src, alt, objectPosition: undefined, overridden: false }
  return {
    src: published.src, alt: (language === 'en' ? published.altEn : published.altKo).trim() || alt,
    objectPosition: `${published.positionX}% ${published.positionY}%`, overridden: true,
  }
}

export function sameSitePhoto(left: SitePhotoValue | null | undefined, right: SitePhotoValue | null | undefined): boolean {
  if (!left || !right) return !left && !right
  return left.src === right.src && left.altKo === right.altKo && left.altEn === right.altEn
    && left.positionX === right.positionX && left.positionY === right.positionY
}

export function buildContentPhotoPayload(target: ContentPhotoTarget, src: string, alt?: string): Record<string, string | null> {
  if (!PHOTO_FIELDS[target.table]?.includes(target.field) || (src && !isSafePhotoUrl(src))) throw new RangeError('교체할 사진 항목과 이미지 주소를 확인해 주세요.')
  if (target.field === 'activity_images') {
    const lines = (target.previous ?? '').split('\n')
    const index = target.index ?? 0
    if (!Number.isSafeInteger(index) || index < 0 || index >= lines.length || /[|\r\n]/.test(alt ?? '')) throw new RangeError('활동 사진 항목과 설명을 확인해 주세요.')
    const cells = lines[index].split('|').map(cell => cell.trim())
    cells[0] = src
    if (alt !== undefined) cells[1] = alt.trim()
    lines[index] = cells.join(' | ')
    return { activity_images: lines.join('\n') }
  }
  const payload: Record<string, string | null> = { [target.field]: src || null }
  if (target.altField) {
    if (ALT_FIELDS[target.table] !== target.altField || (alt?.length ?? 0) > 500) throw new RangeError('사진 설명 항목을 확인해 주세요.')
    payload[target.altField] = alt?.trim() || null
  }
  return payload
}
