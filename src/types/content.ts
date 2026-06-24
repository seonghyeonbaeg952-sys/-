export type VisibilityNameDisplayType = 'full' | 'partial' | 'hidden'

export type MemberPart = 'soprano' | 'alto' | 'tenor' | 'bass' | 'other'

export type MemberGroupType =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'alumni'
  | 'other'

export type ConcertStatus = 'scheduled' | 'open' | 'closed' | 'cancelled'

export type NoticeCategory = 'notice' | 'press' | 'news'

export type GalleryCategory = 'concert' | 'practice' | 'event' | 'archive'

export type ContactMessageStatus = 'new' | 'reviewing' | 'answered' | 'archived'

export type ISODateTime = string

export interface SiteSettings {
  id: string
  site_title: string
  hero_title: string
  hero_subtitle: string
  about_summary: string
  email: string
  phone: string
  fax?: string
  address: string
  instagram_url: string
  youtube_url: string
  updated_at: ISODateTime
}

export interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image_url: string
  image_alt: string
  primary_cta_label: string
  primary_cta_href: string
  secondary_cta_label: string
  secondary_cta_href: string
  display_order: number
  is_visible: boolean
}

export interface Conductor {
  id: string
  name: string
  title: string
  photo_url: string
  bio: string
  is_visible: boolean
  display_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Accompanist {
  id: string
  name: string
  title: string
  photo_url: string
  bio: string
  is_visible: boolean
  display_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Member {
  id: string
  name: string
  part: MemberPart
  group_type: MemberGroupType
  photo_url: string
  description: string
  is_visible: boolean
  name_display_type: VisibilityNameDisplayType
  display_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface HistoryItem {
  id: string
  year: number
  date?: string
  title: string
  description?: string
  is_visible: boolean
  display_order: number
}

export interface LocationInfo {
  id: string
  address: string
  detail_address?: string
  phone: string
  fax?: string
  map_embed_url?: string
  map_url?: string
  naver_map_url?: string
  kakao_map_url?: string
  transportation?: string
  is_visible: boolean
  updated_at: ISODateTime
}

export interface Concert {
  id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  poster_url: string
  description: string
  program: string[]
  performers: string[]
  ticket_url: string
  apply_url: string
  status: ConcertStatus
  is_visible: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Notice {
  id: string
  title: string
  category: NoticeCategory
  content: string
  cover_image_url: string
  is_important: boolean
  is_visible: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface GalleryImage {
  id: string
  title: string
  category: GalleryCategory
  image_url: string
  image_alt: string
  taken_at?: string
  is_visible: boolean
  display_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface VideoItem {
  id: string
  title: string
  provider: 'youtube' | 'vimeo' | 'other'
  video_url: string
  thumbnail_url: string
  description: string
  is_visible: boolean
  display_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface Poster {
  id: string
  title: string
  image_url: string
  concert_id?: string
  is_visible: boolean
  display_order: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface JoinInfo {
  id: string
  title: string
  summary: string
  eligibility: string[]
  process: string[]
  contact_email: string
  contact_phone: string
  is_visible: boolean
  updated_at: ISODateTime
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  is_visible: boolean
  display_order: number
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: ContactMessageStatus
  created_at: ISODateTime
}
