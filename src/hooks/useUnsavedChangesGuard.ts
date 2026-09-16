import { useLayoutEffect, useRef } from 'react'

const DEFAULT_MESSAGE = '저장하지 않은 변경사항이 있습니다. 페이지를 이동할까요?'

type UseUnsavedChangesGuardOptions = {
  enabled: boolean
  message?: string
}

const activeGuards = new Map<symbol, string>()
let listenersAttached = false

export function getUnsavedChangesMessage() {
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

  return window.confirm(message ?? getUnsavedChangesMessage())
}

export function shouldBlockUnsavedNavigation(currentPath: string, nextPath: string) {
  // Auth expiry and explicit sign-out must not leave a protected screen trapped.
  // Query/anchor changes keep the mounted editor and its per-page memory drafts.
  return activeGuards.size > 0 && currentPath !== nextPath && nextPath !== '/admin/login'
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (activeGuards.size === 0) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') {
    return
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  listenersAttached = true
}

function detachListeners() {
  if (!listenersAttached || activeGuards.size > 0) {
    return
  }

  window.removeEventListener('beforeunload', handleBeforeUnload)
  listenersAttached = false
}

export function useUnsavedChangesGuard({
  enabled,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesGuardOptions) {
  const guardIdRef = useRef(Symbol('unsaved-changes-guard'))

  useLayoutEffect(() => {
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
