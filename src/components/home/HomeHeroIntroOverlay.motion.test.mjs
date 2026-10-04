import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./HomeHeroIntroOverlay.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

function mount({ scrollY = 0, animate = true, fontsPending = false, viewport = 'desktop', rootStyle = {}, rootLayoutCost = 0 } = {}) {
  const slots = [], effects = [], frames = new Map(), timers = new Map(), listeners = new Map()
  let cursor = 0, serial = 0, clock = 0, dirty = false, tree, resolveFonts
  const fontsReady = fontsPending ? new Promise(resolve => { resolveFonts = resolve }) : Promise.resolve()
  const preferenceListeners = new Set(), animationListeners = new Map()
  const query = { matches: animate,
    addEventListener(_type, callback) { preferenceListeners.add(callback) },
    removeEventListener(_type, callback) { preferenceListeners.delete(callback) },
  }
  const documentElement = { style: { overflow: 'auto', scrollbarGutter: '', scrollBehavior: 'smooth', ...rootStyle } }
  const body = { style: { overflow: '' } }
  const style = { setProperty() {}, getPropertyValue: () => '1' }
  const rect = { left: 100, top: 200, width: 420, height: 400 }
  const title = { getBoundingClientRect: () => rect, closest: () => null }
  const root = { getBoundingClientRect: () => ({ left: 0, top: 0 }), closest: () => null, querySelector: () => title }
  const launch = { style, closest: () => root, querySelector: () => ({ style }), querySelectorAll: () => [],
    addEventListener(type, callback) { if (!animationListeners.has(type)) animationListeners.set(type, new Set()); animationListeners.get(type).add(callback) },
    removeEventListener(type, callback) { animationListeners.get(type)?.delete(callback) },
  }
  class Element { constructor(interactive = false) { this.interactive = interactive } closest() { return this.interactive ? this : null } }
  const window = {
    scrollY, scrollX: 0, matchMedia: () => query,
    scrollTo({ top, left }) { window.scrollY = top; window.scrollX = left },
    getComputedStyle(element) { if (element === documentElement) clock += rootLayoutCost; return { fontSize: '100px', lineHeight: '100px', transform: 'none', scrollbarGutter: 'auto', getPropertyValue: () => '0.8' } },
    requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id },
    cancelAnimationFrame(id) { frames.delete(id) },
    setTimeout(callback, delay) { const id = ++serial; timers.set(id, { callback, at: clock + delay }); return id },
    clearTimeout(id) { timers.delete(id) },
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback) },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback) },
  }
  const react = {
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useState(initial) {
      const index = cursor++
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial }
      const slot = slots[index]
      slot.set ??= next => {
        const value = typeof next === 'function' ? next(slot.value) : next
        if (!Object.is(value, slot.value)) { slot.value = value; dirty = true }
      }
      return [slot.value, slot.set]
    },
    useEffect(callback, deps) {
      const index = cursor++, slot = slots[index]
      if (!slot || deps.some((value, i) => !Object.is(value, slot.deps[i]))) effects.push(() => {
        slot?.cleanup?.(); slots[index] = { deps, callback, cleanup: callback() }
      })
    },
  }
  react.useLayoutEffect = react.useEffect
  const jsx = (type, props, key) => ({ type, props, key })
  const module = { exports: {} }
  vm.runInNewContext(source, { module, exports: module.exports, window,
    document: { documentElement, body, fonts: { ready: fontsReady, load: () => fontsReady } }, Element,
    performance: { now: () => clock },
    ResizeObserver: class { observe() {} disconnect() {} },
    require(name) {
      if (name === 'react') return react
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === './useHomeResponsiveViewport') return { useHomeResponsiveViewport: () => viewport }
      throw new Error(`Unexpected import ${name}`)
    },
  })
  function render() {
    cursor = 0; dirty = false
    tree = module.exports.HomeHeroIntroOverlay()
    if (tree?.props.ref) tree.props.ref.current = launch
    effects.splice(0).forEach(effect => effect())
  }
  function settle() {
    for (let count = 0; dirty; count++) { assert.ok(count < 10, 'Unexpected render loop'); render() }
  }
  render(); settle()
  return {
    get tree() { return tree },
    get pendingFrames() { return frames.size },
    get pendingTimers() { return timers.size },
    get listenerCount() { return [...listeners.values()].reduce((count, callbacks) => count + callbacks.size, 0) },
    get scrollY() { return window.scrollY },
    documentElement, body,
    scroll(next) { window.scrollY = next; listeners.get('scroll')?.forEach(callback => callback()); settle() },
    end(animationName, type = 'animationend') {
      animationListeners.get(type)?.forEach(callback => callback({ animationName })); settle()
    },
    escape() { listeners.get('keydown')?.forEach(callback => callback({ key: 'Escape' })); settle() },
    intent(type, event = {}, settleNow = true) { listeners.get(type)?.forEach(callback => callback(event)); if (settleNow) settle() },
    interactiveTarget() { return new Element(true) },
    settle,
    advance(ms) { clock += ms; for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.callback() }; settle() },
    timeout() { this.advance(1200) },
    reduceMotion() { query.matches = false; preferenceListeners.forEach(callback => callback()); settle() },
    restoreMotion() { query.matches = true; preferenceListeners.forEach(callback => callback()); settle() },
    changeViewport(next) { viewport = next; render(); settle() },
    replayEffectsAfter(ms) { clock += ms; slots.forEach(slot => slot?.cleanup?.()); slots.forEach(slot => { if (slot?.callback) slot.cleanup = slot.callback() }); settle() },
    async prepare() {
      resolveFonts?.()
      for (let count = 0; count < 8; count++) {
        await new Promise(resolve => setImmediate(resolve))
        const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()); settle()
      }
    },
    cleanup() { slots.forEach(slot => slot?.cleanup?.()) },
  }
}

