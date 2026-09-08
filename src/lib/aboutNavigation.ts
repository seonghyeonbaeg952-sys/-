export type AboutSectionKey =
  | 'all'
  | 'overview'
  | 'conductor'
  | 'accompanist'
  | 'members'
  | 'history'

export const aboutSectionTabs: Array<{
  href: string
  label: string
  value: AboutSectionKey
}> = [
  { href: '/about?section=all', label: '전체', value: 'all' },
  { href: '/about?section=overview', label: '합창단 소개', value: 'overview' },
  { href: '/about?section=conductor', label: '지휘자 소개', value: 'conductor' },
  { href: '/about?section=accompanist', label: '반주자 소개', value: 'accompanist' },
  { href: '/about?section=members', label: '단원 소개', value: 'members' },
  { href: '/about?section=history', label: '연혁', value: 'history' },
]

const aboutSectionValues = new Set<AboutSectionKey>(
  aboutSectionTabs.map((section) => section.value),
)

function getActiveAboutSection(value: string | null): AboutSectionKey {
  if (!value) {
    return 'overview'
  }

  if (value === 'spirit') {
    return 'overview'
  }

  return aboutSectionValues.has(value as AboutSectionKey)
    ? (value as AboutSectionKey)
    : 'overview'
}

export function resolveAboutSectionView(value: string | null) {
  const activeSection = getActiveAboutSection(value)
  const isOverviewSelection =
    activeSection === 'all' || activeSection === 'overview'

  return {
    activeSection,
    shouldShowOverview: isOverviewSelection,
    shouldShowSpirit: isOverviewSelection,
  }
}
