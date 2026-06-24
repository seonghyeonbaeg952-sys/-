import { SUPABASE_SETUP_MESSAGE, getSupabaseClientSafe } from './auth'
import {
  heroSlides,
  mockConcerts,
  mockGallery,
  mockNotices,
  mockSiteSettings,
} from '../constants/mockData'
import type {
  Concert,
  ConcertStatus,
  FAQItem,
  GalleryCategory,
  GalleryImage,
  HeroSlide,
  Notice,
  NoticeCategory,
  Poster,
  SiteSettings,
  VideoItem,
} from '../types/content'
import type {
  AboutSectionRow,
  ConcertRow,
  FaqRow,
  GalleryRow,
  HistoryRow,
  HeroSlideRow,
  JoinInfoRow,
  LocationRow,
  MemberRow,
  NoticeRow,
  PersonProfileRow,
  PosterRow,
  SiteSettingsRow,
  VideoRow,
} from '../types/cms'

export type PublicDataResult<TData> =
  | { data: TData; error: null }
  | { data: null; error: string }

export type PublicAboutData = {
  aboutSections: AboutSectionRow[]
  accompanist: PersonProfileRow | null
  conductor: PersonProfileRow | null
  history: HistoryRow[]
  location: LocationRow | null
  members: MemberRow[]
  siteSettings: SiteSettings | null
}

export type PublicGalleryData = {
  images: GalleryImage[]
  posters: Poster[]
  videos: VideoItem[]
}

export type PublicJoinData = {
  faqs: FAQItem[]
  joinInfo: JoinInfoRow | null
}

export type PublicContactData = {
  location: LocationRow | null
  siteSettings: SiteSettings
}

export type ContactMessageInput = {
  email: string
  message: string
  name: string
  phone: string | null
  privacy_agreed: boolean
  title: string | null
  type: 'concert_request' | 'general' | 'join' | 'support'
  website?: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(error: unknown) {
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }

  return ''
}

function getErrorStatus(error: unknown) {
  if (!isRecord(error)) {
    return ''
  }

  const status = error.status
  const code = error.code

  if (typeof status === 'number') {
    return String(status)
  }

  if (typeof status === 'string') {
    return status
  }

  return typeof code === 'string' ? code : ''
}

function toPublicError(error: unknown, fallback: string) {
  const message = getErrorMessage(error)
  const status = getErrorStatus(error)
  const lowerMessage = message.toLowerCase()

  if (
    status === '401' ||
    status === '403' ||
    status === '42501' ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('rls')
  ) {
    return '공개 데이터 접근 정책을 확인해 주세요.'
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch')
  ) {
    return '데이터 연결에 실패했습니다. 네트워크와 환경변수를 확인해 주세요.'
  }

  return message || fallback
}

function normalizeRows<TRow>(data: unknown): TRow[] {
  return Array.isArray(data) ? (data as TRow[]) : []
}

function normalizeRow<TRow>(data: unknown): TRow | null {
  return isRecord(data) ? (data as TRow) : null
}

