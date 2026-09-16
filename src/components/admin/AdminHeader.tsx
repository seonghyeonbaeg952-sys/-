import type { RefObject } from 'react'
import { useLocation } from 'react-router'
import { adminNavigationGroups } from '../../constants/navigation'

import { Button } from '../common/Button'

type AdminHeaderProps = {
  isSidebarOpen: boolean
  isSigningOut: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onOpenSidebar: () => void
  onSignOut: () => void
  signOutError: string | null
  userEmail: string
}

export function AdminHeader({
  isSidebarOpen,
  isSigningOut,
  menuButtonRef,
  onOpenSidebar,
  onSignOut,
  signOutError,
  userEmail,
}: AdminHeaderProps) {
  const { pathname } = useLocation()
  const currentPage = adminNavigationGroups.flatMap(group => group.items).find(item => item.href === pathname)
  return (
    <header className="admin-header">
      <div className="admin-header__row flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            aria-controls="admin-sidebar"
            aria-expanded={isSidebarOpen}
            aria-label="관리자 메뉴 열기"
            className="flex size-11 items-center justify-center rounded-button border border-line-default text-navy-deep transition hover:border-gold-warm hover:text-navy-midnight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm lg:hidden"
            onClick={onOpenSidebar}
            ref={menuButtonRef}
            type="button"
          >
            ☰
          </button>
          <div className="admin-header__identity">
            <p className="text-sm font-semibold text-navy-deep">{currentPage?.label ?? '홈페이지 관리'}</p>
            <p className="mt-1 text-xs text-text-muted">{userEmail}</p>
          </div>
        </div>

        <div className="admin-header__actions flex items-center gap-3">
          {signOutError ? (
            <p className="text-sm text-state-error" role="alert">
              {signOutError}
            </p>
          ) : null}
          <Button
            href="/"
            rel="noreferrer"
            showArrow={false}
            size="sm"
            target="_blank"
            variant="secondary"
          >
            홈페이지 보기
          </Button>
          <Button
            disabled={isSigningOut}
            onClick={onSignOut}
            size="sm"
            variant="secondary"
          >
            {isSigningOut ? '로그아웃 중' : '로그아웃'}
          </Button>
        </div>
      </div>
    </header>
  )
}
