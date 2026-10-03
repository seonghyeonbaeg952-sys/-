import type { CmsTableName } from '../../types/cms'
import { extractYouTubeId } from '../../utils/youtube'

export type EnglishContentField = { name: string; label: string; type: 'text' | 'textarea' | 'image' | 'url' }
const text = (name: string, label: string): EnglishContentField => ({ name, label, type: 'text' })
const body = (name: string, label: string): EnglishContentField => ({ name, label, type: 'textarea' })
const image = (name: string, label: string): EnglishContentField => ({ name, label, type: 'image' })

/** Only translated display copy and optional English media belong here.
 * Visibility, IDs, dates, category/filter keys and links are shared metadata. */
export const ENGLISH_CONTENT_FIELDS = {
  notices: [text('title', '제목'), body('content', '내용'), image('cover_image_url', '대표 이미지')],
  gallery: [text('title', '제목'), body('description', '설명'), image('image_url', '갤러리 이미지')],
  concerts: [text('title', '제목'), text('location', '공연 장소'), body('description', '소개'), body('program', '프로그램'), body('performers', '출연진'), image('poster_url', '포스터')],
  videos: [text('title', '제목'), body('description', '설명'), { name: 'youtube_url', label: '영문 영상 YouTube URL', type: 'url' }, image('thumbnail_url', '영문 영상 썸네일')],
  posters: [text('title', '제목'), image('image_url', '포스터 이미지')],
  hero_slides: [text('title', '제목'), text('subtitle', '부제목'), body('description', '설명'), text('image_alt', '이미지 설명'), image('image_url', '슬라이드 이미지'), text('primary_cta_label', '주요 버튼 문구'), text('secondary_cta_label', '보조 버튼 문구')],
  popup_notices: [text('title', '제목'), body('content', '내용'), image('image_url', '팝업 이미지'), text('image_alt', '이미지 설명'), text('button_label', '버튼 문구')],
  history: [text('title', '제목'), body('content', '내용'), image('image_url', '연혁 이미지')],
  faq: [text('question', '질문'), body('answer', '답변')],
  about_sections: [text('title', '제목'), body('content', '내용')],
  conductor: [text('name', '이름의 영문 표기'), text('role', '역할'), body('description', '짧은 소개'), body('bio', '약력'), body('message', '인사말'), text('profile_image_alt', '사진 설명'), body('profile_summary', '프로필 본문'), body('profile_highlight', '강조 문장'), body('hero_quote', '대표 문장'), body('current_roles', '현재 역할'), body('education_items', '학력'), body('career_items', '주요 경력'), body('awards_items', '수상 및 주요 활동'), body('activities_items', '활동'), text('philosophy_title', '철학 제목'), body('philosophy_body', '철학 본문'), body('philosophy_quote', '철학 인용문'), body('teaching_principles', '교육 원리'), text('message_title', '메시지 제목'), body('message_body', '메시지 본문')],
  accompanist: [text('name', '이름의 영문 표기'), text('role', '역할'), body('description', '짧은 소개'), body('bio', '약력'), body('message', '인사말')],
  members: [body('description', '공개 설명')],
  sponsors: [text('name', '후원자명'), text('display_name', '표시 이름'), body('description', '소개'), image('logo_url', '로고')],
  site_settings: [text('site_title', '사이트명'), body('about_summary', '사이트 소개 한 줄'), body('address', '표시 주소')],
  locations: [text('place_name', '장소명'), body('address', '표시 주소'), body('transit_info', '교통 안내'), body('parking_info', '주차 안내'), text('image_alt', '이미지 설명'), body('image_caption', '사진 설명'), image('image_url', '장소 이미지')],
  join_info: [text('title', '제목'), body('description', '설명'), body('target', '지원 대상'), body('parts', '모집 파트'), body('audition_process', '오디션 절차'), body('preparation', '준비 사항'), text('rehearsal_time', '연습 시간'), text('rehearsal_location', '연습 장소')],
  support_settings: [text('title', '약정서 제목'), text('subtitle', '약정 문구'), body('description', '상단 설명'), body('message', '후원 취지 안내문'), body('bank_note', '계좌 안내 문구'), body('form_note', '작성 안내 문구'), body('privacy_notice', '개인정보 안내 문구'), body('print_note', '인쇄 안내 문구'), text('submit_button_label', '제출 버튼 문구'), text('print_button_label', '인쇄 버튼 문구'), body('success_message', '저장 성공 문구'), text('organization_name', '하단 단체명'), body('footer_note', '하단 안내 문구')],
} satisfies Partial<Record<CmsTableName, EnglishContentField[]>>

export type SampleContentResource = keyof typeof ENGLISH_CONTENT_FIELDS
export type EnglishContentFields = Record<string, string>
export type EnglishContentRecord = {
  resource: SampleContentResource; record_id: string; draft: EnglishContentFields;
  published: EnglishContentFields | null; version: number; updated_at: string;
  published_at: string | null;
}
export type PublishedEnglishContent = Pick<EnglishContentRecord, 'resource' | 'record_id' | 'published' | 'published_at'>

