import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('./homeQuickActionsScroll.ts', import.meta.url), 'utf8').catch(() => '')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function mount({ desktop = true, reduced = false, scrollY = 0 } = {}) {
  const frames = new Map(), windowListeners = new Map(), quickListeners = new Map(), properties = new Map()
  let frameId = 0, geometryReads = 0, resizeCallback
  const media = matches => ({ matches, addEventListener(_, callback) { this.change = callback }, removeEventListener() { delete this.change } })
  const desktopQuery = media(desktop), reducedQuery = media(reduced)
  const attributes = new Map()
  const child = {}
  const grid = { offsetHeight: 152 }
  const quick = {
    dataset: {}, isConnected: true, inert: false,
    querySelector: () => desktop ? grid : null,
    contains: value => value === child,
    getBoundingClientRect() { geometryReads++; return { top: 900 - window.scrollY, height: 210 } },
    setAttribute: (name, value) => attributes.set(name, value), removeAttribute: name => attributes.delete(name),
    addEventListener: (name, callback) => quickListeners.set(name, callback), removeEventListener: name => quickListeners.delete(name),
  }
  const shell = { querySelector: selector => selector === '.home-quick-actions' ? quick : selector === '.home-v4-sample-header' ? { offsetHeight: 72 } : grid,
    style: { setProperty: (name, value) => properties.set(name, value), removeProperty: name => properties.delete(name) },
  }
  const document = { activeElement: null, documentElement: { scrollHeight: 6000 } }
  const window = { scrollY, innerHeight: 900,
    matchMedia: query => query.includes('reduced-motion') ? reducedQuery : desktopQuery,
    requestAnimationFrame: callback => { const id = ++frameId; frames.set(id, callback); return id }, cancelAnimationFrame: id => frames.delete(id),
    addEventListener: (name, callback) => windowListeners.set(name, callback), removeEventListener: name => windowListeners.delete(name),
  }
  const exports = {}
  vm.runInNewContext(compiled, { exports, window, document,
    ResizeObserver: class { constructor(callback) { resizeCallback = callback } observe() {} disconnect() {} },
    MutationObserver: class { observe() {} disconnect() {} },
  })
  assert.equal(typeof exports.observeHomeQuickActionsScroll, 'function', 'The actual quick-menu scroll controller must be implemented')
  const dispose = exports.observeHomeQuickActionsScroll(shell)
  const frame = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()) }
  frame()
  return { quick, attributes, properties, frames, desktopQuery, reducedQuery, frame,
    geometryReads: () => geometryReads,
    scroll(y) { window.scrollY = y; windowListeners.get('scroll')?.() },
    focus() { document.activeElement = child; quickListeners.get('focusin')?.(); frame() },
    blur() { document.activeElement = null; quickListeners.get('focusout')?.(); frame() },
    resize(height) { grid.offsetHeight = height; resizeCallback?.(); frame() },
    dispose() { dispose(); assert.equal(frames.size, 0); assert.equal(windowListeners.size, 0); assert.equal(quickListeners.size, 0); assert.equal(quick.inert, false) },
  }
}

test('quick links hide on downward scroll and return on upward scroll before reaching the top', () => {
  const h = mount()
  try {
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    h.scroll(120); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'true')
    assert.equal(h.quick.inert, true)
    assert.equal(h.attributes.get('aria-hidden'), 'true')
    h.scroll(96); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    assert.equal(h.quick.inert, false)
    assert.equal(h.attributes.has('aria-hidden'), false)
    h.scroll(200); h.frame(); h.scroll(0); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
  } finally { h.dispose() }
})

test('wheel bursts and small reversals do not measure layout, collapse the guide, or flicker', () => {
  const h = mount()
  try {
    const geometry = [...h.properties]
    const reads = h.geometryReads()
    for (let y = 20; y <= 120; y++) h.scroll(y)
    assert.equal(h.frames.size, 1)
    h.frame()
    for (const y of [118, 120, 117, 119, 116]) { h.scroll(y); h.frame() }
    assert.equal(h.quick.dataset.quickScrollHidden, 'true')
    assert.deepEqual([...h.properties], geometry, 'Visibility must not alter height, margins, or padding while scrolling')
    assert.equal(h.geometryReads(), reads, 'Geometry is cached outside scroll frames')
    h.scroll(100); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
  } finally { h.dispose() }
})

test('keyboard focus keeps the links available and only a later downward scroll hides them', () => {
  const h = mount()
  try {
    h.focus(); h.scroll(160); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    h.blur()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    h.scroll(190); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'true')
  } finally { h.dispose() }
})

test('compact touch layouts keep links visible until the menu reaches the upper viewport', () => {
  const h = mount({ desktop: false })
  try {
    h.scroll(500); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    h.scroll(850); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'true')
    h.scroll(825); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    assert.equal(h.properties.size, 0, 'Compact flow must not receive desktop overlap geometry')
  } finally { h.dispose() }
})

test('reduced motion keeps functional scroll visibility without desktop collapse geometry', () => {
  const h = mount({ reduced: true })
  try {
    h.scroll(850); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'true')
    h.scroll(820); h.frame()
    assert.equal(h.quick.dataset.quickScrollHidden, 'false')
    assert.equal(h.properties.size, 0)
  } finally { h.dispose() }
})

test('resizing measures the resting grid once and cleanup removes pending scroll work', () => {
  const h = mount()
  h.resize(128)
  assert.equal(h.properties.get('--home-v4-guide-exit-height'), '144px')
  h.scroll(150)
  h.dispose()
  assert.equal(h.properties.size, 0)
})
