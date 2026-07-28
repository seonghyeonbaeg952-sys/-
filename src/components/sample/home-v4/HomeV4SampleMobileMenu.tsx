import { useState } from 'react'

type HomeV4SampleMobileMenuProps = {
  id: string
  onNavigate: () => void
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
      { href: '/sample/about', label: '합창단 소개' },
      { href: '/sample/spirit', label: '합창단 정신' },
      { href: '/sample/about?section=conductor', label: '지휘자' },
      { href: '/sample/about?section=accompanist', label: '반주자' },
      { href: '/sample/about?section=members', label: '단원 소개' },
    ],
  },
  {
    id: 'concerts',
    label: '공연·소식',
    links: [
      { href: '/sample/concerts', label: '공연 일정' },
      { href: '/sample/concerts?filter=upcoming', label: '예정 공연' },
      { href: '/sample/concerts?filter=past', label: '지난 공연' },
      { href: '/sample/notices', label: '공지사항' },
      { href: '/sample/notices?filter=important', label: '중요 공지' },
    ],
  },
  {
    id: 'gallery',
    label: '갤러리',
    links: [
      { href: '/sample/gallery?tab=photos', label: '사진' },
      { href: '/sample/gallery?tab=videos', label: '영상' },
      { href: '/sample/gallery?tab=posters', label: '포스터 아카이브' },
    ],
  },
  {
    id: 'join',
    label: '입단 안내',
    links: [
      { href: '/sample/join', label: '입단 안내 전체' },
      { href: '/sample/join?section=eligibility', label: '모집 대상' },
      { href: '/sample/join?section=process', label: '오디션·절차' },
      { href: '/sample/join?section=practice', label: '연습 안내' },
      { href: '/sample/join?section=faq', label: '자주 묻는 질문' },
      {
        href: '/sample/join?section=contact#application',
        label: '입단지원서 작성',
      },
    ],
  },
  {
    id: 'contact',
    label: '후원·문의',
    links: [
      { href: '/sample/contact?section=support', label: '후원 안내' },
      { href: '/sample/contact?section=sponsors', label: '후원사' },
      { href: '/sample/contact?section=performance', label: '문의' },
      { href: '/sample/contact?section=join', label: '입단지원서 작성' },
      { href: '/sample/contact?section=location', label: '오시는 길·지도' },
    ],
  },
]

export function HomeV4SampleMobileMenu({
  id,
  onNavigate,
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
          href="/sample/"
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
                  <a href={link.href} key={link.href} onClick={onNavigate}>
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