export function samePublishedEnglishContent(left: readonly PublishedEnglishContent[], right: readonly PublishedEnglishContent[]) {
  return left.length === right.length && left.every((row, index) => row.resource === right[index].resource && row.record_id === right[index].record_id && row.published_at === right[index].published_at)
}

export function isSampleContentResource(value: unknown): value is SampleContentResource {
  return typeof value === 'string' && Object.hasOwn(ENGLISH_CONTENT_FIELDS, value)
}

export function validateEnglishContent(resource: SampleContentResource, fields: unknown): string | null {
  if (!isSampleContentResource(resource) || !fields || typeof fields !== 'object' || Array.isArray(fields)) return '영문 콘텐츠를 확인해 주세요.'
  if (JSON.stringify(fields).length > 100000) return '영문 콘텐츠는 총 100,000자 이내로 작성해 주세요.'
  for (const [key, value] of Object.entries(fields)) {
    const config = ENGLISH_CONTENT_FIELDS[resource].find(field => field.name === key)
    if (!config || typeof value !== 'string' || value.length > 10000 || /<[^>]*>/.test(value)) return '허용된 문구와 이미지 항목만 일반 텍스트로 작성해 주세요.'
    if (value && (config.type === 'image' || config.type === 'url') && !/^(?:https?:\/\/[^\s<>]+|\/(?!\/)[^\s<>]*)$/.test(value)) return `${config.label} 주소를 확인해 주세요.`
    if (value && config.type === 'url' && !isYouTubeUrl(value)) return '영문 영상은 YouTube 또는 youtu.be 주소를 입력해 주세요.'
  }
  return null
}

export function isYouTubeUrl(value: string) {
  try { return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(new URL(value).hostname) && /^https?:/.test(new URL(value).protocol) && /^[a-zA-Z0-9_-]{11}$/.test(extractYouTubeId(value)) } catch { return false }
}

const nestedResource: Record<string, SampleContentResource> = {
  concerts: 'concerts', notices: 'notices', gallery: 'gallery', images: 'gallery', galleryImages: 'gallery',
  posters: 'posters', videos: 'videos', heroSlides: 'hero_slides', popupNotices: 'popup_notices',
  history: 'history', faqs: 'faq', aboutSections: 'about_sections', conductor: 'conductor', accompanists: 'accompanist', members: 'members', sponsors: 'sponsors',
  siteSettings: 'site_settings', location: 'locations', joinInfo: 'join_info', supportSettings: 'support_settings',
}

function rootResource(cacheKey?: string): SampleContentResource | undefined {
  if (cacheKey?.startsWith('concert:')) return 'concerts'
  if (cacheKey?.startsWith('notice:')) return 'notices'
  // Gallery hook returns a composite, while notices/concerts return an array.
  if (cacheKey === 'notices' || cacheKey === 'concerts') return cacheKey
}

/** Apply by resource + UUID, never by matching text: two identically named
 * records must remain independently editable. This runs before generic copy translation. */
export function applyEnglishContent<T>(source: T, translations: readonly PublishedEnglishContent[], cacheKey?: string): T {
  if (translations.length === 0) return source
  const lookup = new Map(translations.map(row => [`${row.resource}:${row.record_id}`, row.published]))
  function visit(value: unknown, resource?: SampleContentResource): unknown {
    if (Array.isArray(value)) {
      const next = value.map(item => visit(item, resource))
      return next.some((item, index) => item !== value[index]) ? next : value
    }
    if (!value || typeof value !== 'object') return value
    const record = value as Record<string, unknown>
    const result = Object.fromEntries(Object.entries(record).map(([key, item]) => [key, visit(item, nestedResource[key])]))
    const fields = resource && typeof record.id === 'string' && record.is_visible !== false ? lookup.get(`${resource}:${record.id}`) : undefined
    if (fields && resource && !validateEnglishContent(resource, fields)) {
      for (const [key, content] of Object.entries(fields)) {
        if (!content.trim()) continue
        if (resource === 'concerts' && ['program', 'performers'].includes(key)) result[key] = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
        else if (resource === 'videos' && key === 'youtube_url') {
          const id = extractYouTubeId(content)
          if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
            result.video_url = content
            result.thumbnail_url = `https://img.youtube.com/vi/${id}/hqdefault.jpg`
            result.thumbnail_fallback_urls = []
          }
        } else result[key] = content
      }
      if (resource === 'gallery' && fields.title?.trim()) result.image_alt = fields.title
      if (resource === 'videos' && fields.thumbnail_url?.trim()) { result.thumbnail_url = fields.thumbnail_url; result.thumbnail_fallback_urls = [] }
    }
    const keys = Object.keys(result)
    return keys.length === Object.keys(record).length && keys.every(key => result[key] === record[key]) ? value : result
  }
  return visit(source, rootResource(cacheKey)) as T
}