test('mounting the intro after the page is already scrolled never covers the hero with a late overlay', () => {
  const h = mount({ scrollY: 200 })
  try { assert.equal(h.tree, null) } finally { h.cleanup() }
})

test('the retained visible field releases a brief real hold even when the decorative sweep never runs', async () => {
  const h = mount({ fontsPending: true })
  try {
    assert.ok(h.tree)
    assert.equal(h.documentElement.style.overflow, 'auto', 'Do not lock before the retained animation can actually play')
    await h.prepare()
    assert.equal(h.documentElement.style.overflow, 'hidden', 'Preserve the requested hold during the real animation')
    assert.equal(h.documentElement.style.scrollbarGutter, 'stable')
    assert.match(h.tree.props.className, /--ready/)
    h.end('home-intro-word-to-title')
    assert.ok(h.tree, 'An earlier child animation must not remove the authored intro')
    h.end('home-intro-field-release')
    assert.ok(h.tree === null)
    assert.equal(h.documentElement.style.overflow, 'auto')
    assert.equal(h.documentElement.style.scrollbarGutter, '')
    assert.equal(h.documentElement.style.scrollBehavior, 'smooth')
    assert.equal(h.pendingFrames, 0)
  } finally { h.cleanup() }
})

test('after finishing, normal scrolling works and returning to the top does not replay the intro', async () => {
  const h = mount()
  try {
    await h.prepare(); assert.match(h.tree.props.className, /--ready/)
    h.end('home-intro-field-release')
    assert.ok(h.tree === null, 'The actual last animation releases the intro before any scroll')
    h.scroll(180); assert.equal(h.scrollY, 180)
    h.scroll(0); await h.prepare(); assert.ok(h.tree === null)
  } finally { h.cleanup() }
})

for (const release of ['escape', 'timeout', 'reduceMotion']) {
  test(`${release} safely releases a preparing intro without a later font response relocking the page`, async () => {
    const h = mount({ fontsPending: true })
    try {
      assert.equal(h.documentElement.style.overflow, 'auto')
      h[release]()
      assert.ok(h.tree === null)
      assert.equal(h.documentElement.style.overflow, 'auto')
      await h.prepare(); assert.ok(h.tree === null)
      assert.equal(h.documentElement.style.overflow, 'auto')
    } finally { h.cleanup() }
  })
}

