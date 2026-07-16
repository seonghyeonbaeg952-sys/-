import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'

import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { publicNavigation, type PublicNavigationItem } from '../../constants/navigation'
import { classNames } from '../../utils/classNames'

type MobileMenuProps = {
  isOpen: boolean
  onNavigate: () => void
}

type PublicNavigationGroup = PublicNavigationItem & {
  children: NonNullable<PublicNavigationItem['children']>
}

const menuGroups: PublicNavigationGroup[] = publicNavigation.flatMap((item) =>
  item.children?.length ? [{ ...item, children: item.children }] : [],
)

function getHrefParts(href: string) {
  const url = new URL(href, 'https://smyc.local')

  return {
    hash: url.hash,
    pathname: url.pathname,
    search: url.search,
  }
}

function isHrefActive(
  href: string,
  currentPathname: string,
  currentSearch: string,
  currentHash: string,
) {
  const target = getHrefParts(href)

  if (target.search || target.hash) {
    return (
      currentPathname === target.pathname &&
      (!target.search || currentSearch === target.search) &&
      (!target.hash || currentHash === target.hash)
    )
  }

  if (target.pathname === '/') {
    return currentPathname === '/'
  }

  return (
    currentPathname === target.pathname ||
    currentPathname.startsWith(`${target.pathname}/`)
  )
}

function getActiveGroupHref(
  pathname: string,
  search: string,
  hash: string,
) {
  return (
    menuGroups.find(
      (group) =>
        isHrefActive(group.href, pathname, search, hash) ||
        group.children.some((item) => isHrefActive(item.href, pathname, search, hash)),
    )?.href ?? null
  )
}

export function MobileMenu({ isOpen, onNavigate }: MobileMenuProps) {
  const location = useLocation()
  const [openGroupHref, setOpenGroupHref] = useState<string | null>(null)
  const currentGroupHref = getActiveGroupHref(
    location.pathname,
    location.search,
    location.hash,
  )
  const effectiveOpenGroupHref = openGroupHref ?? currentGroupHref

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="mobile-menu-panel border-t border-line-default bg-bg-warm-white/98 shadow-header backdrop-blur lg:hidden"
      id="mobile-menu"
    >
      <Container className="max-h-[calc(100dvh-72px)] overflow-y-auto py-5">
        <nav aria-label="모바일 방문자 메뉴" className="grid gap-4">
          <NavLink
            className={({ isActive }) =>
              [
                'min-h-12 rounded-button px-4 py-3 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink',
                isActive
                  ? 'bg-bg-ivory text-gold-ink'
                  : 'text-navy-deep hover:bg-bg-ivory',
              ].join(' ')
            }
            onClick={() => {
              setOpenGroupHref(null)
              onNavigate()
            }}
            to="/"
          >
            홈
          </NavLink>
          {menuGroups.map((group, index) => {
            const isOpenGroup = effectiveOpenGroupHref === group.href
            const isGroupActive =
              isHrefActive(group.href, location.pathname, location.search, location.hash) ||
              group.children.some((item) =>
                isHrefActive(item.href, location.pathname, location.search, location.hash),
              )
            const panelId = `mobile-menu-group-${index}`

            return (
              <section
                className="overflow-hidden rounded-formal border border-line-default bg-bg-warm-white"
                key={group.href}
              >
                <button
                  aria-controls={panelId}
                  aria-expanded={isOpenGroup}
                  className={classNames(
                    'flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink',
                    isGroupActive
                      ? 'bg-bg-ivory text-navy-deep'
                      : 'text-navy-deep hover:bg-bg-ivory',
                  )}
                  onClick={() =>
                    setOpenGroupHref((current) =>
                      (current ?? currentGroupHref) === group.href ? '' : group.href,
                    )
                  }
                  type="button"
                >
                  <span>
                    <span className="block text-base font-semibold">{group.label}</span>
                    {group.description ? (
                      <span className="mt-1 block break-keep text-xs leading-5 text-text-muted">
                        {group.description}
                      </span>
                    ) : null}
                  </span>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      'text-lg leading-none text-gold-ink transition',
                      isOpenGroup ? 'rotate-180' : '',
                    )}
                  >
                    ▾
                  </span>
                </button>
                <div
                  aria-hidden={!isOpenGroup}
                  className={classNames(
                    'grid transition-[grid-template-rows] duration-300 ease-out',
                    isOpenGroup ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                  id={panelId}
                  inert={!isOpenGroup}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-1 border-t border-line-default/80 p-3">
                      {group.children.map((item) => {
                        const isActive = isHrefActive(
                          item.href,
                          location.pathname,
                          location.search,
                          location.hash,
                        )

                        return (
                          <Link
                            aria-current={isActive ? 'page' : undefined}
                            className={classNames(
                              'min-h-11 rounded-button px-3 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink',
                              isActive
                                ? 'bg-gold-warm/15 text-navy-deep'
                                : 'text-text-muted hover:bg-bg-ivory hover:text-navy-deep',
                            )}
                            key={item.href}
                            onClick={() => {
                              setOpenGroupHref(null)
                              onNavigate()
                            }}
                            to={item.href}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
          <div className="mt-1">
            <Button
              className="w-full"
              href="/join"
              onClick={() => {
                setOpenGroupHref(null)
                onNavigate()
              }}
              size="lg"
              variant="gold"
            >
              입단 안내
            </Button>
          </div>
        </nav>
      </Container>
    </div>
  )
}
