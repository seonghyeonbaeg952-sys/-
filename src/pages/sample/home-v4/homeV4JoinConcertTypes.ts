export type HomeV4JoinCtaFixture = {
  emphasis: 'primary' | 'secondary'
  href: string
  label: string
}

export type HomeV4JoinFactFixture = {
  id: string
  isVisible: boolean
  label: string
  lines: string[]
}

export type HomeV4JoinStepFixture = {
  description: string
  displayOrder: number
  id: string
  isVisible: boolean
  mobileDescription: string
  title: string
}

export type HomeV4JoinGuardianItemFixture = {
  id: string
  isVisible: boolean
  text: string
}

export type HomeV4JoinFixture = {
  ctas: HomeV4JoinCtaFixture[]
  description: string
  eyebrow: string
  facts: HomeV4JoinFactFixture[]
  guardianItems: HomeV4JoinGuardianItemFixture[]
  guardianTitle: string
  processTitle: string
  steps: HomeV4JoinStepFixture[]
  title: string
}

export type HomeV4ConcertStatus = 'upcoming' | 'completed' | 'preparing'

export type HomeV4ConcertActionFixture = {
  emphasis: 'primary' | 'secondary' | 'text'
  href: string
  label: string
}

export type HomeV4ConcertProgrammeItemFixture = {
  id: string
  label: string
}

export type HomeV4ConcertNoticeFixture = {
  href: string
  label: string
  lines: string[]
}

export type HomeV4ConcertFixture = {
  actions: HomeV4ConcertActionFixture[]
  date: string
  eyebrow: string
  noteBody: string
  noteDetail: string
  noteSummary: string
  notice?: HomeV4ConcertNoticeFixture
  posterAlt?: string
  posterUrl?: string
  programmeItems: HomeV4ConcertProgrammeItemFixture[]
  programmeTitle: string
  sectionTitle: string
  status: HomeV4ConcertStatus
  summary: string
  time: string
  title: string
  venue: string
}

export type HomeV4ConcertEmptyFixture = {
  actions: HomeV4ConcertActionFixture[]
  description: string
  eyebrow: string
  title: string
}

export type HomeV4JoinConcertFixture = {
  concert: HomeV4ConcertFixture | null
  concertEmpty: HomeV4ConcertEmptyFixture
  join: HomeV4JoinFixture
}