test('animation cancellation and unmount preserve the root and separately opened popup ownership', async () => {
  const h = mount()
  try {
    await h.prepare(); assert.equal(h.documentElement.style.overflow, 'hidden')
    h.body.style.overflow = 'hidden'
    h.end('home-intro-field-release', 'animationcancel')
    assert.equal(h.documentElement.style.overflow, 'auto')
    assert.equal(h.body.style.overflow, 'hidden')
  } finally { h.cleanup() }
  const preparing = mount({ fontsPending: true })
  assert.equal(preparing.documentElement.style.overflow, 'auto')
  preparing.cleanup()
  assert.equal(preparing.documentElement.style.overflow, 'auto')
  await preparing.prepare()
  assert.equal(preparing.documentElement.style.overflow, 'auto')
})

for (const type of ['wheel', 'touchmove']) {
  test(`${type} keeps the short hold until its deadline rather than deleting the intro`, async () => {
    const h = mount({ fontsPending: true })
    try {
      await h.prepare()
      h.body.style.overflow = 'hidden'
      h.intent(type, { defaultPrevented: false }, false)
      h.settle()
      assert.equal(h.documentElement.style.overflow, 'hidden')
      assert.ok(h.tree, 'Wheel/touch intention cannot skip the requested brief hold')
      assert.equal(h.documentElement.style.scrollBehavior, 'smooth')
      h.advance(1100)
      assert.equal(h.documentElement.style.overflow, 'auto')
      h.scroll(180)
      assert.equal(h.scrollY, 180, 'After the bounded hold, scrolling must never be restored to the old position')
      assert.equal(h.tree, null)
      assert.equal(h.body.style.overflow, 'hidden')
      await h.prepare()
      assert.equal(h.tree, null)
      assert.equal(h.pendingFrames, 0)
      assert.equal(h.pendingTimers, 0)
      assert.equal(h.listenerCount, 0)
    } finally { h.cleanup() }
  })
}

test('scroll keys keep the brief hold and interactive keys are not intercepted', async () => {
  for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']) {
    const h = mount({ fontsPending: true })
    try {
      await h.prepare()
      let prevented = false
      h.intent('keydown', { key, preventDefault() { prevented = true } }, false)
      assert.equal(h.documentElement.style.overflow, 'hidden', key)
      assert.equal(prevented, false, 'Do not replace normal keyboard scrolling')
      h.settle()
      assert.ok(h.tree, 'Scroll intention must not remove the authored hold')
      h.advance(1100)
      assert.equal(h.documentElement.style.overflow, 'auto')
      assert.equal(h.tree, null)
    } finally { h.cleanup() }
  }
  const h = mount({ fontsPending: true })
  try {
    await h.prepare()
    h.intent('keydown', { key: ' ', target: h.interactiveTarget() })
    h.intent('keydown', { key: 'ArrowDown', defaultPrevented: true })
    h.intent('keydown', { key: 'ArrowDown', ctrlKey: true })
    assert.ok(h.tree, 'Interactive control keys must retain the intro until a real dismissal')
    assert.equal(h.documentElement.style.overflow, 'hidden')
    h.escape()
    assert.equal(h.documentElement.style.overflow, 'auto')
  } finally { h.cleanup() }
})

test('stalled preparation skips the overlay without ever locking the visitor', async () => {
  const h = mount({ fontsPending: true })
  try {
    h.advance(1100)
    assert.ok(h.tree)
    assert.equal(h.documentElement.style.overflow, 'auto')
    h.advance(100)
    assert.equal(h.documentElement.style.overflow, 'auto')
    assert.equal(h.tree, null)
    await h.prepare()
    assert.equal(h.documentElement.style.overflow, 'auto')
  } finally { h.cleanup() }
})

test('scrolling while fonts prepare moves immediately and skips the intro without restoring the old position', async () => {
  const h = mount({ fontsPending: true })
  try {
    assert.equal(h.documentElement.style.overflow, 'auto')
    h.scroll(300)
    assert.equal(h.scrollY, 300)
    assert.equal(h.tree, null)
    await h.prepare()
    assert.equal(h.tree, null)
    assert.equal(h.scrollY, 300)
  } finally { h.cleanup() }
})

test('remaining at the top retains the normal intro, and reduced-motion/mobile visitors get no overlay', async () => {
  const h = mount(), staticPage = mount({ animate: false }), tabletPage = mount({ viewport: 'tablet' })
  try {
    await h.prepare(); assert.match(h.tree.props.className, /--ready/)
    h.scroll(0); assert.ok(h.tree)
    assert.equal(staticPage.tree, null)
    assert.equal(staticPage.documentElement.style.overflow, 'auto')
    assert.equal(tabletPage.tree, null)
  } finally { h.cleanup(); staticPage.cleanup(); tabletPage.cleanup() }
})

