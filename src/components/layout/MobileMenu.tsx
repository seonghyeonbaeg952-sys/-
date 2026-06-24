import { NavLink } from 'react-router'

import { Button } from '../common/Button'
import { Container } from '../common/Container'

type MobileMenuProps = {
  isOpen: boolean
  onNavigate: () => void
}

const menuGroups = [
  {
    items: [
      { href: '/about', label: '합창단 소개' },
      { href: '/about#history', label: '연혁' },
    ],
    title: '합창단',
  },
  {
    items: [
      { href: '/concerts', label: '공연·소식' },
      { href: '/notices', label: '공지사항' },
      { href: '/gallery', label: '갤러리' },
    ],
    title: '공연과 소식',
  },
  {
    items: [
      { href: '/join', label: '입단 안내' },
      { href: '/contact', label: '후원·문의' },
    ],
    title: '참여',
  },
]

export function MobileMenu({ isOpen, onNavigate }: MobileMenuProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="border-t border-line-default bg-bg-warm-white/98 shadow-header backdrop-blur lg:hidden"
      id="mobile-menu"
    >
      <Container className="max-h-[calc(100vh-72px)] overflow-y-auto py-5">
        <nav aria-label="모바일 방문자 메뉴" className="grid gap-5">
          <NavLink
            className={({ isActive }) =>
              [
                'min-h-12 rounded-button px-4 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                isActive
                  ? 'bg-bg-ivory text-gold-warm'
                  : 'text-navy-deep hover:bg-bg-ivory',
              ].join(' ')
            }
            onClick={onNavigate}
            to="/"
          >
            홈
          </NavLink>
          {menuGroups.map((group) => (
            <section className="rounded-card border border-line-default bg-bg-warm-white p-4" key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-warm">
                {group.title}
              </h2>
              <div className="mt-3 grid gap-1">
                {group.items.map((item) => (
                  <NavLink
                    className={({ isActive }) =>
                      [
                        'min-h-12 rounded-button px-3 py-3 text-base font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                        isActive
                          ? 'bg-bg-ivory text-gold-warm'
                          : 'text-navy-deep hover:bg-bg-ivory',
                      ].join(' ')
                    }
                    key={item.href}
                    onClick={onNavigate}
                    to={item.href}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
        <Button className="mt-5 w-full" href="/join" size="lg" variant="gold">
          입단 안내
        </Button>
      </Container>
    </div>
  )
}
