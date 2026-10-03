import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./HomeHeroIntroOverlay.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

function mount({ scrollY = 0, animate = true, fontsPending = false, viewport = 'desktop' } = {}) {
  const slots = [], effects = [], frames = new Map(), timers = new Map(), listeners = new Map()
  let cursor = 0, serial = 0, dirty = false, tree, resolveFonts
  const fontsReady = fontsPending ? new Promise(resolve => { resolveFonts = resolve }) : Promise.resolve()
  const preferenceListeners = new Set(), animationListeners = new Map()
  const query = { matches: animate,
    addEventListener(_type, callback) { preferenceListeners.add(callback) },
    removeEventListener(_type, callback) { preferenceListeners.delete(callback) },
  }
  const documentElement = { style: { overflow: 'auto', scrollbarGutter: '', scrollBehavior: 'smooth' } }
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
    getComputedStyle: () => ({ fontSize: '100px', lineHeight: '100px', transform: 'none', scrollbarGutter: 'auto', getPropertyValue: () => '0.8' }),
    requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id },
    cancelAnimationFrame(id) { frames.delete(id) },
    setTimeout(callback, delay) { const id = ++serial; timers.set(id, { callback, delay }); return id },
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
        slot?.cleanup?.(); slots[index] = { deps, cleanup: callback() }
      })
    },
  }
  react.useLayoutEffect = react.useEffect
  const jsx = (type, props, key) => ({ type, props, key })
  const module = { exports: {} }
  vm.runInNewContext(source, { module, exports: module.exports, window,
    document: { documentElement, body, fonts: { ready: fontsReady, load: () => fontsReady } }, Element,
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
    timeout(duration = 2400) { [...timers.values()].filter(timer => timer.delay <= duration).forEach(timer => timer.callback()); settle() },
    reduceMotion() { query.matches = false; preferenceListeners.forEach(callback => callback()); settle() },
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

test('a reload at an already scrolled position never covers the hero with a late intro', () => {
  const h = mount({ scrollY: 200 })
  try { assert.equal(h.tree, null) } finally { h.cleanup() }
})

test('the retained visible field completes an unblocked intro even when the decorative sweep never runs', async () => {
  const h = mount({ fontsPending: true })
  try {
    assert.ok(h.tree)
    assert.equal(h.documentElement.style.overflow, 'auto', 'Font preparation must not suppress native scrolling')
    assert.equal(h.documentElement.style.scrollbarGutter, '')
    await h.prepare()
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
    await h.prepare(); assert.equal(h.documentElement.style.overflow, 'auto')
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
  test(`${type} skips the preparing intro without suppressing native scroll or changing popup ownership`, async () => {
    const h = mount({ fontsPending: true })
    try {
      h.body.style.overflow = 'hidden'
      h.intent(type, { defaultPrevented: false }, false)
      assert.equal(h.documentElement.style.overflow, 'auto', 'The same input must reach native scrolling, not just dismiss a later frame')
      assert.equal(h.documentElement.style.scrollBehavior, 'smooth')
      h.scroll(180)
      assert.equal(h.scrollY, 180, 'The old keepPosition listener must be removed synchronously')
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

test('scroll keys release immediately without consuming their native action or interactive control keys', () => {
  for (const key of ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']) {
    const h = mount({ fontsPending: true })
    try {
      let prevented = false
      h.intent('keydown', { key, preventDefault() { prevented = true } }, false)
      assert.equal(h.documentElement.style.overflow, 'auto', key)
      assert.equal(prevented, false, 'Do not replace normal keyboard scrolling')
      h.settle()
      assert.equal(h.tree, null)
    } finally { h.cleanup() }
  }
  const h = mount({ fontsPending: true })
  try {
    h.intent('keydown', { key: ' ', target: h.interactiveTarget() })
    h.intent('keydown', { key: 'ArrowDown', defaultPrevented: true })
    h.intent('keydown', { key: 'ArrowDown', ctrlKey: true })
    assert.ok(h.tree, 'Interactive control keys must retain the intro until a real dismissal')
    assert.equal(h.documentElement.style.overflow, 'auto')
    h.escape()
    assert.equal(h.documentElement.style.overflow, 'auto')
  } finally { h.cleanup() }
})

test('stalled fonts or missing animations cannot leave the unfinished overlay beyond 2.4 seconds', async () => {
  const h = mount({ fontsPending: true })
  try {
    h.timeout(2300)
    assert.ok(h.tree)
    h.timeout(2400)
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
