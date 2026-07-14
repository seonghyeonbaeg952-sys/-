import { Link, NavLink, useLocation } from 'react-router'

import { adminNavigationGroups } from '../../constants/navigation'
import { classNames } from '../../utils/classNames'
import { BrandLogo } from '../common/BrandLogo'

type AdminSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation()

  const isRouteActive = (href: string) =>
    href === '/admin'
      ? location.pathname === href
      : location.pathname === href || location.pathname.startsWith(`${href}/`)

  return (
    <>
      <button
        aria-label="관리자 메뉴 닫기"
        className={classNames(
          'fixed inset-0 z-30 bg-navy-midnight/45 transition-opacity lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        className={classNames(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-bg-warm-white/10 bg-navy-midnight px-5 py-5 text-bg-warm-white shadow-header transition-transform lg:static lg:z-auto lg:min-h-screen lg:w-auto lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        id="admin-sidebar"
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
            className="flex size-10 items-center justify-center rounded-button text-bg-ivory/75 transition hover:bg-bg-warm-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm lg:hidden"
            onClick={onClose}
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
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between rounded-button px-3 text-[11px] font-semibold text-bg-ivory/45 transition hover:bg-bg-warm-white/5 hover:text-bg-ivory/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm [&::-webkit-details-marker]:hidden">
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
