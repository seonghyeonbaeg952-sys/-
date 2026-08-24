import { useState } from 'react'

type HomeV4SampleMobileMenuProps = {
  id: string
  onNavigate: () => void
  routePrefix?: string
}

type MobileMenuLink = {
  href: string
  label: string
}

type MobileMenuSection = {
  id: string
  label: string
  links: MobileMenuLink[]
}

const mobileMenuSections: MobileMenuSection[] = [
  {
    id: 'about',
    label: '합창단 소개',
    links: [
      { href: '/about', label: '합창단 소개' },
      { href: '/spirit', label: '합창단 정신' },
      { href: '/about?section=conductor', label: '지휘자' },
      { href: '/about?section=accompanist', label: '반주자' },
      { href: '/about?section=members', label: '단원 소개' },
    ],
  },
  {
    id: 'concerts',
    label: '공연·소식',
    links: [
      { href: '/concerts', label: '공연 일정' },
      { href: '/concerts?filter=upcoming', label: '예정 공연' },
      { href: '/concerts?filter=past', label: '지난 공연' },
      { href: '/notices', label: '공지사항' },
      { href: '/notices?filter=important', label: '중요 공지' },
    ],
  },
  {
    id: 'gallery',
    label: '갤러리',
    links: [
      { href: '/gallery?tab=photos', label: '사진' },
      { href: '/gallery?tab=videos', label: '영상' },
      { href: '/gallery?tab=posters', label: '포스터 아카이브' },
    ],
  },
  {
    id: 'join',
    label: '입단 안내',
    links: [
      { href: '/join', label: '입단 안내 전체' },
      { href: '/join?section=eligibility', label: '모집 대상' },
      { href: '/join?section=process', label: '오디션·절차' },
      { href: '/join?section=practice', label: '연습 안내' },
      { href: '/join?section=faq', label: '자주 묻는 질문' },
      {
        href: '/join?section=contact#application',
        label: '입단지원서 작성',
      },
    ],
  },
  {
    id: 'contact',
    label: '후원·문의',
    links: [
      { href: '/contact?section=support', label: '후원 안내' },
      { href: '/contact?section=sponsors', label: '후원사' },
      { href: '/contact?section=performance', label: '문의' },
      { href: '/contact?section=join', label: '입단지원서 작성' },
      { href: '/contact?section=location', label: '오시는 길·지도' },
    ],
  },
]

export function HomeV4SampleMobileMenu({
  id,
  onNavigate,
  routePrefix = '/sample',
}: HomeV4SampleMobileMenuProps) {
  const [expandedSectionId, setExpandedSectionId] = useState<string>('about')

  const toggleSection = (sectionId: string) => {
    setExpandedSectionId((currentId) =>
      currentId === sectionId ? '' : sectionId,
    )
  }

  return (
    <div className="home-v4-mobile-menu" id={id}>
      <nav aria-label="모바일 주요 메뉴">
        <a
          className="home-v4-mobile-menu__row is-active"
          href={routePrefix ? `${routePrefix}/home-v4` : '/'}
          onClick={onNavigate}
        >
          <span>홈</span>
          <span aria-hidden="true">→</span>
        </a>

        {mobileMenuSections.map((section) => {
          const isExpanded = expandedSectionId === section.id
          const accordionId = `${id}-${section.id}`

          return (
            <div className="home-v4-mobile-menu__section" key={section.id}>
              <button
                aria-controls={accordionId}
                aria-expanded={isExpanded}
                className="home-v4-mobile-menu__row"
                onClick={() => toggleSection(section.id)}
                type="button"
              >
                <span>{section.label}</span>
                <span
                  aria-hidden="true"
                  className="home-v4-mobile-menu__indicator"
                >
                  {isExpanded ? '−' : '+'}
                </span>
              </button>
              <div
                className="home-v4-mobile-menu__accordion"
                data-expanded={isExpanded}
                id={accordionId}
              >
                {section.links.map((link) => (
                  <a
                    href={`${routePrefix}${link.href}`}
                    key={link.href}
                    onClick={onNavigate}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </nav>
    </div>
  )
}
