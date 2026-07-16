import { SUPABASE_SETUP_MESSAGE, getSupabaseClientSafe } from './auth'
import {
  heroSlides,
  mockConcerts,
  mockGallery,
  mockNotices,
  mockSiteSettings,
  mockSupportSettings,
} from '../constants/mockData'
import type { SupabaseClient } from '@supabase/supabase-js'
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
  PopupNotice,
  SiteSettings,
  Sponsor,
  SupportSettings,
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
  JoinApplicationStatus,
  LocationRow,
  MemberRow,
  NoticeRow,
  PersonProfileRow,
  PosterRow,
  PopupNoticeRow,
  SiteSettingsRow,
  SiteTextRow,
  SponsorRow,
  SupportSettingsRow,
  VideoRow,
} from '../types/cms'
import { softenPublicCopy } from '../utils/softenPublicCopy'

export type PublicDataResult<TData> =
  | { data: TData; error: null }
  | { data: null; error: string }

export type PublicAboutData = {
  aboutSections: AboutSectionRow[]
  accompanists: PersonProfileRow[]
  conductor: PersonProfileRow | null
  galleryImages: GalleryImage[]
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
  siteTexts: SiteTextRow[]
  sponsors: Sponsor[]
  supportSettings: SupportSettings
}

export type ContactMessageInput = {
  email: string
  message: string
  name: string
  phone: string | null
  privacy_agreed: boolean
  title: string | null
  type: 'concert_request' | 'general' | 'join' | 'other' | 'support'
  website?: string | null
}

export type SupportPledgeInput = {
  address: string | null
  amount: number
  birth_date: string | null
  custom_amount: number | null
  depositor: string | null
  email: string
  gender: 'female' | 'male' | 'none' | null
  member_type: 'corporate' | 'individual'
  name: string
  phone: string
  pledge_date: string | null
  privacy_agreed: boolean
  signature_image_url: string | null
  signer_name: string | null
  website?: string | null
}

export type JoinApplicationInput = {
  address: string
  age: string
  applicant_name: string
  applicant_name_english: string
  applicant_name_hanja: string
  applicant_phone: string
  awards: string
  birth_date: string
  choir_experience: 'no' | 'yes'
  contact_time: 'afternoon' | 'call_available' | 'evening' | 'morning' | 'text_first'
  desired_part: 'alto' | 'bass' | 'soprano' | 'tenor' | 'unsure'
  email: string
  education_status: string
  gender: 'female' | 'male' | 'not_specified'
  grade: string
  guardian_name: string
  guardian_phone: string
  lesson_experience: 'no' | 'yes'
  motivation: string
  music_experience: string
  parent_occupation: string
  photo_file: File
  privacy_agreed: boolean
  recommendation_file: File | null
  recommender_affiliation: string | null
  recommender_name: string | null
  recommender_reason: string | null
  religion: string
  school: string
  self_introduction: string
  vision: string
  website?: string | null
}

type PublicListOptions = {
  limit?: number
}

type PublicConcertListOptions = PublicListOptions & {
  fromDate?: string
  upcomingOnly?: boolean
}

type UpcomingConcertSelectionOptions = {
  fromDate?: string
  limit?: number
}

const SITE_SETTINGS_SELECT = '*'
const SUPPORT_SETTINGS_SELECT = '*'
const SITE_TEXT_SELECT = '*'
const JOIN_APPLICATION_FILES_BUCKET = 'join-application-files'
const JOIN_APPLICATIONS_SCHEMA_MIGRATION = '2026_add_join_applications.sql'

const SPONSOR_SELECT = [
  'id',
  'name',
  'display_name',
  'category',
  'tier',
  'description',
  'logo_url',
  'website_url',
  'show_on_home',
  'show_on_support',
  'show_on_footer',
  'display_order',
  'is_visible',
  'created_at',
].join(',')

const POPUP_NOTICE_SELECT = [
  'id',
  'title',
  'content',
  'image_url',
  'image_alt',
  'button_label',
  'button_href',
  'starts_on',
  'ends_on',
  'display_order',
  'is_visible',
  'created_at',
].join(',')

const ABOUT_SECTION_SELECT = [
  'id',
  'section_key',
  'title',
  'content',
  'display_order',
  'is_visible',
].join(',')

const CONCERT_SELECT = [
  'id',
  'title',
  'category',
  'concert_date',
  'concert_time',
  'location',
  'poster_url',
  'description',
  'program',
  'performers',
  'ticket_url',
  'apply_url',
  'status',
  'is_visible',
  'created_at',
  'updated_at',
].join(',')

