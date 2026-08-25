import type { HomeTitleAccent } from '../lib/homeTypography'

export const HOME_TITLE_ACCENTS = {
  about: [
    { term: '함께 빚어가는', role: 'quiet' },
    { term: '화음', role: 'emphasis' },
    { term: '다음 세대의', role: 'quiet' },
    { term: '노래', role: 'emphasis' },
  ],
  archive: [],
  join: [],
  performance: [],
} as const satisfies Record<string, readonly HomeTitleAccent[]>

export const HOME_TITLE_LINE_ROLES = {
  archive: ['quiet', 'emphasis', 'ornament'],
  join: ['quiet', 'base', 'emphasis'],
} as const