test('compact or reduced-motion interruptions release the hold permanently for this visit', async () => {
  for (const mode of ['tablet', 'mobile', 'reduced']) {
    const h = mount({ fontsPending: true })
    try {
      await h.prepare()
      assert.equal(h.documentElement.style.overflow, 'hidden')
      if (mode === 'reduced') h.reduceMotion(); else h.changeViewport(mode)
      assert.equal(h.documentElement.style.overflow, 'auto')
      if (mode === 'reduced') h.restoreMotion(); else h.changeViewport('desktop')
      await h.prepare()
      assert.equal(h.tree, null, 'Returning to desktop must not restart the cancelled hold')
      assert.equal(h.documentElement.style.overflow, 'auto')
      assert.equal(h.pendingFrames, 0)
      assert.equal(h.pendingTimers, 0)
    } finally { h.cleanup() }
  }
})

test('finishing restores pre-existing root values and does not overwrite a newer root owner', async () => {
  const h = mount({ rootStyle: { overflow: 'scroll', scrollbarGutter: 'stable both-edges' } })
  try {
    await h.prepare()
    h.advance(1100)
    assert.equal(h.documentElement.style.overflow, 'scroll')
    assert.equal(h.documentElement.style.scrollbarGutter, 'stable both-edges')
    assert.equal(h.documentElement.style.scrollBehavior, 'smooth')
  } finally { h.cleanup() }
  const changed = mount()
  try {
    await changed.prepare()
    changed.documentElement.style.overflow = 'clip'
    changed.documentElement.style.scrollbarGutter = 'stable both-edges'
    changed.advance(1100)
    assert.equal(changed.documentElement.style.overflow, 'clip')
    assert.equal(changed.documentElement.style.scrollbarGutter, 'stable both-edges')
  } finally { changed.cleanup() }
})

test('StrictMode preparation replay cannot consume or cut the retained playing sequence', async () => {
  const h = mount({ fontsPending: true })
  try {
    assert.equal(h.documentElement.style.overflow, 'auto')
    h.replayEffectsAfter(400)
    await h.prepare()
    h.advance(1099)
    assert.ok(h.tree)
    assert.equal(h.documentElement.style.overflow, 'hidden')
    h.advance(1)
    assert.equal(h.documentElement.style.overflow, 'auto', 'A bounded playing phase starts when the animation is ready, not while fonts/layout prepare')
    assert.equal(h.tree, null)
    await h.prepare()
    assert.equal(h.tree, null)
    assert.equal(h.pendingTimers, 0)
    assert.equal(h.pendingFrames, 0)
  } finally { h.cleanup() }
})

test('a missing field end event releases the playing hold without consuming an input to unlock it', async () => {
  const h = mount()
  try {
    await h.prepare()
    h.advance(1099)
    assert.equal(h.documentElement.style.overflow, 'hidden')
    h.advance(1)
    assert.equal(h.documentElement.style.overflow, 'auto')
    assert.equal(h.tree, null)
    h.scroll(200)
    assert.equal(h.scrollY, 200)
  } finally { h.cleanup() }
})

test('a costly pre-hold style read cannot consume the retained playing sequence', async () => {
  const h = mount({ rootLayoutCost: 500 })
  try {
    await h.prepare()
    h.advance(1099)
    assert.ok(h.tree, 'Start the playing budget after the pre-hold style read, not before it')
    assert.equal(h.documentElement.style.overflow, 'hidden')
    h.advance(1)
    assert.equal(h.tree, null)
    assert.equal(h.documentElement.style.overflow, 'auto')
  } finally { h.cleanup() }
})

test('a field completion delivered a frame late still finishes the retained sequence before the watchdog', async () => {
  const h = mount()
  try {
    await h.prepare()
    h.advance(960)
    assert.ok(h.tree, 'The watchdog needs room for the actual CSS start and event delivery, not only the nominal890ms')
    assert.equal(h.documentElement.style.overflow, 'hidden')
    h.end('home-intro-field-release')
    assert.equal(h.tree, null)
    assert.equal(h.documentElement.style.overflow, 'auto')
  } finally { h.cleanup() }
})
