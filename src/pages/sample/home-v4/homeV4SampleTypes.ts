export type HomeV4TailMode = 'light' | 'dark'

export type HomeV4ScenarioMode =
  | 'normal'
  | 'long-copy'
  | 'empty-data'
  | 'reduced-motion'

export type HomeV4DataMode = 'fixture' | 'live'

export type HomeV4QuickActionFixture = {
  code: string
  title: string
  description: string
  href: string
  isVisible: boolean
  displayOrder: number
}

export type HomeV4AboutFactFixture = {
  label: string
  value: string
  isVisible: boolean
  displayOrder: number
}

export type HomeV4AboutFixture = {
  eyebrow: string
  title: string
  paragraphs: string[]
  ctaLabel: string
  ctaHref: string
  imageUrl?: string
  imageAlt?: string
  facts: HomeV4AboutFactFixture[]
}

export type HomeV4ProgramItemFixture = {
  number: string
  title: string
  description: string
  isVisible: boolean
  displayOrder: number
}

export type HomeV4SampleFixture = {
  quickActions: HomeV4QuickActionFixture[]
  about: HomeV4AboutFixture
  programItems: HomeV4ProgramItemFixture[]
}
