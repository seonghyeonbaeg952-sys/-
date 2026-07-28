import type { MouseEventHandler } from 'react'

import type { PublicNavigationItem } from '../../../constants/navigation'

type HomeV4SampleMegaMenuProps = {
  id: string
  item: PublicNavigationItem
  onMouseEnter: MouseEventHandler<HTMLElement>
  onMouseLeave: MouseEventHandler<HTMLElement>
  onNavigate: () => void
}

type MegaMenuLink = {
  href: string
  label: string
}

type MegaMenuGroup = {
  code: string
  description?: string
  label: string
  links: MegaMenuLink[]
}

const toSampleHref = (href: string) =>
  href.startsWith('/') ? `/sample${href}` : href

const aboutMenuGroups: MegaMenuGroup[] = [
  {
    code: '01',
    label: '합창단 소개',
    links: [
      { href: '/about', label: '합창단 소개' },
      { href: '/about?section=conductor', label: '지휘자·반주자' },
      { href: '/about?section=members', label: '단원 소개' },
      { href: '/about?section=history', label: '연혁과 활동' },
    ],
  },
  {
    code: '02',
    label: '모테트 정신',
    links: [
      { href: '/spirit', label: '정직한 음악' },
      { href: '/spirit', label: '교회음악의 바른 이상' },
      { href: '/spirit', label: '다음 세대 교육' },
      { href: '/spirit', label: '함께 부르는 공동체' },
    ],
  },
  {
    code: '03',
    label: '활동과 기록',
    links: [
      { href: '/concerts', label: '공연 일정' },
      { href: '/notices', label: '공연 소식' },
      { href: '/gallery', label: '갤러리' },
      { href: '/contact', label: '후원·문의' },
    ],
  },
]

const spiritMenuGroups: MegaMenuGroup[] = [
  {
    code: '01',
    label: '합창단 정신',
    links: [{ href: '/spirit', label: '합창단 정신 전체 보기' }],
  },
  {
    code: '02',
    label: '핵심 가치',
    links: [
      { href: '/spirit', label: '정직한 음악' },
      { href: '/spirit', label: '교회음악의 바른 이상' },
    ],
  },
  {
    code: '03',
    label: '교육 방향',
    links: [
      { href: '/spirit', label: '다음 세대 교육' },
      { href: '/spirit', label: '함께 부르는 공동체' },
    ],
  },
]

const contextualGroupLabels: Record<string, [string, string, string]> = {
  '/spirit': ['합창단 정신', '핵심 가치', '교육 방향'],
  '/concerts': ['공연 안내', '일정과 기록', '공지와 소식'],
  '/gallery': ['갤러리', '사진과 영상', '포스터 기록'],
  '/join': ['입단 안내', '지원 준비', '절차와 문의'],
  '/contact': ['후원·문의', '후원 안내', '문의와 위치'],
}

export function HomeV4SampleMegaMenu({
  id,
  item,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
}: HomeV4SampleMegaMenuProps) {
  const hasMatchingChild = item.children?.some(
    (child) => child.href === item.href,
  )
  const sourceLinks = hasMatchingChild
    ? (item.children ?? [])
    : [item, ...(item.children ?? [])]
  const links = sourceLinks
    .filter(
      (link, index, source) =>
        source.findIndex((candidate) => candidate.href === link.href) === index,
    )
    .map((link) => ({ href: link.href, label: link.label }))
  const baseGroupSize = Math.floor(links.length / 3)
  const remainder = links.length % 3
  const groupSizes = [
    baseGroupSize + (remainder > 0 ? 1 : 0),
    baseGroupSize + (remainder > 1 ? 1 : 0),
    baseGroupSize,
  ]
  const groupOffsets = [
    0,
    groupSizes[0],
    groupSizes[0] + groupSizes[1],
    links.length,
  ]
  const labels = contextualGroupLabels[item.href] ?? [
    item.label,
    '핵심 안내',
    '관련 메뉴',
  ]
  const contextualMenuGroups: MegaMenuGroup[] = labels.map(
    (label, index) => ({
      code: `0${index + 1}`,
      label,
      links: links.slice(groupOffsets[index], groupOffsets[index + 1]),
    }),
  )
  const menuGroups =
    item.href === '/about'
      ? aboutMenuGroups
      : item.href === '/spirit'
        ? spiritMenuGroups
        : contextualMenuGroups

  return (
    <nav
      aria-label={`${item.label} 상세 메뉴`}
      className="home-v4-mega-menu"
      id={id}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="home-v4-mega-menu__inner">
        {menuGroups.map((group) => (
          <section
            aria-labelledby={`${id}-group-${group.code}`}
            className="home-v4-mega-menu__group"
            key={group.label}
          >
            <div className="home-v4-mega-menu__heading">
              <p className="home-v4-mega-menu__code">{group.code}</p>
              <h2
                className="home-v4-mega-menu__title"
                id={`${id}-group-${group.code}`}
              >
                {group.label}
              </h2>
            </div>
            {group.description ? (
              <p className="home-v4-mega-menu__description">
                {group.description}
              </p>
            ) : null}
            <ul>
              {group.links.map((link, linkIndex) => (
                <li key={`${link.href}-${link.label}`}>
                  <a
                    data-primary={
                      group.code === '01' && linkIndex === 0
                        ? 'true'
                        : undefined
                    }
                    href={toSampleHref(link.href)}
                    onClick={onNavigate}
                  >
                    <span>{link.label}</span>
                    <span aria-hidden="true" className="home-v4-mega-menu__arrow">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