const NOTICE_SELECT = [
  'id',
  'title',
  'category',
  'content',
  'cover_image_url',
  'is_important',
  'is_visible',
  'created_at',
  'updated_at',
].join(',')

const GALLERY_SELECT = [
  'id',
  'title',
  'category',
  'image_url',
  'description',
  'taken_at',
  'related_concert_id',
  'is_visible',
  'display_order',
  'created_at',
  'updated_at',
].join(',')

const VIDEO_SELECT = [
  'id',
  'title',
  'youtube_url',
  'youtube_id',
  'description',
  'is_visible',
  'display_order',
  'created_at',
  'updated_at',
].join(',')

const POSTER_SELECT = [
  'id',
  'title',
  'image_url',
  'concert_date',
  'related_concert_id',
  'is_visible',
  'display_order',
  'created_at',
  'updated_at',
].join(',')

const PERSON_PROFILE_SELECT = '*'

const LEGACY_MEMBER_SELECT = [
  'id',
  'name',
  'part',
  'group_type',
  'photo_url',
  'description',
  'is_visible',
  'name_display_type',
  'display_order',
].join(',')

const HISTORY_SELECT = [
  'id',
  'year',
  'month',
  'title',
  'content',
  'image_url',
  'is_visible',
  'display_order',
].join(',')

const LOCATION_SELECT = '*'

const JOIN_INFO_SELECT = [
  'id',
  'title',
  'description',
  'target',
  'parts',
  'audition_process',
  'preparation',
  'rehearsal_time',
  'rehearsal_location',
  'application_url',
  'is_visible',
].join(',')

const FAQ_SELECT = [
  'id',
  'question',
  'answer',
  'category',
  'display_order',
  'is_visible',
].join(',')

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
    return '공개 데이터 접근 권한을 확인해 주세요.'
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

async function getPublicVisibleLocation(client: SupabaseClient) {
  return client
    .from('locations')
    .select(LOCATION_SELECT)
    .eq('is_visible', true)
    .limit(1)
    .maybeSingle()
}

function normalizeRows<TRow>(data: unknown): TRow[] {
  return Array.isArray(data) ? (data as TRow[]) : []
}

function normalizeRow<TRow>(data: unknown): TRow | null {
  return isRecord(data) ? (data as TRow) : null
}

function normalizeLimit(limit: number | undefined) {
  if (limit === undefined || !Number.isFinite(limit)) {
    return null
  }

  const normalizedLimit = Math.trunc(limit)

  return normalizedLimit > 0 ? normalizedLimit : null
}

const seoulDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
})

export function getSeoulDateString(date = new Date()) {
  const parts = new Map(
    seoulDateFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  )

  return `${parts.get('year')}-${parts.get('month')}-${parts.get('day')}`
}

export function selectUpcomingConcerts(
  concerts: Concert[],
  options: UpcomingConcertSelectionOptions = {},
) {
  const fromDate = options.fromDate ?? getSeoulDateString()
  const limit = normalizeLimit(options.limit)
  const upcomingConcerts = concerts
    .filter(
      (concert) =>
        concert.is_visible &&
        concert.status !== 'cancelled' &&
        Boolean(concert.date) &&
        concert.date >= fromDate,
    )
    .sort((first, second) => first.date.localeCompare(second.date))

  return limit ? upcomingConcerts.slice(0, limit) : upcomingConcerts
}

function splitLines(value: string | null | undefined) {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitAmountOptions(value: string | null | undefined, fallback: number[]) {
  const amounts = (value ?? '')
    .split(/[\n,]/)
    .map((item) => Number(item.replace(/[^\d]/g, '')))
    .filter((amount) => Number.isFinite(amount) && amount > 0)

  return amounts.length > 0 ? amounts : fallback
}

function nullableString(value: string | null | undefined, fallback = '') {
  return softenPublicCopy(value?.trim() || fallback)
}

function mapAboutSection(row: AboutSectionRow): AboutSectionRow {
  return {
    ...row,
    content: softenPublicCopy(row.content),
    title: row.title ? softenPublicCopy(row.title) : row.title,
  }
}

function isMissingSupportSettingsError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('support_settings') &&
    (message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('could not find the table'))
  )
}

function isMissingSupportPledgesError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('support_pledges') &&
    (message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('could not find the table'))
  )
}

function isMissingSponsorsError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('sponsors') &&
    (message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('could not find the table'))
  )
}

function isMissingSiteTextsError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('site_texts') &&
    (message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('could not find the table'))
  )
}

