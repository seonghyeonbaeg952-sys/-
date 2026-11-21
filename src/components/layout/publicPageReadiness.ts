// Release the initial screen if a data request or image stalls on a slow connection.
const initialPageDeadlineMs = 6000

function isInViewport(element: Element) {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 &&
    rect.right > 0 && rect.left < window.innerWidth &&
    rect.bottom > 0 && rect.top < window.innerHeight
}

export function observeInitialPageReadiness(content: HTMLElement, onReady: () => void) {
  const imageLoads = new WeakMap<HTMLImageElement, { source: string; done: boolean }>()
  let waitingForFonts: Promise<FontFaceSet> | undefined
  let stopped = false
  let frame = 0

  function scheduleCheck() {
    if (!stopped && !frame) frame = window.requestAnimationFrame(check)
  }

  function check() {
    frame = 0
    // Flush the committed layout before reading the font set, including text-only routes.
    content.getBoundingClientRect()
    const loadingBlocks = content.querySelectorAll('main [role="status"][aria-busy="true"]')
    if (content.querySelector('[data-initial-data-pending="true"]') ||
      Array.from(loadingBlocks).some(isInViewport)) {
      return
    }

    let imagesPending = false
    for (const image of content.querySelectorAll('img')) {
      if (!isInViewport(image)) continue
      const source = image.currentSrc || image.src
      if (!source) continue
      let load = imageLoads.get(image)
      if (load?.source !== source) {
        const nextLoad = { source, done: false }
        imageLoads.set(image, nextLoad)
        const settle = () => {
          nextLoad.done = true
          scheduleCheck()
        }
        void image.decode().then(settle, settle)
        load = nextLoad
      }
      imagesPending ||= !load.done
    }

    const fonts = document.fonts
    if (fonts.status === 'loading' && waitingForFonts !== fonts.ready) {
      waitingForFonts = fonts.ready
      void waitingForFonts.then(scheduleCheck, scheduleCheck)
    }
    if (!imagesPending && fonts.status !== 'loading') finish()
  }

  function stop() {
    stopped = true
    observer.disconnect()
    window.cancelAnimationFrame(frame)
    window.clearTimeout(deadline)
    window.removeEventListener('resize', scheduleCheck)
    window.removeEventListener('scroll', scheduleCheck)
    content.removeEventListener('load', scheduleCheck, true)
    content.removeEventListener('error', scheduleCheck, true)
  }

  function finish() {
    stop()
    onReady()
  }

  const observer = new MutationObserver(scheduleCheck)
  observer.observe(content, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-initial-data-pending', 'aria-busy', 'src', 'srcset'],
  })
  const deadline = window.setTimeout(finish, initialPageDeadlineMs)
  window.addEventListener('resize', scheduleCheck)
  window.addEventListener('scroll', scheduleCheck, { passive: true })
  content.addEventListener('load', scheduleCheck, true)
  content.addEventListener('error', scheduleCheck, true)
  scheduleCheck()
  return stop
}
