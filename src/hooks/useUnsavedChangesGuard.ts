import { useEffect, useRef } from 'react'

const DEFAULT_MESSAGE = '저장하지 않은 변경사항이 있습니다. 페이지를 이동할까요?'

type UseUnsavedChangesGuardOptions = {
  enabled: boolean
  message?: string
}

const activeGuards = new Map<symbol, string>()
let listenersAttached = false

function getActiveMessage() {
  const messages = new Set(activeGuards.values())

  if (messages.size === 1) {
    return messages.values().next().value ?? DEFAULT_MESSAGE
  }

  return DEFAULT_MESSAGE
}

export function confirmUnsavedChanges(message?: string) {
  if (activeGuards.size === 0 || typeof window === 'undefined') {
    return true
  }

  return window.confirm(message ?? getActiveMessage())
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (activeGuards.size === 0) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

function handleDocumentClick(event: MouseEvent) {
  if (
    activeGuards.size === 0 ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const anchor = target.closest<HTMLAnchorElement>('a[href]')

  if (
    !anchor ||
    anchor.hasAttribute('download') ||
    (anchor.target && anchor.target !== '_self')
  ) {
    return
  }

  const nextUrl = new URL(anchor.href, window.location.href)

  if (
    nextUrl.origin !== window.location.origin ||
    nextUrl.href === window.location.href
  ) {
    return
  }

  if (!confirmUnsavedChanges()) {
    event.preventDefault()
    event.stopPropagation()
  }
}

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') {
    return
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('click', handleDocumentClick, true)
  listenersAttached = true
}

function detachListeners() {
  if (!listenersAttached || activeGuards.size > 0) {
    return
  }

  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('click', handleDocumentClick, true)
  listenersAttached = false
}

export function useUnsavedChangesGuard({
  enabled,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesGuardOptions) {
  const guardIdRef = useRef(Symbol('unsaved-changes-guard'))

  useEffect(() => {
    if (!enabled) {
      return
    }

    const guardId = guardIdRef.current
    activeGuards.set(guardId, message)
    attachListeners()

    return () => {
      activeGuards.delete(guardId)
      detachListeners()
    }
  }, [enabled, message])
}
