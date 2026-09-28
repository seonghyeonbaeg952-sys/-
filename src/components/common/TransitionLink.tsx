import { type MouseEvent, type ReactNode } from 'react'
import {
  Link,
  type LinkProps,
  type NavigateOptions,
  type To,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router'
import { useSampleLanguage } from '../../features/sample-language/useSampleLanguage'

type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    finished: Promise<void>
    ready: Promise<void>
    updateCallbackDone: Promise<void>
  }
}

type TransitionLinkProps = Omit<LinkProps, 'children'> & {
  children: ReactNode
}

function shouldHandleTransitionClick(
  event: MouseEvent<HTMLAnchorElement>,
  target?: string,
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    (!target || target === '_self') &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.shiftKey
  )
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') {
    return true
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function startRouteTransition(callback: () => void) {
  const transitionDocument = document as ViewTransitionDocument

  if (prefersReducedMotion() || !transitionDocument.startViewTransition) {
    callback()
    return
  }

  transitionDocument.startViewTransition(callback)
}

export function TransitionLink({
  children,
  onClick,
  preventScrollReset,
  relative,
  reloadDocument,
  replace,
  state,
  target,
  to,
  ...props
}: TransitionLinkProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const resolved = useResolvedPath(to, { relative })
  const { enabled, isSample, language, href: sampleHref } = useSampleLanguage()
  const isAbsoluteTarget = typeof to === 'string' && /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(to)
  const isHashOnly = typeof to === 'string' ? to.startsWith('#') : !to.pathname && to.search === undefined && Boolean(to.hash)
  // The router already owns /sample as its basename. Native anchors need that
  // prefix, while router destinations need it removed exactly once.
  const localisedTarget = enabled && (isSample || language === 'en') && !isAbsoluteTarget
    ? (isSample ? sampleHref(`${resolved.pathname}${isHashOnly ? location.search : resolved.search}${resolved.hash}`)
      .replace(/^\/sample(?=\/|[?#]|$)/, '') : sampleHref(`${resolved.pathname}${isHashOnly ? location.search : resolved.search}${resolved.hash}`))
    : null
  const destination: To = localisedTarget === null
    ? to : localisedTarget.startsWith('/') ? localisedTarget : `/${localisedTarget}`

  const navigateWithTransition = (nextTo: To, options: NavigateOptions) => {
    startRouteTransition(() => navigate(nextTo, options))
  }

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)

        if (reloadDocument || (enabled && isAbsoluteTarget) || !shouldHandleTransitionClick(event, target)) {
          return
        }

        event.preventDefault()
        navigateWithTransition(destination, {
          preventScrollReset,
          relative,
          replace,
          state,
        })
      }}
      preventScrollReset={preventScrollReset}
      relative={relative}
      reloadDocument={reloadDocument}
      replace={replace}
      state={state}
      target={target}
      to={destination}
    >
      {children}
    </Link>
  )
}
