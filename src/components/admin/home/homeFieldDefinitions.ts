import {
  HOME_CONTENT_DEPRECATED_KEYS,
  HOME_CONTENT_V2_KEYS,
  homeContentSectionDefinitions,
  homeContentSiteTextDefinitions,
} from '../../../constants/homeContentV2'

export const homeFieldDefinitions = homeContentSiteTextDefinitions
export const homeFieldSections = homeContentSectionDefinitions
export const homePublicConsumerKeys = HOME_CONTENT_V2_KEYS
export const homeDeprecatedKeyPolicies = HOME_CONTENT_DEPRECATED_KEYS

export const homeFixedDesignLabels = [
  'ARCHIVE BOOK',
  'DATE',
  'FIVE MOVEMENTS',
  'MOTET SCORE',
  'NEXT STAGE',
  'PLACE',
  'PROGRAM',
  'PROGRAM NOTE',
  'S · A',
  'T · B',
  'TIME',
  'VOICE',
] as const

export const homeManagedElsewhereSources = [
  'about_sections',
  'concerts',
  'gallery',
  'hero_slides',
  'join_info',
  'notices',
  'posters',
  'site_settings',
  'sponsors',
  'support_settings',
  'videos',
] as const
