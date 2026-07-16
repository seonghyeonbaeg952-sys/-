import { Link, useLocation } from 'react-router'

import type { PublicNavigationItem } from '../../constants/navigation'
import { classNames } from '../../utils/classNames'
import { Container } from '../common/Container'
import { StaffLines } from '../common/StaffLines'

type MegaMenuProps = {
  id: string
  item: PublicNavigationItem | null
  onNavigate: () => void
}

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

export function MegaMenu({ id, item, onNavigate }: MegaMenuProps) {
  const location = useLocation()

  if (!item?.children?.length) {
    return null
  }

  return (
    <div
      aria-label={`${item.label} 하위 메뉴`}
      className="absolute inset-x-0 top-full hidden border-y border-line-default/90 bg-bg-warm-white/98 shadow-header backdrop-blur lg:block"
      id={id}
      role="region"
    >
      <Container className="py-6">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="relative overflow-hidden rounded-formal border border-line-default bg-bg-ivory p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">
              SMYC MENU
            </p>
            <h2 className="mt-4 break-keep text-2xl font-semibold leading-tight text-navy-deep">
              {item.label}
            </h2>
            {item.description ? (
              <p className="mt-3 break-keep text-sm leading-6 text-text-muted">
                {item.description}
              </p>
            ) : null}
            <StaffLines className="mt-6 opacity-60" density="light" variant="gold" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {item.children.map((child) => {
              const isActive = isHrefActive(
                child.href,
                location.pathname,
                location.search,
                location.hash,
              )

              return (
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={classNames(
                    'group relative min-h-[92px] overflow-hidden rounded-button border bg-bg-warm-white p-5 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink',
                    isActive
                      ? 'border-gold-warm/75 text-navy-deep shadow-[0_14px_34px_rgb(16_35_63/0.08)]'
                      : 'border-line-default/90 text-text-muted hover:border-gold-warm/55 hover:bg-bg-ivory hover:text-navy-deep',
                  )}
                  key={child.href}
                  onClick={onNavigate}
                  to={child.href}
                >
                  <span
                    aria-hidden="true"
                    className={classNames(
                      'absolute bottom-0 left-0 top-0 w-0.5 bg-gold-warm opacity-0 transition',
                      isActive ? 'opacity-100' : 'group-hover:opacity-100',
                    )}
                  />
                  <span className="block break-keep text-base font-semibold">
                    {child.label}
                  </span>
                  {child.description ? (
                    <span className="mt-2 block break-keep text-sm leading-6 text-text-muted">
                      {child.description}
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={classNames(
                      'mt-4 block h-px w-12 origin-left scale-x-75 bg-gold-warm/55 transition group-hover:scale-x-100',
                      isActive ? 'scale-x-100 bg-gold-warm' : '',
                    )}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      </Container>
    </div>
  )
}
