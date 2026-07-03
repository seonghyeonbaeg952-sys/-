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
  | 'support_settings'
  | 'about_sections'
  | 'hero_slides'
  | 'popup_notices'
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
  | 'support_pledges'
  | 'sponsors'
  | 'site_texts'
  | 'join_applications'

export interface SiteSettingsRow extends CmsRecord {
  site_title: string | null
  hero_title: string | null
  hero_subtitle: string | null
  home_hero_eyebrow?: string | null
  home_hero_description?: string | null
  home_info_card_1_title?: string | null
  home_info_card_1_description?: string | null
  home_info_card_2_title?: string | null
  home_info_card_2_description?: string | null
  home_info_card_3_title?: string | null
  home_info_card_3_description?: string | null
  home_about_title?: string | null
  home_about_button_label?: string | null
  home_concerts_title?: string | null
  home_concerts_description?: string | null
  home_concerts_button_label?: string | null
  home_notices_title?: string | null
  home_notices_description?: string | null
  home_notices_button_label?: string | null
  home_gallery_title?: string | null
  home_gallery_description?: string | null
  home_gallery_button_label?: string | null
  home_join_title?: string | null
  home_join_button_label?: string | null
  home_support_title?: string | null
  home_support_button_label?: string | null
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

export interface SupportSettingsRow extends CmsRecord {
  title: string | null
  subtitle: string | null
  description: string | null
  message: string | null
  individual_amounts: string | null
  corporate_amounts: string | null
  allow_custom_amount: boolean
  bank_name: string | null
  bank_account_number: string | null
  bank_account_holder: string | null
  bank_note: string | null
  enable_online_submission: boolean
  form_note: string | null
  privacy_notice: string | null
  print_note: string | null
  print_button_label: string | null
  submit_button_label: string | null
  success_message: string | null
  contact_phone: string | null
  contact_email: string | null
  homepage_url: string | null
  organization_name: string | null
  footer_note: string | null
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

export interface PopupNoticeRow extends CmsRecord {
  title: string
  content: string | null
  image_url: string | null
  image_alt: string | null
  button_label: string | null
  button_href: string | null
  starts_on: string | null
  ends_on: string | null
  display_order: number
  is_visible: boolean
}

export interface LocationRow extends CmsRecord {
  place_name: string | null
  address: string | null
  email?: string | null
  fax?: string | null
  map_embed_url?: string | null
  image_url?: string | null
  image_alt?: string | null
  image_caption?: string | null
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
  profile_image_alt?: string | null
  description: string | null
  profile_summary?: string | null
  profile_highlight?: string | null
  hero_quote?: string | null
  bio: string | null
  current_roles?: string | null
  education_items?: string | null
  career_items?: string | null
  awards_items?: string | null
  activities_items?: string | null
  philosophy_title?: string | null
  philosophy_body?: string | null
  philosophy_quote?: string | null
  teaching_principles?: string | null
  message: string | null
  message_title?: string | null
  message_body?: string | null
  activity_images?: string | null
  is_featured?: boolean | null
  is_visible: boolean
}

export interface MemberRow extends CmsRecord {
  name: string | null
  part: 'soprano' | 'alto' | 'tenor' | 'bass' | 'other'
  group_type: 'elementary' | 'middle' | 'high' | 'university' | 'staff' | 'alumni'
  member_status?: 'active' | 'alumni'
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

export interface SiteTextRow extends CmsRecord {
  key: string
  page?: string | null
  section?: string | null
  group_name?: string | null
  label: string | null
  value: string | null
  default_value?: string | null
  value_type?: 'text' | 'textarea' | 'markdown'
  input_type?: 'label' | 'text' | 'textarea' | 'url'
  description: string | null
  sort_order: number
  is_active: boolean
  updated_at?: string
  updated_by?: string | null
}

export type JoinApplicationStatus =
  | 'accepted'
  | 'archived'
  | 'in_review'
  | 'new'
  | 'rejected'

export interface JoinApplicationRow extends CmsRecord {
  admin_notes: string | null
  applicant_name: string
  applicant_phone: string
  awards: string | null
  birth_date: string | null
  choir_experience: 'no' | 'yes' | null
  contact_time: string | null
  desired_part: string | null
  email: string
  gender: string | null
  grade: string | null
  guardian_name: string | null
  guardian_phone: string | null
  is_archived: boolean
  lesson_experience: 'no' | 'yes' | null
  motivation: string | null
  music_experience: string | null
  photo_file_path: string | null
  privacy_agreed: boolean
  recommendation_file_path: string | null
  recommender_affiliation: string | null
  recommender_name: string | null
  recommender_reason: string | null
  region: string | null
  school: string | null
  status: JoinApplicationStatus
  vision: string | null
  created_at: string
}

export interface SupportPledgeRow extends CmsRecord {
  name: string
  gender: 'female' | 'male' | 'none' | null
  birth_date: string | null
  phone: string
  email: string
  address: string | null
  member_type: 'corporate' | 'individual'
  amount: number
  custom_amount: number | null
  depositor: string | null
  pledge_date: string | null
  signature_image_url: string | null
  signer_name: string | null
  privacy_agreed: boolean
  status: 'new' | 'in_progress' | 'done'
  created_at: string
}

export interface SponsorRow extends CmsRecord {
  name: string
  display_name: string | null
  category:
    | 'corporate'
    | 'church'
    | 'institution'
    | 'foundation'
    | 'individual'
    | 'media'
    | 'other'
  tier:
    | 'main'
    | 'education'
    | 'performance'
    | 'partner'
    | 'in_kind'
    | 'supporter'
  description: string | null
  logo_url: string | null
  website_url: string | null
  start_date: string | null
  end_date: string | null
  is_visible: boolean
  consent_public: boolean
  show_on_home: boolean
  show_on_support: boolean
  show_on_footer: boolean
  display_order: number
  internal_notes: string | null
  created_at: string
  updated_at?: string
}

export interface CmsRowsByTable {
  site_settings: SiteSettingsRow
  support_settings: SupportSettingsRow
  about_sections: AboutSectionRow
  hero_slides: HeroSlideRow
  popup_notices: PopupNoticeRow
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
  support_pledges: SupportPledgeRow
  sponsors: SponsorRow
  site_texts: SiteTextRow
  join_applications: JoinApplicationRow
}

export type CmsRowFor<TTable extends CmsTableName> = CmsRowsByTable[TTable]

export type CmsResult<TData> =
  | { data: TData; error: null }
  | { data: null; error: string }
