export type CmsValue = string | number | boolean | null

export type CmsMutationPayload = Record<string, CmsValue | undefined>

export interface CmsRecord {
  id: string
  created_at?: string
  updated_at?: string
  is_visible?: boolean
  [key: string]: CmsValue | undefined
}

export type CmsTableName =
  | 'site_settings'
  | 'about_sections'
  | 'hero_slides'
  | 'locations'
  | 'conductor'
  | 'accompanist'
  | 'members'
  | 'concerts'
  | 'notices'
  | 'gallery'
  | 'videos'
  | 'posters'
  | 'history'
  | 'join_info'
  | 'faq'
  | 'contacts'

export interface SiteSettingsRow extends CmsRecord {
  site_title: string | null
  hero_title: string | null
  hero_subtitle: string | null
  about_summary: string | null
  support_text: string | null
  join_cta_text: string | null
  email: string | null
  phone: string | null
  fax: string | null
  address: string | null
  instagram_url: string | null
  youtube_url: string | null
  is_visible: boolean
}

export interface AboutSectionRow extends CmsRecord {
  section_key: string
  title: string | null
  content: string
  display_order: number
  is_visible: boolean
}

export interface HeroSlideRow extends CmsRecord {
  title: string
  subtitle: string | null
  description: string | null
  image_url: string | null
  image_alt: string | null
  primary_cta_label: string | null
  primary_cta_href: string | null
  secondary_cta_label: string | null
  secondary_cta_href: string | null
  display_order: number
  is_visible: boolean
}

export interface LocationRow extends CmsRecord {
  place_name: string | null
  address: string | null
  email?: string | null
  fax?: string | null
  map_embed_url?: string | null
  naver_map_url: string | null
  kakao_map_url: string | null
  transit_info: string | null
  parking_info: string | null
  phone: string | null
  is_visible: boolean
}

export interface PersonProfileRow extends CmsRecord {
  name: string | null
  role: string | null
  photo_url: string | null
  description: string | null
  bio: string | null
  message: string | null
  is_visible: boolean
}

export interface MemberRow extends CmsRecord {
  name: string | null
  part: 'soprano' | 'alto' | 'tenor' | 'bass' | 'other'
  group_type: 'elementary' | 'middle' | 'high' | 'alumni' | 'other'
  photo_url: string | null
  description: string | null
  is_visible: boolean
  name_display_type: 'full' | 'partial' | 'hidden'
  display_order: number
}

export interface ConcertRow extends CmsRecord {
  title: string
  category: 'regular' | 'invited' | 'special' | 'church' | 'past' | 'other'
  concert_date: string | null
  concert_time: string | null
  location: string | null
  poster_url: string | null
  description: string | null
  program: string | null
  performers: string | null
  ticket_url: string | null
  apply_url: string | null
  status: 'upcoming' | 'open' | 'ticketing' | 'closed' | 'past' | 'canceled'
  is_visible: boolean
}

export interface NoticeRow extends CmsRecord {
  title: string
  category: 'notice' | 'join' | 'concert' | 'rehearsal' | 'press' | 'news'
  content: string | null
  cover_image_url: string | null
  is_important: boolean
  is_visible: boolean
}

export interface GalleryRow extends CmsRecord {
  title: string | null
  category: string | null
  image_url: string | null
  description: string | null
  taken_at: string | null
  related_concert_id: string | null
  is_visible: boolean
  display_order: number
}

export interface VideoRow extends CmsRecord {
  title: string
  youtube_url: string | null
  youtube_id: string | null
  description: string | null
  related_concert_id: string | null
  is_visible: boolean
  display_order: number
}

export interface PosterRow extends CmsRecord {
  title: string | null
  image_url: string | null
  concert_date: string | null
  related_concert_id: string | null
  is_visible: boolean
  display_order: number
}

export interface HistoryRow extends CmsRecord {
  year: string
  month: string | null
  title: string | null
  content: string
  image_url: string | null
  is_visible: boolean
  display_order: number
}

export interface JoinInfoRow extends CmsRecord {
  title: string | null
  description: string | null
  target: string | null
  parts: string | null
  audition_process: string | null
  preparation: string | null
  rehearsal_time: string | null
  rehearsal_location: string | null
  application_url: string | null
  is_visible: boolean
}

export interface FaqRow extends CmsRecord {
  question: string
  answer: string | null
  category: string | null
  display_order: number
  is_visible: boolean
}

export interface ContactRow extends CmsRecord {
  name: string
  email: string
  phone: string | null
  type: 'join' | 'concert_request' | 'support' | 'general'
  title: string | null
  message: string
  privacy_agreed: boolean
  status: 'new' | 'in_progress' | 'done'
  created_at: string
}

export interface CmsRowsByTable {
  site_settings: SiteSettingsRow
  about_sections: AboutSectionRow
  hero_slides: HeroSlideRow
  locations: LocationRow
  conductor: PersonProfileRow
  accompanist: PersonProfileRow
  members: MemberRow
  concerts: ConcertRow
  notices: NoticeRow
  gallery: GalleryRow
  videos: VideoRow
  posters: PosterRow
  history: HistoryRow
  join_info: JoinInfoRow
  faq: FaqRow
  contacts: ContactRow
}

export type CmsRowFor<TTable extends CmsTableName> = CmsRowsByTable[TTable]

export type CmsResult<TData> =
  | { data: TData; error: null }
  | { data: null; error: string }
