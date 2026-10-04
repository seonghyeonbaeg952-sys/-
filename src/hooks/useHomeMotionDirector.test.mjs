import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./useHomeMotionDirector.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

// Execute the actual hook; only DOM geometry, media queries and the frame clock
// are controlled. Assert the resulting hero styles, not a mocked child surface.
function mount() {
  let cleanup, serial = 0
  const frames = new Map(), rootListeners = new Map(), windowListeners = new Map(), documentListeners = new Map()
  class Element {
    constructor(className) {
      this.className = className
      this.dataset = {}
      this.properties = new Map()
      this.classList = { contains: name => this.className === name }
      this.style = { getPropertyValue: key => this.properties.get(key) ?? '', setProperty: (key, value) => this.properties.set(key, value), removeProperty: key => this.properties.delete(key) }
    }
    closest(selectors) { return selectors.split(',').map(selector => selector.trim()).includes(`.${this.className}`) ? this : null }
    removeAttribute(name) { if (name === 'data-motion-pointer') delete this.dataset.motionPointer }
    getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 800, bottom: 800 } }
  }
  const hero = new Element('home-hero-section'), card = new Element('home-quick-action-card')
  const root = { dataset: {}, querySelectorAll: () => [], contains: element => element === hero || element === card,
    addEventListener: (name, callback) => rootListeners.set(name, callback), removeEventListener: name => rootListeners.delete(name) }
  const media = matches => ({ matches, addEventListener(_, callback) { this.change = callback }, removeEventListener() { delete this.change } })
  const reduced = media(false), fine = media(true)
  const window = { innerHeight: 800, matchMedia: query => query.includes('reduced-motion') ? reduced : fine,
    requestAnimationFrame: callback => { const id = ++serial; frames.set(id, callback); return id }, cancelAnimationFrame: id => frames.delete(id),
    addEventListener: (name, callback) => windowListeners.set(name, callback), removeEventListener: name => windowListeners.delete(name) }
  const document = { visibilityState: 'visible', addEventListener: (name, callback) => documentListeners.set(name, callback), removeEventListener: name => documentListeners.delete(name) }
  const exports = {}
  vm.runInNewContext(source, { exports, Element, window, document,
    ResizeObserver: class { observe() {} disconnect() {} }, IntersectionObserver: class { observe() {} disconnect() {} },
    require: name => { assert.equal(name, 'react'); return { useEffect: callback => { cleanup = callback() } } },
  })
  exports.useHomeMotionDirector({ current: root })
  const frame = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback()) }
  return { hero, card, reduced, fine, frames, frame,
    move(target = hero, x = 750, y = 200) { rootListeners.get('pointermove')?.({ target, clientX: x, clientY: y, pointerType: 'mouse' }); frame() },
    queueMove(target = hero) { rootListeners.get('pointermove')?.({ target, clientX: 750, clientY: 200, pointerType: 'mouse' }) },
    scroll() { windowListeners.get('scroll')?.() },
    leave() { rootListeners.get('pointerleave')?.() },
    cleanup() { cleanup(); assert.equal(frames.size, 0); assert.equal(rootListeners.size, 0); assert.equal(windowListeners.size, 0); assert.equal(documentListeners.size, 0) },
  }
}

test('the photographic hero keeps its existing pointer motion before the collage', () => {
  const h = mount()
  try {
    h.move()
    assert.equal(h.hero.dataset.motionPointer, 'true')
    assert.equal(h.hero.properties.get('--motion-pointer-x'), '0.750')
    assert.equal(h.hero.properties.get('--motion-pointer-shift-x'), '-3.00px')
  } finally { h.cleanup() }
})

test('a visible collage never reactivates photographic parallax or gradient repaint from pointer movement', () => {
  const h = mount()
  try {
    h.hero.dataset.paperTransition = 'playing'
    for (let n = 0; n < 20; n++) h.move(h.hero, n * 30, n * 20)
    assert.equal(h.hero.dataset.motionPointer, undefined)
    assert.equal(h.hero.properties.size, 0, 'Do not rewrite ten inherited pointer variables underneath the settled paper layers')
    h.move(h.card)
    assert.equal(h.card.dataset.motionPointer, 'true', 'Other intentional pointer surfaces are unchanged')
  } finally { h.cleanup() }
})

test('scrolling into the collage clears a pre-existing pointer surface without requiring another mouse move', () => {
  const h = mount()
  try {
    h.move()
    h.hero.dataset.paperTransition = 'playing'
    h.scroll()
    h.frame()
    assert.equal(h.hero.dataset.motionPointer, undefined)
    assert.equal(h.hero.properties.size, 0)
    h.hero.dataset.paperTransition = 'idle'
    h.move()
    assert.equal(h.hero.dataset.motionPointer, 'true', 'Returning to the photographic hero restores its original interaction')
  } finally { h.cleanup() }
})

test('a queued pointer frame respects a collage transition that started after the event', () => {
  const h = mount()
  try {
    h.queueMove()
    h.hero.dataset.paperTransition = 'playing'
    h.frame()
    assert.equal(h.hero.dataset.motionPointer, undefined)
    assert.equal(h.hero.properties.size, 0)
  } finally { h.cleanup() }
})

test('preference changes and unmount clear pointer ownership and queued frames', () => {
  const h = mount()
  h.move()
  h.reduced.matches = true
  h.reduced.change()
  assert.equal(h.hero.dataset.motionPointer, undefined)
  assert.equal(h.hero.properties.size, 0)
  h.queueMove()
  h.cleanup()
})

test('leaving the home surface cancels a queued pointer frame instead of reactivating it outside the page', () => {
  const h = mount()
  try {
    h.move()
    h.queueMove()
    h.leave()
    h.frame()
    assert.equal(h.hero.dataset.motionPointer, undefined)
    assert.equal(h.hero.properties.size, 0)
    assert.equal(h.frames.size, 0)
  } finally { h.cleanup() }
})
