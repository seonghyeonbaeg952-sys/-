export interface HomeV4ScoreValueFixture {
  id: string
  label: string
  description: string
  isVisible: boolean
  displayOrder: number
}

export interface HomeV4ScoreCtaFixture {
  label: string
  href: string
  emphasis: 'primary' | 'secondary'
}

export interface HomeV4ScoreFixture {
  eyebrow: string
  cover: {
    title: string
    subtitle?: string
    editionLabel?: string
  }
  spread: {
    leftTitle: string
    leftBody: string
    leftCallout?: string
    rightTitle: string
    rightBody: string
    rightCallout?: string
  }
  values: HomeV4ScoreValueFixture[]
  final: {
    title: string
    description: string
    ctas: HomeV4ScoreCtaFixture[]
  }
}

export interface HomeV4SpiritItemFixture {
  id: string
  label: string
  englishLabel: string
  homeSummary?: string
  body?: string
  fallbackSummary?: string
  isVisible: boolean
  displayOrder: number
}

export interface HomeV4SpiritFixture {
  eyebrow: string
  title: string
  description: string
  items: HomeV4SpiritItemFixture[]
  cta: {
    label: string
    href: string
  }
}

export type HomeV4ArchiveMediaKind = 'photo' | 'video' | 'poster'

export interface HomeV4ArchiveMediaFixture {
  id: string
  kind: HomeV4ArchiveMediaKind
  title: string
  description: string
  thumbnailUrl: string
  thumbnailAlt: string
  mediaUrl: string
  displayOrder: number
  isVisible: boolean
}

export interface HomeV4ArchiveFixture {
  eyebrow: string
  title: string
  description: string
  media: HomeV4ArchiveMediaFixture[]
  galleryHref?: string
  galleryLabel: string
  emptyMessage: string
}

export interface HomeV4SignatureFixture {
  score: HomeV4ScoreFixture
  spirit: HomeV4SpiritFixture
  archive: HomeV4ArchiveFixture
}