function isMissingJoinApplicationsError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  return (
    message.includes('join_applications') &&
    (message.includes('schema cache') ||
      message.includes('does not exist') ||
      message.includes('could not find the table'))
  )
}

function isMissingJoinApplicationFilesBucketError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  const status = getErrorStatus(error)

  return (
    status === '404' ||
    message.includes('bucket') ||
    message.includes('not found') ||
    message.includes('does not exist')
  )
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : null
}

function joinLabeledLines(items: Array<[string, string | null | undefined]>) {
  return items
    .map(([label, value]) => {
      const normalizedValue = value?.trim()

      return normalizedValue ? `${label}: ${normalizedValue}` : null
    })
    .filter(Boolean)
    .join('\n')
}

function getFileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (extension === 'jpeg') {
    return 'jpg'
  }

  return extension
}

function sanitizeStorageFileName(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const baseName = fileName
    .replace(/\.[^.]+$/, '')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

  return `${baseName || 'file'}${extension ? `.${extension}` : ''}`
}

function validateJoinApplicationFile(
  file: File,
  kind: 'photo' | 'recommendation',
): PublicDataResult<true> {
  const extension = getFileExtension(file)
  const allowedPhotoExtensions = new Set(['jpg', 'png', 'webp'])
  const allowedRecommendationExtensions = new Set([
    'hwp',
    'hwpx',
    'jpg',
    'pdf',
    'png',
    'webp',
  ])
  const maxSizeMb = kind === 'photo' ? 5 : 10
  const maxBytes = maxSizeMb * 1024 * 1024
  const isAllowed =
    kind === 'photo'
      ? allowedPhotoExtensions.has(extension)
      : allowedRecommendationExtensions.has(extension)

  if (!isAllowed) {
    return {
      data: null,
      error:
        kind === 'photo'
          ? '사진은 jpg, png, webp 파일만 첨부할 수 있습니다.'
          : '추천서는 pdf, hwp, hwpx 또는 이미지 파일만 첨부할 수 있습니다.',
    }
  }

  if (file.size > maxBytes) {
    return {
      data: null,
      error: `첨부 파일은 ${maxSizeMb}MB 이하만 업로드할 수 있습니다.`,
    }
  }

  return { data: true, error: null }
}

async function uploadJoinApplicationFile(
  client: SupabaseClient,
  file: File | null,
  kind: 'photo' | 'recommendation',
): Promise<PublicDataResult<string | null>> {
  if (!file) {
    return { data: null, error: null } satisfies PublicDataResult<string | null>
  }

  const validationResult = validateJoinApplicationFile(file, kind)

  if (!validationResult.data) {
    return { data: null, error: validationResult.error }
  }

  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const path = `submissions/${new Date().toISOString().slice(0, 10)}/${randomId}/${kind}-${sanitizeStorageFileName(file.name)}`
  const { error } = await client.storage
    .from(JOIN_APPLICATION_FILES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    if (isMissingJoinApplicationFilesBucketError(error)) {
      return {
        data: null,
        error:
          `입단지원서 첨부 파일 bucket이 아직 없습니다. Supabase SQL Editor에서 ${JOIN_APPLICATIONS_SCHEMA_MIGRATION} migration을 먼저 실행해 주세요.`,
      }
    }

    return {
      data: null,
      error: toPublicError(
        error,
        '첨부 파일 업로드에 실패했습니다. 파일을 확인한 뒤 다시 제출해 주세요.',
      ),
    }
  }

  return { data: path, error: null }
}