function splitLines(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function nullableString(value: string | null | undefined, fallback = '') {
  return value?.trim() || fallback
}

function mapConcertStatus(status: ConcertRow['status']): ConcertStatus {
  if (status === 'open' || status === 'ticketing') {
    return 'open'
  }

  if (status === 'closed' || status === 'past') {
    return 'closed'
  }

  if (status === 'canceled') {
    return 'cancelled'
  }

  return 'scheduled'
}

function mapNoticeCategory(category: NoticeRow['category']): NoticeCategory {
  if (category === 'press') {
    return 'press'
  }

  if (category === 'news') {
    return 'news'
  }

  return 'notice'
}

function mapGalleryCategory(category: string | null): GalleryCategory {
  if (
    category === 'concert' ||
    category === 'practice' ||
    category === 'event' ||
    category === 'archive'
  ) {
    return category
  }

  return 'archive'
}

function mapSiteSettings(row: SiteSettingsRow): SiteSettings {
  return {
    id: row.id,
    about_summary: nullableString(row.about_summary, mockSiteSettings.about_summary),
    address: nullableString(row.address, mockSiteSettings.address),
    email: nullableString(row.email, mockSiteSettings.email),
    fax: nullableString(row.fax, mockSiteSettings.fax),
    hero_subtitle: nullableString(row.hero_subtitle, mockSiteSettings.hero_subtitle),
    hero_title: nullableString(row.hero_title, mockSiteSettings.hero_title),
    instagram_url: nullableString(row.instagram_url, mockSiteSettings.instagram_url),
    phone: nullableString(row.phone, mockSiteSettings.phone),
    site_title: nullableString(row.site_title, mockSiteSettings.site_title),
    youtube_url: nullableString(row.youtube_url, mockSiteSettings.youtube_url),
    updated_at: row.updated_at ?? mockSiteSettings.updated_at,
  }
}

function mapHeroSlide(row: HeroSlideRow): HeroSlide {
  return {
    id: row.id,
    description: nullableString(row.description),
    display_order: row.display_order,
    image_alt: nullableString(row.image_alt, nullableString(row.title, 'Hero 이미지')),
    image_url: nullableString(row.image_url),
    is_visible: row.is_visible,
    primary_cta_href: nullableString(row.primary_cta_href, '/concerts'),
    primary_cta_label: nullableString(row.primary_cta_label, '공연 일정 보기'),
    secondary_cta_href: nullableString(row.secondary_cta_href, '/join'),
    secondary_cta_label: nullableString(row.secondary_cta_label, '입단 안내 보기'),
    subtitle: nullableString(row.subtitle),
    title: nullableString(row.title, mockSiteSettings.hero_title),
  }
}

function mapConcert(row: ConcertRow): Concert {
  return {
    id: row.id,
    apply_url: nullableString(row.apply_url),
    category: row.category,
    created_at: row.created_at ?? '',
    date: nullableString(row.concert_date),
    description: nullableString(row.description),
    is_visible: row.is_visible,
    location: nullableString(row.location, '장소 미정'),
    performers: splitLines(row.performers),
    poster_url: nullableString(row.poster_url),
    program: splitLines(row.program),
    status: mapConcertStatus(row.status),
    ticket_url: nullableString(row.ticket_url),
    time: nullableString(row.concert_time),
    title: row.title,
    updated_at: row.updated_at ?? '',
  }
}

function mapNotice(row: NoticeRow): Notice {
  return {
    id: row.id,
    category: mapNoticeCategory(row.category),
    content: nullableString(row.content),
    cover_image_url: nullableString(row.cover_image_url),
    created_at: row.created_at ?? '',
    is_important: row.is_important,
    is_visible: row.is_visible,
    title: row.title,
    updated_at: row.updated_at ?? '',
  }
}

function mapGalleryImage(row: GalleryRow): GalleryImage {
  return {
    id: row.id,
    category: mapGalleryCategory(row.category),
    created_at: row.created_at ?? '',
    display_order: row.display_order,
    image_alt: nullableString(row.title, '갤러리 이미지'),
    image_url: nullableString(row.image_url),
    is_visible: row.is_visible,
    taken_at: row.taken_at ?? undefined,
    title: nullableString(row.title, '갤러리 이미지'),
    updated_at: row.updated_at ?? '',
  }
}

function mapVideo(row: VideoRow): VideoItem {
  const youtubeId = nullableString(row.youtube_id)

  return {
    id: row.id,
    created_at: row.created_at ?? '',
    description: nullableString(row.description),
    display_order: row.display_order,
    is_visible: row.is_visible,
    provider: 'youtube',
    thumbnail_url: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '',
    title: row.title,
    updated_at: row.updated_at ?? '',
    video_url: nullableString(row.youtube_url),
  }
}

function mapPoster(row: PosterRow): Poster {
  return {
    id: row.id,
    concert_id: row.related_concert_id ?? undefined,
    created_at: row.created_at ?? '',
    display_order: row.display_order,
    image_url: nullableString(row.image_url),
    is_visible: row.is_visible,
    title: nullableString(row.title, '공연 포스터'),
    updated_at: row.updated_at ?? '',
  }
}

function mapFaq(row: FaqRow): FAQItem {
  return {
    id: row.id,
    answer: nullableString(row.answer),
    category: nullableString(row.category, 'join'),
    display_order: row.display_order,
    is_visible: row.is_visible,
    question: row.question,
  }
}

export async function getPublicSiteSettings(): Promise<
  PublicDataResult<SiteSettings | null>
> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('site_settings')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: toPublicError(error, '사이트 정보를 불러오지 못했습니다.') }
  }

  const row = normalizeRow<SiteSettingsRow>(data)

  return { data: row ? mapSiteSettings(row) : null, error: null }
}

