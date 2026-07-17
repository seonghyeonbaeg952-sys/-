import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import { publicNavigation } from '../../constants/navigation'
import { BrandLogo } from '../common/BrandLogo'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { MegaMenu } from './MegaMenu'
import { MobileMenu } from './MobileMenu'

const MEGA_MENU_ID = 'desktop-mega-menu'

export function Header() {
  const location = useLocation()
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeMegaMenuHref, setActiveMegaMenuHref] = useState<string | null>(null)
  const isHome =
    location.pathname === '/' || location.pathname === '/home-section-flow-sample'
  const isTransparent = isHome && !isScrolled && !isMenuOpen
  const activeMegaMenuItem =
    publicNavigation.find((item) => item.href === activeMegaMenuHref) ?? null

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 12)

    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrolled)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMenuOpen) {
          event.preventDefault()
          window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
        }

        setIsMenuOpen(false)
        setActiveMegaMenuHref(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const mutedColor = isTransparent ? 'text-bg-ivory/82' : 'text-text-muted'
  const accentColor = isTransparent ? 'text-gold-soft' : 'text-gold-ink'
  const accentInteractionColor = isTransparent
    ? 'hover:text-gold-soft focus-visible:outline-gold-soft'
    : 'hover:text-gold-ink focus-visible:outline-gold-ink'
  const focusOutlineColor = isTransparent
    ? 'focus-visible:outline-gold-soft'
    : 'focus-visible:outline-gold-ink'

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition duration-300',
        isTransparent
          ? 'border-b border-transparent bg-navy-midnight/12 shadow-none'
          : 'border-b border-line-default/80 bg-bg-warm-white/96 shadow-header backdrop-blur',
      ].join(' ')}
      onBlur={(event) => {
        const nextFocus = event.relatedTarget

        if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
          setActiveMegaMenuHref(null)
        }
      }}
      onMouseLeave={() => setActiveMegaMenuHref(null)}
    >
      <Container className="flex min-h-[72px] items-center justify-between gap-3 sm:gap-4">
        <NavLink
          aria-label="홈으로 이동"
          className={`inline-flex min-h-[44px] min-w-[44px] max-w-[calc(100%-3.5rem)] shrink items-center justify-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ${focusOutlineColor}`}
          onClick={() => setIsMenuOpen(false)}
          to="/"
        >
          <span className="hidden md:block">
            <BrandLogo
              brand="smyc"
              className={
                isTransparent
                  ? 'overflow-hidden md:max-w-[92px] lg:max-w-[112px]'
                  : 'overflow-hidden md:max-w-[190px] lg:max-w-[220px] xl:max-w-[270px]'
              }
              size="lg"
              theme={isTransparent ? 'dark' : 'light'}
              variant={isTransparent ? 'symbol' : 'full'}
              withSurface={false}
            />
          </span>
          <span className="block md:hidden">
            <BrandLogo
              brand="smyc"
              className="max-w-[58px] overflow-hidden"
              size="sm"
              theme={isTransparent ? 'dark' : 'light'}
              variant="symbol"
              withSurface={false}
            />
          </span>
        </NavLink>

        <nav aria-label="방문자 메뉴" className="hidden items-center gap-[clamp(18px,1.6vw,28px)] lg:flex">
          {publicNavigation.map((item) => {
            const hasChildren = Boolean(item.children?.length)
            const isMegaMenuOpen = activeMegaMenuHref === item.href
            const isHomeNavigationItem = isHome && item.href === '/'

            return (
              <NavLink
                aria-controls={hasChildren ? MEGA_MENU_ID : undefined}
                aria-expanded={hasChildren ? isMegaMenuOpen : undefined}
                aria-haspopup={hasChildren ? 'true' : undefined}
                className={({ isActive }) =>
                  [
                    'group relative flex min-h-11 items-center whitespace-nowrap rounded-pill px-1 py-2 text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 xl:text-sm',
                    accentInteractionColor,
                    isActive || isHomeNavigationItem || isMegaMenuOpen
                      ? accentColor
                      : mutedColor,
                  ].join(' ')
                }
                key={item.href}
                onClick={() => setActiveMegaMenuHref(null)}
                onFocus={() => setActiveMegaMenuHref(hasChildren ? item.href : null)}
                onMouseEnter={() => setActiveMegaMenuHref(hasChildren ? item.href : null)}
                to={item.href}
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      aria-hidden="true"
                      className={[
                        'absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-warm transition-transform duration-200 group-hover:scale-x-100',
                        isActive || isHomeNavigationItem || isMegaMenuOpen
                          ? 'scale-x-100'
                          : '',
                      ].join(' ')}
                    />
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <Button
            className="shadow-none"
            focusTone={isTransparent ? 'dark' : 'light'}
            href="/join"
            showArrow={false}
            size="sm"
            variant="gold"
          >
            입단 안내
          </Button>
        </div>

        <button
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기'}
          className={[
            'inline-flex size-11 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden',
            focusOutlineColor,
            isTransparent
              ? 'border-bg-warm-white/85 bg-bg-warm-white/14 text-bg-warm-white shadow-[0_8px_24px_rgb(0_0_0/0.24)] backdrop-blur-sm'
              : 'border-line-default bg-bg-warm-white text-navy-deep',
          ].join(' ')}
          onClick={() => {
            setActiveMegaMenuHref(null)
            setIsMenuOpen((current) => !current)
          }}
          ref={mobileMenuButtonRef}
          type="button"
        >
          <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
            <span
              className={[
                'h-0.5 rounded-full bg-current transition',
                isMenuOpen ? 'translate-y-2 rotate-45' : '',
              ].join(' ')}
            />
            <span
              className={[
                'h-0.5 rounded-full bg-current transition',
                isMenuOpen ? 'opacity-0' : '',
              ].join(' ')}
            />
            <span
              className={[
                'h-0.5 rounded-full bg-current transition',
                isMenuOpen ? '-translate-y-2 -rotate-45' : '',
              ].join(' ')}
            />
          </span>
        </button>
      </Container>

      <MegaMenu
        id={MEGA_MENU_ID}
        item={activeMegaMenuItem}
        onNavigate={() => setActiveMegaMenuHref(null)}
      />
      <MobileMenu isOpen={isMenuOpen} onNavigate={() => setIsMenuOpen(false)} />
    </header>
  )
}