async function getPublicVisibleConductor(client: SupabaseClient) {
  return client
    .from('conductor')
    .select(PERSON_PROFILE_SELECT)
    .eq('is_visible', true)
    .limit(1)
    .maybeSingle()
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
  if (
    category === 'press' ||
    category === 'news' ||
    category === 'join' ||
    category === 'concert' ||
    category === 'rehearsal'
  ) {
    return category
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
    home_about_button_label: nullableString(
      row.home_about_button_label,
      mockSiteSettings.home_about_button_label,
    ),
    home_about_title: nullableString(
      row.home_about_title,
      mockSiteSettings.home_about_title,
    ),
    home_concerts_button_label: nullableString(
      row.home_concerts_button_label,
      mockSiteSettings.home_concerts_button_label,
    ),
    home_concerts_description: nullableString(
      row.home_concerts_description,
      mockSiteSettings.home_concerts_description,
    ),
    home_concerts_title: nullableString(
      row.home_concerts_title,
      mockSiteSettings.home_concerts_title,
    ),
    home_gallery_button_label: nullableString(
      row.home_gallery_button_label,
      mockSiteSettings.home_gallery_button_label,
    ),
    home_gallery_description: nullableString(
      row.home_gallery_description,
      mockSiteSettings.home_gallery_description,
    ),
    home_gallery_title: nullableString(
      row.home_gallery_title,
      mockSiteSettings.home_gallery_title,
    ),
    home_hero_description: nullableString(
      row.home_hero_description,
      mockSiteSettings.home_hero_description,
    ),
    home_hero_eyebrow: nullableString(
      row.home_hero_eyebrow,
      mockSiteSettings.home_hero_eyebrow,
    ),
    home_info_card_1_description: nullableString(
      row.home_info_card_1_description,
      mockSiteSettings.home_info_card_1_description,
    ),
    home_info_card_1_title: nullableString(
      row.home_info_card_1_title,
      mockSiteSettings.home_info_card_1_title,
    ),
    home_info_card_2_description: nullableString(
      row.home_info_card_2_description,
      mockSiteSettings.home_info_card_2_description,
    ),
    home_info_card_2_title: nullableString(
      row.home_info_card_2_title,
      mockSiteSettings.home_info_card_2_title,
    ),
    home_info_card_3_description: nullableString(
      row.home_info_card_3_description,
      mockSiteSettings.home_info_card_3_description,
    ),
    home_info_card_3_title: nullableString(
      row.home_info_card_3_title,
      mockSiteSettings.home_info_card_3_title,
    ),
    home_join_button_label: nullableString(
      row.home_join_button_label,
      mockSiteSettings.home_join_button_label,
    ),
    home_join_title: nullableString(
      row.home_join_title,
      mockSiteSettings.home_join_title,
    ),
    home_notices_button_label: nullableString(
      row.home_notices_button_label,
      mockSiteSettings.home_notices_button_label,
    ),
    home_notices_description: nullableString(
      row.home_notices_description,
      mockSiteSettings.home_notices_description,
    ),
    home_notices_title: nullableString(
      row.home_notices_title,
      mockSiteSettings.home_notices_title,
    ),
    home_support_button_label: nullableString(
      row.home_support_button_label,
      mockSiteSettings.home_support_button_label,
    ),
    home_support_title: nullableString(
      row.home_support_title,
      mockSiteSettings.home_support_title,
    ),
    join_cta_text: nullableString(row.join_cta_text, mockSiteSettings.join_cta_text),
    instagram_url: nullableString(row.instagram_url, mockSiteSettings.instagram_url),
    phone: nullableString(row.phone, mockSiteSettings.phone),
    site_title: nullableString(row.site_title, mockSiteSettings.site_title),
    support_text: nullableString(row.support_text, mockSiteSettings.support_text),
    youtube_url: nullableString(row.youtube_url, mockSiteSettings.youtube_url),
    updated_at: row.updated_at ?? mockSiteSettings.updated_at,
  }
}

function mapSupportSettings(row: SupportSettingsRow): SupportSettings {
  return {
    id: row.id,
    title: nullableString(row.title, mockSupportSettings.title),
    subtitle: nullableString(row.subtitle, mockSupportSettings.subtitle),
    description: nullableString(row.description, mockSupportSettings.description),
    message: nullableString(row.message, mockSupportSettings.message),
    individual_amounts: splitAmountOptions(
      row.individual_amounts,
      mockSupportSettings.individual_amounts,
    ),
    corporate_amounts: splitAmountOptions(
      row.corporate_amounts,
      mockSupportSettings.corporate_amounts,
    ),
    allow_custom_amount: row.allow_custom_amount ?? mockSupportSettings.allow_custom_amount,
    bank_name: nullableString(row.bank_name),
    bank_account_number: nullableString(row.bank_account_number),
    bank_account_holder: nullableString(row.bank_account_holder),
    bank_note: nullableString(row.bank_note, mockSupportSettings.bank_note),
    enable_online_submission:
      row.enable_online_submission ?? mockSupportSettings.enable_online_submission,
    form_note: nullableString(row.form_note, mockSupportSettings.form_note),
    privacy_notice: nullableString(row.privacy_notice, mockSupportSettings.privacy_notice),
    print_note: nullableString(row.print_note, mockSupportSettings.print_note),
    print_button_label: nullableString(
      row.print_button_label,
      mockSupportSettings.print_button_label,
    ),
    submit_button_label: nullableString(
      row.submit_button_label,
      mockSupportSettings.submit_button_label,
    ),
    success_message: nullableString(row.success_message, mockSupportSettings.success_message),
    contact_phone: nullableString(row.contact_phone),
    contact_email: nullableString(row.contact_email),
    homepage_url: nullableString(row.homepage_url),
    organization_name: nullableString(
      row.organization_name,
      mockSupportSettings.organization_name,
    ),
    footer_note: nullableString(row.footer_note, mockSupportSettings.footer_note),
    is_visible: row.is_visible,
    updated_at: row.updated_at ?? mockSupportSettings.updated_at,
  }
}

