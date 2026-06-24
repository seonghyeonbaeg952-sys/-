import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import { publicNavigation } from '../../constants/navigation'
import { BrandLogo } from '../common/BrandLogo'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { MobileMenu } from './MobileMenu'

export function Header() {
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isHome = location.pathname === '/'
  const isTransparent = isHome && !isScrolled && !isMenuOpen

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 12)

    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrolled)
    }
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const mutedColor = isTransparent ? 'text-bg-ivory/82' : 'text-text-muted'

  return (
    <header
      className={[
        'fixed inset-x-0 top-0 z-50 transition duration-300',
        isTransparent
          ? 'border-transparent bg-navy-midnight/20'
          : 'border-b border-line-default/80 bg-bg-warm-white/96 shadow-header backdrop-blur',
      ].join(' ')}
    >
      <Container className="flex min-h-[72px] items-center justify-between gap-3 sm:gap-5">
        <NavLink
          aria-label="홈으로 이동"
          className="min-w-0 max-w-[calc(100%-3.5rem)] shrink transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
          onClick={() => setIsMenuOpen(false)}
          to="/"
        >
          <span className="hidden md:block">
            <BrandLogo
              brand="smyc"
              className={
                isTransparent
                  ? 'overflow-hidden md:max-w-[92px] lg:max-w-[112px]'
                  : 'overflow-hidden md:max-w-[220px] lg:max-w-[280px]'
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

        <nav aria-label="방문자 메뉴" className="hidden items-center gap-7 lg:flex">
          {publicNavigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                [
                  'group relative rounded-pill px-1 py-2 text-sm font-medium transition hover:text-gold-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm',
                  isActive ? 'text-gold-warm' : mutedColor,
                ].join(' ')
              }
              key={item.href}
              to={item.href}
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={[
                      'absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-warm transition-transform duration-200 group-hover:scale-x-100',
                      isActive ? 'scale-x-100' : '',
                    ].join(' ')}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button href="/join" size="sm" variant="gold">
            입단 안내
          </Button>
        </div>

        <button
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기'}
          className={[
            'inline-flex size-11 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm lg:hidden',
            isTransparent
              ? 'border-bg-warm-white/85 bg-bg-warm-white/14 text-bg-warm-white shadow-[0_8px_24px_rgb(0_0_0/0.24)] backdrop-blur-sm'
              : 'border-line-default bg-bg-warm-white text-navy-deep',
          ].join(' ')}
          onClick={() => setIsMenuOpen((current) => !current)}
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

      <MobileMenu isOpen={isMenuOpen} onNavigate={() => setIsMenuOpen(false)} />
    </header>
  )
}
