export type VisibilityNameDisplayType = 'full' | 'partial' | 'hidden'

export type MemberPart = 'soprano' | 'alto' | 'tenor' | 'bass' | 'other'

export type MemberGroupType =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'university'
  | 'staff'

export type MemberStatus = 'active' | 'alumni'

export type ConcertStatus = 'scheduled' | 'open' | 'closed' | 'cancelled'

export type NoticeCategory =
  | 'notice'
  | 'press'
  | 'news'
  | 'join'
  | 'concert'
  | 'rehearsal'

export type GalleryCategory = 'concert' | 'practice' | 'event' | 'archive'

export type ContactMessageStatus = 'new' | 'reviewing' | 'answered' | 'archived'

export type ISODateTime = string

export interface SiteSettings {
  id: string
  site_title: string
  hero_title: string
  hero_subtitle: string
  home_hero_eyebrow: string
  home_hero_description: string
  home_info_card_1_title: string
  home_info_card_1_description: string
  home_info_card_2_title: string
  home_info_card_2_description: string
  home_info_card_3_title: string
  home_info_card_3_description: string
  home_about_title: string
  home_about_button_label: string
  home_concerts_title: string
  home_concerts_description: string
  home_concerts_button_label: string
  home_notices_title: string
  home_notices_description: string
  home_notices_button_label: string
  home_gallery_title: string
  home_gallery_description: string
  home_gallery_button_label: string
  home_join_title: string
  home_join_button_label: string
  home_support_title: string
  home_support_button_label: string
  about_summary: string
  support_text: string
  join_cta_text: string
  email: string
  phone: string
  fax?: string
  address: string
  instagram_url: string
  youtube_url: string
  updated_at: ISODateTime
}

export interface SupportSettings {
  id: string
  title: string
  subtitle: string
  description: string
  message: string
  individual_amounts: number[]
  corporate_amounts: number[]
  allow_custom_amount: boolean
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  bank_note: string
  enable_online_submission: boolean
  form_note: string
  privacy_notice: string
  print_note: string
  print_button_label: string
  submit_button_label: string
  success_message: string
  contact_phone: string
  contact_email: string
  homepage_url: string
  organization_name: string
  footer_note: string
  is_visible: boolean
  updated_at: ISODateTime
}

export type SponsorCategory =
  | 'corporate'
  | 'church'
  | 'institution'
  | 'foundation'
  | 'individual'
  | 'media'
  | 'other'

export type SponsorTier =
  | 'main'
  | 'education'
  | 'performance'
  | 'partner'
  | 'in_kind'
  | 'supporter'

export interface Sponsor {
  id: string
  name: string
  display_name: string
  category: SponsorCategory
  tier: SponsorTier
  description: string
  logo_url: string
  website_url: string
  show_on_home: boolean
  show_on_support: boolean
  show_on_footer: boolean
  display_order: number
  is_visible: boolean
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

export interface PopupNotice {
  id: string
  title: string
  content: string
  image_url: string
  image_alt: string
  button_label: string
  button_href: string
  starts_on?: string
  ends_on?: string
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
  member_status: MemberStatus
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
  image_url?: string
  image_alt?: string
  image_caption?: string
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
  concert_id?: string
  description: string
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
  concert_date?: string
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