function mapSponsor(row: SponsorRow): Sponsor {
  return {
    id: row.id,
    category: row.category,
    description: nullableString(row.description),
    display_name: nullableString(row.display_name, row.name),
    display_order: row.display_order,
    is_visible: row.is_visible,
    logo_url: nullableString(row.logo_url),
    name: row.name,
    show_on_footer: row.show_on_footer,
    show_on_home: row.show_on_home,
    show_on_support: row.show_on_support,
    tier: row.tier,
    website_url: nullableString(row.website_url),
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
    primary_cta_href: nullableString(row.primary_cta_href),
    primary_cta_label: nullableString(row.primary_cta_label),
    secondary_cta_href: nullableString(row.secondary_cta_href),
    secondary_cta_label: nullableString(row.secondary_cta_label),
    subtitle: nullableString(row.subtitle),
    title: nullableString(row.title, mockSiteSettings.hero_title),
  }
}

function mapPopupNotice(row: PopupNoticeRow): PopupNotice {
  return {
    id: row.id,
    title: row.title,
    content: nullableString(row.content),
    image_url: nullableString(row.image_url),
    image_alt: nullableString(row.image_alt, nullableString(row.title, '홈 팝업 이미지')),
    button_label: nullableString(row.button_label),
    button_href: nullableString(row.button_href),
    starts_on: row.starts_on ?? undefined,
    ends_on: row.ends_on ?? undefined,
    display_order: row.display_order,
    is_visible: row.is_visible,
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
    location: nullableString(row.location),
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
    concert_id: row.related_concert_id ?? undefined,
    created_at: row.created_at ?? '',
    description: nullableString(row.description),
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
  const youtubeThumbnailUrls = youtubeId
    ? [
        `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`,
        `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
      ]
    : []

  return {
    id: row.id,
    created_at: row.created_at ?? '',
    description: nullableString(row.description),
    display_order: row.display_order,
    is_visible: row.is_visible,
    provider: 'youtube',
    thumbnail_fallback_urls: youtubeThumbnailUrls.slice(1),
    thumbnail_url: youtubeThumbnailUrls[0] ?? '',
    title: row.title,
    updated_at: row.updated_at ?? '',
    video_url: nullableString(row.youtube_url, youtubeId),
  }
}

function mapPoster(row: PosterRow): Poster {
  return {
    id: row.id,
    concert_id: row.related_concert_id ?? undefined,
    concert_date: row.concert_date ?? undefined,
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

async function getPublicMembers(client: SupabaseClient) {
  return client
    .from('members')
    .select(LEGACY_MEMBER_SELECT)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
}

const sharedPublicRequests = new Map<
  string,
  Promise<PublicDataResult<unknown>>
>()

function runSharedPublicRequest<TData>(
  key: string,
  loader: () => Promise<PublicDataResult<TData>>,
): Promise<PublicDataResult<TData>> {
  const pendingRequest = sharedPublicRequests.get(key)

  if (pendingRequest) {
    return pendingRequest as Promise<PublicDataResult<TData>>
  }

  const request = loader().finally(() => {
    if (sharedPublicRequests.get(key) === request) {
      sharedPublicRequests.delete(key)
    }
  })

  sharedPublicRequests.set(
    key,
    request as Promise<PublicDataResult<unknown>>,
  )

  return request
}

export function getPublicSiteSettings(): Promise<
  PublicDataResult<SiteSettings | null>
> {
  return runSharedPublicRequest('site-settings', async () => {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('site_settings')
    .select(SITE_SETTINGS_SELECT)
    .eq('is_visible', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { data: null, error: toPublicError(error, '사이트 정보를 불러오지 못했습니다.') }
  }

  const row = normalizeRow<SiteSettingsRow>(data)

    return { data: row ? mapSiteSettings(row) : null, error: null }
  })
}

export function getPublicSiteTexts(): Promise<PublicDataResult<SiteTextRow[]>> {
  return runSharedPublicRequest('site-texts', async () => {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: [], error: null }
  }

  const { data, error } = await clientResult.data
    .from('site_texts')
    .select(SITE_TEXT_SELECT)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) {
    if (isMissingSiteTextsError(error)) {
      return { data: [], error: null }
    }

    return { data: null, error: toPublicError(error, '사이트 문구를 불러오지 못했습니다.') }
  }

    return { data: normalizeRows<SiteTextRow>(data), error: null }
  })
}

export function getPublicSupportSettings(): Promise<
  PublicDataResult<SupportSettings | null>
> {
  return runSharedPublicRequest('support-settings', async () => {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data, error } = await clientResult.data
    .from('support_settings')
    .select(SUPPORT_SETTINGS_SELECT)
    .eq('is_visible', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingSupportSettingsError(error)) {
      return { data: null, error: null }
    }

    return {
      data: null,
      error: toPublicError(error, '후원약정 정보를 불러오지 못했습니다.'),
    }
  }

  const row = normalizeRow<SupportSettingsRow>(data)

    return { data: row ? mapSupportSettings(row) : null, error: null }
  })
}

export async function getPublicSponsors(
  options: PublicListOptions & {
    footerOnly?: boolean
    homeOnly?: boolean
    supportOnly?: boolean
  } = {},
): Promise<PublicDataResult<Sponsor[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: [], error: null }
  }

  let query = clientResult.data
    .from('sponsors')
    .select(SPONSOR_SELECT)
    .eq('is_visible', true)
    .eq('consent_public', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (options.homeOnly) {
    query = query.eq('show_on_home', true)
  }

  if (options.supportOnly) {
    query = query.eq('show_on_support', true)
  }

  if (options.footerOnly) {
    query = query.eq('show_on_footer', true)
  }

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingSponsorsError(error)) {
      return { data: [], error: null }
    }

    return { data: null, error: toPublicError(error, '후원사 정보를 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<SponsorRow>(data).map(mapSponsor), error: null }
}

export async function getPublicHeroSlides(
  options: PublicListOptions = {},
): Promise<PublicDataResult<HeroSlide[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data
    .from('hero_slides')
    .select(
      [
        'id',
        'title',
        'subtitle',
        'description',
        'image_url',
        'image_alt',
        'primary_cta_label',
        'primary_cta_href',
        'secondary_cta_label',
        'secondary_cta_href',
        'display_order',
        'is_visible',
        'created_at',
      ].join(','),
    )
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: toPublicError(error, '히어로 이미지를 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<HeroSlideRow>(data).map(mapHeroSlide), error: null }
}

export async function getPublicPopupNotices(
  options: PublicListOptions = {},
): Promise<PublicDataResult<PopupNotice[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data
    .from('popup_notices')
    .select(POPUP_NOTICE_SELECT)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: toPublicError(error, '팝업 알림을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<PopupNoticeRow>(data).map(mapPopupNotice), error: null }
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
    .select(ABOUT_SECTION_SELECT)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (error) {
    return { data: null, error: toPublicError(error, '소개 문구를 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<AboutSectionRow>(data).map(mapAboutSection), error: null }
}

export async function getPublicConcerts(
  options: PublicConcertListOptions = {},
): Promise<PublicDataResult<Concert[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const fromDate = options.upcomingOnly
    ? options.fromDate ?? getSeoulDateString()
    : null
  let query = clientResult.data
    .from('concerts')
    .select(CONCERT_SELECT)
    .eq('is_visible', true)

  if (fromDate) {
    query = query
      .gte('concert_date', fromDate)
      .neq('status', 'canceled')
  }

  query = query
    .order('concert_date', { ascending: Boolean(fromDate) })
    .order('created_at', { ascending: false })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

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
    .select(CONCERT_SELECT)
    .eq('id', id)
    .eq('is_visible', true)
    .maybeSingle()

  if (error) {
    return { data: null, error: toPublicError(error, '공연 상세를 불러오지 못했습니다.') }
  }

  const row = normalizeRow<ConcertRow>(data)

  return { data: row ? mapConcert(row) : null, error: null }
}

export async function getPublicNotices(
  options: PublicListOptions = {},
): Promise<PublicDataResult<Notice[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data
    .from('notices')
    .select(NOTICE_SELECT)
    .eq('is_visible', true)
    .order('is_important', { ascending: false })
    .order('created_at', { ascending: false })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

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
    .select(NOTICE_SELECT)
    .eq('id', id)
    .eq('is_visible', true)
    .maybeSingle()

  if (error) {
    return { data: null, error: toPublicError(error, '공지 상세를 불러오지 못했습니다.') }
  }

  const row = normalizeRow<NoticeRow>(data)

  return { data: row ? mapNotice(row) : null, error: null }
}

export async function getPublicGalleryImages(
  options: PublicListOptions = {},
): Promise<PublicDataResult<GalleryImage[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data
    .from('gallery')
    .select(GALLERY_SELECT)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('taken_at', { ascending: false })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: toPublicError(error, '갤러리 사진을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<GalleryRow>(data).map(mapGalleryImage), error: null }
}

export async function getPublicVideos(
  options: PublicListOptions = {},
): Promise<PublicDataResult<VideoItem[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data
    .from('videos')
    .select(VIDEO_SELECT)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: toPublicError(error, '영상 목록을 불러오지 못했습니다.') }
  }

  return { data: normalizeRows<VideoRow>(data).map(mapVideo), error: null }
}

export async function getPublicPosters(
  options: PublicListOptions = {},
): Promise<PublicDataResult<Poster[]>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  let query = clientResult.data
    .from('posters')
    .select(POSTER_SELECT)
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('concert_date', { ascending: false })

  const limit = normalizeLimit(options.limit)

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

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
    accompanists,
    members,
    history,
    locations,
    galleryImages,
  ] = await Promise.all([
    getPublicSiteSettings(),
    getPublicAboutSections(),
    getPublicVisibleConductor(client),
    client
      .from('accompanist')
      .select(PERSON_PROFILE_SELECT)
      .eq('is_visible', true)
      .order('created_at', { ascending: true }),
    getPublicMembers(client),
    client
      .from('history')
      .select(HISTORY_SELECT)
      .eq('is_visible', true)
      .order('display_order', { ascending: true })
      .order('year', { ascending: false }),
    getPublicVisibleLocation(client),
    getPublicGalleryImages({ limit: 3 }),
  ])

  const firstError =
    siteSettings.error ??
    aboutSections.error ??
    conductor.error ??
    accompanists.error ??
    members.error ??
    history.error ??
    locations.error

  if (firstError) {
    return { data: null, error: toPublicError(firstError, '소개 데이터를 불러오지 못했습니다.') }
  }

  return {
    data: {
      aboutSections: aboutSections.data ?? [],
      accompanists: normalizeRows<PersonProfileRow>(accompanists.data),
      conductor: normalizeRow<PersonProfileRow>(conductor.data),
      galleryImages: galleryImages.data ?? [],
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
      .select(JOIN_INFO_SELECT)
      .eq('is_visible', true)
      .limit(1)
      .maybeSingle(),
    clientResult.data
      .from('faq')
      .select(FAQ_SELECT)
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
      data: {
        location: null,
        siteSettings: mockSiteSettings,
        siteTexts: [],
        sponsors: [],
        supportSettings: mockSupportSettings,
      },
      error: null,
    }
  }

  const [settings, supportSettings, location, sponsors, siteTexts] = await Promise.all([
    getPublicSiteSettings(),
    getPublicSupportSettings(),
    getPublicVisibleLocation(clientResult.data),
    getPublicSponsors(),
    getPublicSiteTexts(),
  ])

  if (settings.error || location.error) {
    return {
      data: {
        location: null,
        siteSettings: settings.data ?? mockSiteSettings,
        siteTexts: siteTexts.data ?? [],
        sponsors: sponsors.data ?? [],
        supportSettings: supportSettings.data ?? mockSupportSettings,
      },
      error: null,
    }
  }

  return {
    data: {
      location: normalizeRow<LocationRow>(location.data),
      siteSettings: settings.data ?? mockSiteSettings,
      siteTexts: siteTexts.data ?? [],
      sponsors: sponsors.data ?? [],
      supportSettings: supportSettings.data ?? mockSupportSettings,
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

export async function createJoinApplication(
  input: JoinApplicationInput,
): Promise<PublicDataResult<true>> {
  if (input.website?.trim()) {
    return { data: true, error: null }
  }

  if (!input.privacy_agreed) {
    return { data: null, error: '개인정보 수집 및 이용에 동의해 주세요.' }
  }

  if (
    !input.applicant_name.trim() ||
    !input.applicant_name_hanja.trim() ||
    !input.applicant_name_english.trim() ||
    !input.birth_date ||
    !input.age.trim() ||
    input.gender === 'not_specified' ||
    !input.religion.trim() ||
    !input.address.trim() ||
    !input.school.trim() ||
    !input.grade.trim() ||
    !input.education_status.trim() ||
    !input.desired_part ||
    !input.photo_file ||
    !input.applicant_phone.trim() ||
    !input.guardian_name.trim() ||
    !input.guardian_phone.trim() ||
    !input.email.trim() ||
    !input.contact_time ||
    !input.parent_occupation.trim() ||
    !input.music_experience.trim() ||
    !input.awards.trim() ||
    !input.self_introduction.trim() ||
    !input.motivation.trim() ||
    !input.vision.trim()
  ) {
    return {
      data: null,
      error: '필수 항목을 모두 입력해 주세요.',
    }
  }

  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const photoUploadResult = await uploadJoinApplicationFile(
    clientResult.data,
    input.photo_file,
    'photo',
  )

  if (photoUploadResult.error) {
    return { data: null, error: photoUploadResult.error }
  }

  const recommendationUploadResult = await uploadJoinApplicationFile(
    clientResult.data,
    input.recommendation_file,
    'recommendation',
  )

  if (recommendationUploadResult.error) {
    return { data: null, error: recommendationUploadResult.error }
  }

  const initialStatus: JoinApplicationStatus = 'new'
  const applicantProfileText = joinLabeledLines([
    ['지원자 이름 한자', input.applicant_name_hanja],
    ['지원자 이름 영문', input.applicant_name_english],
    ['나이', input.age],
    ['종교', input.religion],
    ['주소', input.address],
    ['최종학력 또는 현재 재학 정보', input.education_status],
    ['부모님 직업', input.parent_occupation],
  ])
  const musicExperienceText = [
    '지원자 추가 정보',
    applicantProfileText,
    '',
    '음악활동 경험',
    input.music_experience.trim(),
  ].join('\n')
  const motivationText = [
    '자기소개 및 음악활동 경험',
    input.self_introduction.trim(),
    '',
    '서울모테트청소년합창단을 지원하게 된 동기',
    input.motivation.trim(),
  ].join('\n')
  const { error } = await clientResult.data.from('join_applications').insert({
    admin_notes: null,
    applicant_name: input.applicant_name.trim(),
    applicant_phone: input.applicant_phone.trim(),
    awards: input.awards.trim(),
    birth_date: input.birth_date,
    choir_experience: input.choir_experience,
    contact_time: input.contact_time,
    desired_part: input.desired_part,
    email: input.email.trim(),
    gender: input.gender,
    grade: input.grade.trim(),
    guardian_name: input.guardian_name.trim(),
    guardian_phone: input.guardian_phone.trim(),
    is_archived: false,
    lesson_experience: input.lesson_experience,
    motivation: motivationText,
    music_experience: musicExperienceText,
    photo_file_path: photoUploadResult.data,
    privacy_agreed: true,
    recommendation_file_path: recommendationUploadResult.data,
    recommender_affiliation: normalizeOptionalText(input.recommender_affiliation),
    recommender_name: normalizeOptionalText(input.recommender_name),
    recommender_reason: normalizeOptionalText(input.recommender_reason),
    region: input.address.trim(),
    school: input.school.trim(),
    status: initialStatus,
    vision: input.vision.trim(),
  })

  if (error) {
    if (isMissingJoinApplicationsError(error)) {
      return {
        data: null,
        error:
          `입단지원서 저장 테이블이 아직 없습니다. Supabase SQL Editor에서 ${JOIN_APPLICATIONS_SCHEMA_MIGRATION} migration을 먼저 실행해 주세요.`,
      }
    }

    return {
      data: null,
      error: toPublicError(
        error,
        '입단지원서 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      ),
    }
  }

  return { data: true, error: null }
}

export async function createSupportPledge(
  input: SupportPledgeInput,
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

  const { error } = await clientResult.data.from('support_pledges').insert({
    address: input.address,
    amount: input.amount,
    birth_date: input.birth_date,
    custom_amount: input.custom_amount,
    depositor: input.depositor,
    email: input.email,
    gender: input.gender,
    member_type: input.member_type,
    name: input.name,
    phone: input.phone,
    pledge_date: input.pledge_date,
    privacy_agreed: true,
    signature_image_url: input.signature_image_url,
    signer_name: input.signer_name,
    status: 'new',
  })

  if (error) {
    if (isMissingSupportPledgesError(error)) {
      return {
        data: null,
        error:
          '후원약정 저장 테이블이 아직 없습니다. 관리자에게 Supabase migration 적용을 요청해 주세요.',
      }
    }

    return {
      data: null,
      error: toPublicError(
        error,
        '후원약정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      ),
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

