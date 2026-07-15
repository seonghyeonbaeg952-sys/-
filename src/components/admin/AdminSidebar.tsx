import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

import { adminNavigationGroups } from '../../constants/navigation'
import { classNames } from '../../utils/classNames'
import { BrandLogo } from '../common/BrandLogo'

type AdminSidebarProps = {
  isOpen: boolean
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'summary',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function subscribeToDesktopViewport(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getDesktopViewportSnapshot() {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
}

export function AdminSidebar({
  isOpen,
  onClose,
  returnFocusRef,
}: AdminSidebarProps) {
  const location = useLocation()
  const asideRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopViewport,
    getDesktopViewportSnapshot,
    () => false,
  )
  const isInteractive = isDesktop || isOpen

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (isDesktop && isOpen) {
      onCloseRef.current()
    }
  }, [isDesktop, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const returnFocusElement = returnFocusRef.current
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !asideRef.current) {
        return
      }

      const focusableElements = Array.from(
        asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0,
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        asideRef.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      if (
        event.shiftKey &&
        (activeElement === firstElement || !asideRef.current.contains(activeElement))
      ) {
        event.preventDefault()
        lastElement.focus()
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement || !asideRef.current.contains(activeElement))
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow

      if (
        returnFocusElement?.isConnected &&
        returnFocusElement.getClientRects().length > 0
      ) {
        returnFocusElement.focus()
      }
    }
  }, [isOpen, returnFocusRef])

  const isRouteActive = (href: string) =>
    href === '/admin'
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(`${href}/`)

  return (
    <>
      {isOpen ? (
        <button
          aria-label="관리자 메뉴 닫기"
          className="fixed inset-0 z-30 bg-navy-midnight/45 lg:hidden"
          onClick={onClose}
          tabIndex={-1}
          type="button"
        />
      ) : null}
      <aside
        aria-label={isOpen ? '관리자 메뉴' : undefined}
        aria-modal={isOpen ? true : undefined}
        aria-hidden={!isInteractive}
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-bg-warm-white/10 bg-navy-midnight px-5 py-5 text-bg-warm-white shadow-header transition-transform lg:static lg:z-auto lg:min-h-screen lg:w-auto lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        id="admin-sidebar"
        inert={!isInteractive}
        ref={asideRef}
        role={isOpen ? 'dialog' : undefined}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <BrandLogo
              className="max-w-[64px] overflow-hidden"
              size="md"
              theme="dark"
              variant="symbol"
            />
            <p className="mt-3 text-sm font-semibold text-gold-soft">관리자 CMS</p>
            <p className="mt-2 text-xs leading-5 text-bg-ivory/60">
              콘텐츠와 공개 상태를 관리합니다.
            </p>
          </div>
          <button
            aria-label="관리자 메뉴 닫기"
            className="flex size-11 items-center justify-center rounded-button text-bg-ivory/75 transition hover:bg-bg-warm-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm lg:hidden"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            ×
          </button>
        </div>

        <nav
          aria-label="관리자 메뉴"
          className="mt-7 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
        >
          {adminNavigationGroups.map((group, groupIndex) => {
            const isActiveGroup = group.items.some((item) =>
              isRouteActive(item.href),
            )

            return (
              <details
                className="group/nav"
                key={group.label}
                open={isActiveGroup || groupIndex === 0}
              >
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-button px-3 text-[11px] font-semibold text-bg-ivory/45 transition hover:bg-bg-warm-white/5 hover:text-bg-ivory/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm [&::-webkit-details-marker]:hidden">
                  <span>{group.label}</span>
                  <span
                    aria-hidden="true"
                    className="text-sm transition-transform group-open/nav:rotate-180"
                  >
                    ⌄
                  </span>
                </summary>
                <div className="mt-1 flex flex-col gap-1">
                  {group.items.map((item) => (
                    <NavLink
                      className={({ isActive }) =>
                        classNames(
                          'relative min-h-11 rounded-button px-3 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
                          isActive
                            ? 'bg-gold-warm text-navy-midnight shadow-[0_10px_24px_rgb(0_0_0/0.18)]'
                            : 'text-bg-ivory/75 hover:bg-bg-warm-white/10 hover:text-bg-warm-white',
                        )
                      }
                      end={item.href === '/admin'}
                      key={item.href}
                      onClick={onClose}
                      to={item.href}
                    >
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </details>
            )
          })}
        </nav>
        <div className="mt-5 border-t border-bg-warm-white/10 pt-5">
          <Link
            className="mb-5 flex min-h-11 items-center justify-between rounded-button border border-bg-warm-white/15 px-3 text-sm font-semibold text-bg-ivory/80 transition hover:border-gold-warm/60 hover:bg-bg-warm-white/10 hover:text-bg-warm-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
            onClick={onClose}
            rel="noreferrer"
            target="_blank"
            to="/"
          >
            <span>공개 홈페이지 보기</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <p className="mb-3 text-[11px] font-semibold text-bg-ivory/45">
            서울모테트음악재단
          </p>
          <BrandLogo
            brand="smf"
            className="max-w-[150px]"
            size="sm"
            theme="dark"
            withSurface
          />
        </div>
      </aside>
    </>
  )
}
