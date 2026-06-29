import { type MouseEvent, type ReactNode } from 'react'
import {
  Link,
  type LinkProps,
  type NavigateOptions,
  type To,
  useNavigate,
} from 'react-router'

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
  reloadDocument,
  replace,
  state,
  target,
  to,
  ...props
}: TransitionLinkProps) {
  const navigate = useNavigate()

  const navigateWithTransition = (nextTo: To, options: NavigateOptions) => {
    startRouteTransition(() => navigate(nextTo, options))
  }

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event)

        if (reloadDocument || !shouldHandleTransitionClick(event, target)) {
          return
        }

        event.preventDefault()
        navigateWithTransition(to, {
          preventScrollReset,
          replace,
          state,
        })
      }}
      preventScrollReset={preventScrollReset}
      reloadDocument={reloadDocument}
      replace={replace}
      state={state}
      target={target}
      to={to}
    >
      {children}
    </Link>
  )
}
