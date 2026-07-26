export const HOME_CONTENT_VERSION = 2 as const

export type HomeContentSectionId =
  | 'heroSupplement'
  | 'quickActions'
  | 'about'
  | 'choirProgram'
  | 'joinLetter'
  | 'concertProgram'
  | 'scoreBook'
  | 'spiritWrapper'
  | 'archive'
  | 'sponsors'
  | 'supportLetter'

export type HomeContentInputType =
  | 'boolean'
  | 'number'
  | 'text'
  | 'textarea'

export type HomeQuickActionId = 'join' | 'concert' | 'support'

export type HomeQuickActionItem = {
  /**
   * The id, visual code and route are design/application contracts.
   * They are intentionally not editable site-text fields.
   */
  code: 'CONNECT' | 'JOIN' | 'STAGE'
  ctaLabel: string
  description: string
  displayOrder: number
  href:
    | '/concerts'
    | '/contact?section=support#form'
    | '/join'
  id: HomeQuickActionId
  isVisible: boolean
  title: string
}

export type HomeProgramItem = {
  description: string
  displayOrder: number
  id: 'foundation' | 'education' | 'performance' | 'growth'
  isVisible: boolean
  title: string
}

export type HomeScoreValueItem = {
  description: string
  displayOrder: number
  id: 'voice' | 'score' | 'part' | 'ensemble' | 'stage' | 'guide'
  isVisible: boolean
  label: string
}

export type HomeScoreBookContent = {
  cover: {
    brandLabel: string
    titleLines: string[]
  }
  eyebrowKo: string
  final: {
    primaryCtaLabel: string
    secondaryCtaLabel: string
    summary: string
    titleLines: string[]
  }
  leftPage: {
    body: string
    calloutBody: string
    calloutTitle: string
    keywords: string
    titleLines: string[]
  }
  rightPage: {
    body: string
    calloutBody: string
    calloutTitle: string
    keywords: string
    prefix: string
    titleLines: string[]
  }
  valueItems: HomeScoreValueItem[]
}

export interface HomeContentV2 {
  about: {
    ctaLabel: string
    eyebrowEn: string
    eyebrowKo: string
    globalDescription: string
    globalTagline: string
    paragraphs: string[]
    title: string
  }
  archive: {
    collapseLabel: string
    ctaLabel: string
    description: string
    emptyDescription: string
    emptyTitle: string
    expandLabel: string
    eyebrowEn: string
    eyebrowKo: string
    title: string
  }
  choirProgram: {
    eyebrowEn: string
    eyebrowKo: string
    items: HomeProgramItem[]
    title: string
  }
  concertProgram: {
    concertsCtaLabel: string
    description: string
    detailCtaLabel: string
    emptyConcertCtaLabel: string
    emptyConcertDescription: string
    emptyConcertTitle: string
    emptyNoticeCtaLabel: string
    emptyNoticeDescription: string
    emptyNoticeTitle: string
    eyebrowEn: string
    eyebrowKo: string
    inquiryCtaLabel: string
    noticePanelCtaLabel: string
    noticePanelTitle: string
    noticesCtaLabel: string
    title: string
  }
  heroSupplement: {
    fallbackDescription: string
    mottoChips: [string, string, string]
  }
  joinLetter: {
    ctaLabel: string
    description: string
    eyebrowEn: string
    eyebrowKo: string
    title: string
  }
  quickActions: {
    items: HomeQuickActionItem[]
  }
  scoreBook: HomeScoreBookContent
  sponsors: {
    ctaLabel: string
    description: string
    eyebrow: string
    title: string
  }
  spiritWrapper: {
    ctaLabel: string
    eyebrowKo: string
    title: string
  }
  supportLetter: {
    description: string
    eyebrowEn: string
    eyebrowKo: string
    pledgeDescription: string
    pledgeEyebrow: string
    pledgeTitle: string
    primaryCtaLabel: string
    secondaryCtaLabel: string
    title: string
  }
  version: typeof HOME_CONTENT_VERSION
}

export type HomeContentFlatRecord = Record<string, string>

export type HomeContentSource =
  | HomeContentV2
  | Record<string, unknown>
  | null
  | undefined

export type HomeContentManagedElsewhere = {
  adminHref: string
  description: string
  label: string
  source:
    | 'about_sections'
    | 'concerts'
    | 'gallery'
    | 'hero_slides'
    | 'join_info'
    | 'notices'
    | 'posters'
    | 'site_settings'
    | 'sponsors'
    | 'support_settings'
    | 'videos'
}

export type HomeContentSectionDefinition = {
  description: string
  id: HomeContentSectionId
  managedElsewhere?: HomeContentManagedElsewhere[]
  publicOrder: number
  title: string
}

export type HomeContentSiteTextDefinition = {
  defaultValue: string
  description: string
  inputType: HomeContentInputType
  key: string
  label: string
  maxLength?: number
  min?: number
  max?: number
  sectionId: HomeContentSectionId
  sortOrder: number
}

export type HomeContentDeprecatedPolicy =
  | 'deactivate'
  | 'fixed_design_label'
  | 'managed_elsewhere'
  | 'migrate'

export type HomeContentDeprecatedKeyDefinition = {
  /**
   * A replacement is populated only when it is empty. Legacy rows remain
   * available for rollback and are deactivated after the V2 consumers ship.
   */
  replacementKey?: string
  policy: HomeContentDeprecatedPolicy
  reason: string
}
