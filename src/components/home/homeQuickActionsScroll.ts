const geometryProperties = [
  '--home-v4-guide-exit-height',
  '--home-v4-guide-exit-margin-top',
  '--home-v4-guide-exit-margin-bottom',
  '--home-v4-guide-exit-padding-bottom',
] as const

/** One owner for quick-link visibility; scroll frames never change layout. */
export function observeHomeQuickActionsScroll(shell: HTMLElement) {
  const desktop = window.matchMedia('(min-width: 1366px) and (min-aspect-ratio: 151/100) and (pointer: fine) and (not (any-pointer: coarse))')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  let quick: HTMLElement | null = null
  let frame = 0
  let needsMeasurement = true
  let lastY = Math.max(0, window.scrollY)
  let revealUntilY = 12
  let maximumY = 0
  let direction = 0
  let travelled = 0
  let hidden = false

  const clearGeometry = () => geometryProperties.forEach(property => shell.style.removeProperty(property))

  const setHidden = (next: boolean) => {
    if (!quick || (hidden === next && quick.dataset.quickScrollHidden !== undefined)) return
    hidden = next
    quick.dataset.quickScrollHidden = String(next)
    quick.inert = next
    if (next) quick.setAttribute('aria-hidden', 'true')
    else quick.removeAttribute('aria-hidden')
  }

  const resetQuick = () => {
    if (!quick) return
    quick.removeEventListener('focusin', handleFocus)
    quick.removeEventListener('focusout', queueUpdate)
    delete quick.dataset.quickScrollHidden
    quick.removeAttribute('aria-hidden')
    quick.inert = false
  }

  function handleFocus() {
    travelled = 0
    direction = 0
    setHidden(false)
  }

  const measure = () => {
    needsMeasurement = false
    const nextQuick = shell.querySelector<HTMLElement>('.home-quick-actions')
    if (nextQuick !== quick) {
      resetQuick()
      sizeObserver.disconnect()
      quick = nextQuick
      if (quick) {
        quick.addEventListener('focusin', handleFocus)
        quick.addEventListener('focusout', queueUpdate)
        sizeObserver.observe(quick.querySelector('.home-quick-action-grid') ?? quick)
        sizeObserver.observe(shell)
      }
    }
    if (!quick) return

    if (desktop.matches && !reduced.matches) {
      const grid = quick.querySelector<HTMLElement>('.home-quick-action-grid')
      const height = (grid?.offsetHeight ?? 132) + 16
      const hold = Math.min(260, Math.max(200, window.innerHeight * 0.26))
      shell.style.setProperty('--home-v4-guide-exit-height', `${height}px`)
      shell.style.setProperty('--home-v4-guide-exit-margin-top', `${-(height + hold)}px`)
      shell.style.setProperty('--home-v4-guide-exit-margin-bottom', '118px')
      shell.style.setProperty('--home-v4-guide-exit-padding-bottom', '16px')
      revealUntilY = 12
    } else {
      clearGeometry()
      const headerHeight = shell.querySelector<HTMLElement>('.home-v4-sample-header')?.offsetHeight ?? 72
      // A compact menu follows the hero in normal flow. Let visitors reach it
      // before downward scrolling can hide it underneath the fixed header.
      revealUntilY = Math.max(12, quick.getBoundingClientRect().top + window.scrollY - headerHeight)
    }
    maximumY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    setHidden(hidden)
  }

  const update = () => {
    frame = 0
    if (needsMeasurement) measure()
    const y = Math.max(0, Math.min(window.scrollY, maximumY))
    const delta = y - lastY
    lastY = y
    if (!quick) return

    if (y <= revealUntilY || quick.contains(document.activeElement)) {
      travelled = 0
      direction = 0
      setHidden(false)
      return
    }
    if (delta === 0) return
    const nextDirection = Math.sign(delta)
    travelled = nextDirection === direction ? travelled + Math.abs(delta) : Math.abs(delta)
    direction = nextDirection
    if (travelled >= 12) {
      setHidden(direction > 0)
      travelled = 0
    }
  }

  function queueUpdate() {
    if (!frame) frame = window.requestAnimationFrame(update)
  }

  const queueMeasurement = () => {
    needsMeasurement = true
    queueUpdate()
  }
  const sizeObserver = new ResizeObserver(queueMeasurement)
  const mountObserver = new MutationObserver(() => {
    // React swaps the compact/desktop branch. Avoid querying the page on every
    // carousel update once our current section is still connected.
    if (!quick?.isConnected) queueMeasurement()
  })
  mountObserver.observe(shell, { childList: true, subtree: true })
  window.addEventListener('scroll', queueUpdate, { passive: true })
  window.addEventListener('resize', queueMeasurement)
  window.addEventListener('pageshow', queueMeasurement)
  desktop.addEventListener('change', queueMeasurement)
  reduced.addEventListener('change', queueMeasurement)
  update()

  return () => {
    window.cancelAnimationFrame(frame)
    sizeObserver.disconnect()
    mountObserver.disconnect()
    window.removeEventListener('scroll', queueUpdate)
    window.removeEventListener('resize', queueMeasurement)
    window.removeEventListener('pageshow', queueMeasurement)
    desktop.removeEventListener('change', queueMeasurement)
    reduced.removeEventListener('change', queueMeasurement)
    resetQuick()
    clearGeometry()
  }
}
