import { useCallback, useEffect, useRef, useState } from 'react'

import { publicNavigation } from '../../../constants/navigation'
import { HomeV4SampleMegaMenu } from './HomeV4SampleMegaMenu'
import { HomeV4SampleMobileMenu } from './HomeV4SampleMobileMenu'
import { HomeV4SampleImage } from './HomeV4SampleImage'

const DESKTOP_MENU_ID = 'home-v4-desktop-mega-menu'
const MOBILE_MENU_ID = 'home-v4-mobile-menu'

export function HomeV4SampleHeader() {
  const [isScrolled, setIsScrolled] = useState(() => window.scrollY > 12)
  const [activeDesktopMenuHref, setActiveDesktopMenuHref] = useState<
    string | null
  >(null)
  const [desktopMenuPinned, setDesktopMenuPinned] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const desktopTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const previousBodyOverflowRef = useRef<string | null>(null)
  const desktopCloseTimerRef = useRef<number | null>(null)
  const desktopMenuOpen = activeDesktopMenuHref !== null
  const desktopMenuItem =
    publicNavigation.find((item) => item.href === activeDesktopMenuHref) ?? null
  const isTransparent = !isScrolled && !desktopMenuOpen && !mobileMenuOpen

  const cancelDesktopClose = useCallback(() => {
    if (desktopCloseTimerRef.current === null) {
      return
    }

    window.clearTimeout(desktopCloseTimerRef.current)
    desktopCloseTimerRef.current = null
  }, [])

  const closeDesktopMenu = useCallback((restoreFocus = true) => {
    cancelDesktopClose()
    setActiveDesktopMenuHref(null)
    setDesktopMenuPinned(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => desktopTriggerRef.current?.focus())
    }
  }, [cancelDesktopClose])

  const openDesktopMenu = useCallback((href: string) => {
    cancelDesktopClose()
    setActiveDesktopMenuHref(href)
  }, [cancelDesktopClose])

  const scheduleDesktopClose = useCallback(() => {
    if (desktopMenuPinned) {
      return
    }

    cancelDesktopClose()
    desktopCloseTimerRef.current = window.setTimeout(() => {
      setActiveDesktopMenuHref(null)
      desktopCloseTimerRef.current = null
    }, 160)
  }, [cancelDesktopClose, desktopMenuPinned])

  const closeMobileMenu = useCallback((restoreFocus = true) => {
    setMobileMenuOpen(false)
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileTriggerRef.current?.focus())
    }
  }, [])

  useEffect(() => {
    if (!desktopMenuOpen && !mobileMenuOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      if (mobileMenuOpen) {
        closeMobileMenu()
      } else {
        closeDesktopMenu()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (headerRef.current?.contains(event.target as Node)) {
        return
      }

      if (desktopMenuOpen) {
        closeDesktopMenu(false)
      }
      if (mobileMenuOpen) {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [
    closeDesktopMenu,
    closeMobileMenu,
    desktopMenuOpen,
    mobileMenuOpen,
  ])

  useEffect(
    () => () => {
      cancelDesktopClose()
    },
    [cancelDesktopClose],
  )

  useEffect(() => {
    const updateScrolled = () => setIsScrolled(window.scrollY > 12)

    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })

    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    previousBodyOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const firstMenuTarget = headerRef.current?.querySelector<HTMLAnchorElement>(
      `#${MOBILE_MENU_ID} a`,
    )
    window.requestAnimationFrame(() => firstMenuTarget?.focus())

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current ?? ''
      previousBodyOverflowRef.current = null
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const handleViewportChange = () => {
      if (mediaQuery.matches && mobileMenuOpen) {
        closeMobileMenu(false)
      }

      if (!mediaQuery.matches && desktopMenuOpen) {
        closeDesktopMenu(false)
      }
    }

    mediaQuery.addEventListener('change', handleViewportChange)
    return () => mediaQuery.removeEventListener('change', handleViewportChange)
  }, [
    closeDesktopMenu,
    closeMobileMenu,
    desktopMenuOpen,
    mobileMenuOpen,
  ])

  const toggleDesktopMenu = (href: string) => {
    cancelDesktopClose()

    if (desktopMenuPinned && activeDesktopMenuHref === href) {
      closeDesktopMenu()
      return
    }

    setActiveDesktopMenuHref(href)
    setDesktopMenuPinned(true)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen((open) => !open)
  }

  return (
    <header
      className="home-v4-sample-header"
      data-desktop-menu-open={desktopMenuOpen}
      data-desktop-menu-pinned={desktopMenuPinned}
      data-mobile-menu-open={mobileMenuOpen}
      data-transparent={isTransparent}
      onBlur={(event) => {
        const nextFocus = event.relatedTarget

        if (
          !desktopMenuPinned &&
          (!(nextFocus instanceof Node) ||
            !event.currentTarget.contains(nextFocus))
        ) {
          closeDesktopMenu(false)
        }
      }}
      onMouseEnter={cancelDesktopClose}
      onMouseLeave={scheduleDesktopClose}
      ref={headerRef}
    >
      <div className="home-v4-sample-header__bar max-w-content">
        <a
          aria-label="서울모테트청소년합창단 V4 샘플 홈"
          className="home-v4-brand"
          href="/sample/home-v4"
        >
          <HomeV4SampleImage
            alt="서울모테트청소년합창단"
            className="home-v4-brand__logo"
            fallbackLabel="서울모테트청소년합창단"
            src="/images/brand/smyc-logo-transparent.png"
          />
          <HomeV4SampleImage
            alt=""
            className="home-v4-brand__symbol"
            fallbackLabel="SMYC"
            src="/images/brand/smyc-symbol-transparent.png"
          />
          <span className="home-v4-brand__mobile-name">서울모테트청소년합창단</span>
        </a>

        <nav aria-label="주요 메뉴" className="home-v4-desktop-nav">
          <a
            aria-current="page"
            className="home-v4-desktop-nav__link is-active"
            href="/sample/home-v4"
          >
            홈
          </a>
          {publicNavigation.slice(1).map((item) => {
            const isOpen = activeDesktopMenuHref === item.href
            const isOptional =
              item.href === '/gallery' || item.href === '/contact'

            return (
              <button
                aria-controls={DESKTOP_MENU_ID}
                aria-expanded={isOpen}
                aria-haspopup="true"
                className={[
                  'home-v4-desktop-nav__link',
                  isOptional
                    ? 'home-v4-desktop-nav__link--optional'
                    : '',
                ].join(' ')}
                key={item.href}
                onClick={(event) => {
                  desktopTriggerRef.current = event.currentTarget
                  toggleDesktopMenu(item.href)
                }}
                onFocus={(event) => {
                  desktopTriggerRef.current = event.currentTarget
                  if (!desktopMenuPinned) {
                    openDesktopMenu(item.href)
                  }
                }}
                onMouseEnter={() => {
                  if (!desktopMenuPinned) {
                    openDesktopMenu(item.href)
                  }
                }}
                type="button"
              >
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <a
          className="home-v4-sample-header__cta"
          href="/sample/join"
          onClick={() => closeDesktopMenu(false)}
        >
          입단 안내
        </a>

        <button
          aria-controls={MOBILE_MENU_ID}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          className="home-v4-mobile-trigger"
          onClick={toggleMobileMenu}
          ref={mobileTriggerRef}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      {desktopMenuItem ? (
        <HomeV4SampleMegaMenu
          id={DESKTOP_MENU_ID}
          item={desktopMenuItem}
          onMouseEnter={cancelDesktopClose}
          onMouseLeave={scheduleDesktopClose}
          onNavigate={() => closeDesktopMenu(false)}
        />
      ) : null}

      {mobileMenuOpen ? (
        <HomeV4SampleMobileMenu
          id={MOBILE_MENU_ID}
          onNavigate={() => closeMobileMenu(false)}
        />
      ) : null}
    </header>
  )
}