export async function getPublicHeroSlides(): Promise<PublicDataResult<HeroSlide[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('hero_slides')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { data: null, error: toPublicError(error, 'Hero 데이터를 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<HeroSlideRow>(data).map(mapHeroSlide), error: null }
}

export async function getPublicAboutSections(): Promise<
  PublicDataResult<AboutSectionRow[]>
> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('about_sections')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (error) {
    return { data: null, error: toPublicError(error, '소개 문구를 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<AboutSectionRow>(data), error: null }
}

export async function getPublicConcerts(): Promise<PublicDataResult<Concert[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('concerts')
    .select('*')
    .eq('is_visible', true)
    .order('concert_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: toPublicError(error, '공연 목록을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<ConcertRow>(data).map(mapConcert), error: null }
}

export async function getPublicConcertById(
  id: string,
): Promise<PublicDataResult<Concert | null>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    const fallback = mockConcerts.find((concert) => concert.id === id) ?? null
    return { data: fallback, error: null }
  }

  const { data, error } = await clientResult.data
    .from('concerts')
    .select('*')
    .eq('id', id)
    .eq('is_visible', true)
    .maybeSingle()

  if (error) {
    return { data: null, error: toPublicError(error, '공연 상세를 불러오지 못했습니다.') }
  }

  const row = normalizeRow<ConcertRow>(data)

  return { data: row ? mapConcert(row) : null, error: null }
}

export async function getPublicNotices(): Promise<PublicDataResult<Notice[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('notices')
    .select('*')
    .eq('is_visible', true)
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: toPublicError(error, '공지사항을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<NoticeRow>(data).map(mapNotice), error: null }
}

export async function getPublicNoticeById(
  id: string,
): Promise<PublicDataResult<Notice | null>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    const fallback = mockNotices.find((notice) => notice.id === id) ?? null
    return { data: fallback, error: null }
  }

  const { data, error } = await clientResult.data
    .from('notices')
    .select('*')
    .eq('id', id)
    .eq('is_visible', true)
    .maybeSingle()

  if (error) {
    return { data: null, error: toPublicError(error, '공지 상세를 불러오지 못했습니다.') }
  }

  const row = normalizeRow<NoticeRow>(data)

  return { data: row ? mapNotice(row) : null, error: null }
}

export async function getPublicGalleryImages(): Promise<
  PublicDataResult<GalleryImage[]>
> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('gallery')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('taken_at', { ascending: false })

  if (error) {
    return { data: null, error: toPublicError(error, '갤러리 사진을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<GalleryRow>(data).map(mapGalleryImage), error: null }
}

export async function getPublicVideos(): Promise<PublicDataResult<VideoItem[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('videos')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: toPublicError(error, '영상 목록을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<VideoRow>(data).map(mapVideo), error: null }
}

export async function getPublicPosters(): Promise<PublicDataResult<Poster[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('posters')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('concert_date', { ascending: false })

  if (error) {
    return { data: null, error: toPublicError(error, '포스터 목록을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<PosterRow>(data).map(mapPoster), error: null }
}

export async function getPublicAboutData(): Promise<
  PublicDataResult<PublicAboutData>
> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const client = clientResult.data
  const [
    siteSettings,
    aboutSections,
    conductor,
    accompanist,
    members,
    history,
    locations,
  ] = await Promise.all([
    getPublicSiteSettings(),
    getPublicAboutSections(),
    client.from('conductor').select('*').eq('is_visible', true).limit(1).maybeSingle(),
    client.from('accompanist').select('*').eq('is_visible', true).limit(1).maybeSingle(),
    client
      .from('members')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
    client
      .from('history')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('year', { ascending: false }),
    client.from('locations').select('*').eq('is_visible', true).limit(1).maybeSingle(),
  ])

  const firstError =
    siteSettings.error ??
    aboutSections.error ??
    conductor.error ??
    accompanist.error ??
    members.error ??
    history.error ??
    locations.error

  if (firstError) {
    return { data: null, error: toPublicError(firstError, '소개 데이터를 불러오지 못했습니다.') }
  }

  return {
    data: {
      aboutSections: aboutSections.data ?? [],
      accompanist: normalizeRow<PersonProfileRow>(accompanist.data),
      conductor: normalizeRow<PersonProfileRow>(conductor.data),
      history: normalizeRows<HistoryRow>(history.data),
      location: normalizeRow<LocationRow>(locations.data),
      members: normalizeRows<MemberRow>(members.data),
      siteSettings: siteSettings.data,
    },
    error: null,
  }
}

export async function getPublicJoinData(): Promise<
  PublicDataResult<PublicJoinData>
> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const [joinInfo, faqs] = await Promise.all([
    clientResult.data
      .from('join_info')
      .select('*')
      .eq('is_visible', true)
      .limit(1)
      .maybeSingle(),
    clientResult.data
      .from('faq')
      .select('*')
      .eq('is_visible', true)
      .order('display_order', { ascending: true }),
  ])

  const firstError = joinInfo.error ?? faqs.error

  if (firstError) {
    return { data: null, error: toPublicError(firstError, '입단 안내를 불러오지 못했습니다.') }
  }

  const joinRow = normalizeRow<JoinInfoRow>(joinInfo.data)

  return {
    data: {
      faqs: normalizeRows<FaqRow>(faqs.data).map(mapFaq),
      joinInfo: joinRow,
    },
    error: null,
  }
}

export async function getPublicContactData(): Promise<
  PublicDataResult<PublicContactData>
> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return {
      data: { location: null, siteSettings: mockSiteSettings },
      error: null,
    }
  }

  const [settings, location] = await Promise.all([
    getPublicSiteSettings(),
    clientResult.data
      .from('locations')
      .select('*')
      .eq('is_visible', true)
      .limit(1)
      .maybeSingle(),
  ])

  if (settings.error || location.error) {
    return {
      data: { location: null, siteSettings: settings.data ?? mockSiteSettings },
      error: null,
    }
  }

  return {
    data: {
      location: normalizeRow<LocationRow>(location.data),
      siteSettings: settings.data ?? mockSiteSettings,
    },
    error: null,
  }
}

export async function createContactMessage(
  input: ContactMessageInput,
): Promise<PublicDataResult<true>> {
  if (input.website?.trim()) {
    return { data: true, error: null }
  }

  if (!input.privacy_agreed) {
    return { data: null, error: '개인정보 수집 및 이용에 동의해 주세요.' }
  }

  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { error } = await clientResult.data.from('contacts').insert({
    email: input.email,
    message: input.message,
    name: input.name,
    phone: input.phone,
    privacy_agreed: true,
    status: 'new',
    title: input.title,
    type: input.type,
  })

  if (error) {
    return {
      data: null,
      error: toPublicError(error, '문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.'),
    }
  }

  return { data: true, error: null }
}

export const publicFallbacks = {
  concerts: mockConcerts,
  gallery: mockGallery,
  heroSlides,
  notices: mockNotices,
  siteSettings: mockSiteSettings,
}
