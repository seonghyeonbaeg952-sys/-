import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const compile = async file => ts.transpileModule(await readFile(new URL(file, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const sources = Object.fromEntries(await Promise.all(['./canvasLayout', './textBoxGeometry', './useTextBoxLayout']
  .map(async name => [name, await compile(`${name}.ts`)])))

// Execute the real hook and geometry. Only the DOM, React effect lifecycle and
// observer/frame clock are supplied; assertions inspect the resulting position.
function mount({ animation = 'self', layout = { offsetX: -38, offsetY: 83.1 } } = {}) {
  let cleanup, moving = animation !== 'none', serial = 0
  const frames = new Map(), listeners = new Map(), observers = []
  const style = { translate: '', transform: animation === 'self' ? 'translateX(-150px)' : '' }
  const parent = { style: { transform: animation === 'ancestor' ? 'translateX(-150px)' : '' }, parentElement: null,
    matches: () => false, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 816 }) }
  const section = { style: { transform: '' }, parentElement: null, matches: selector => selector === 'section, main',
    getBoundingClientRect: () => ({ left: 0, right: 1440, top: 0, bottom: 816, width: 1440, height: 816 }) }
  parent.parentElement = section
  const view = { innerWidth: 1440, getComputedStyle: el => ({ transform: moving && el.style.transform ? 'matrix(0.955, 0, 0, 0.955, -150, 0)' : 'none' }) }
  const node = { style, parentElement: parent, offsetWidth: 763, offsetHeight: 203,
    ownerDocument: { defaultView: view, documentElement: { clientWidth: 1440 } }, closest: () => section,
    matches: () => false,
    getBoundingClientRect() {
      const [x, y] = style.translate.split(' ').map(Number.parseFloat)
      // The entering frame appears outside the section even though the saved
      // placement is valid. The resting glyph bounds begin at x=38, y=112.
      const left = 38 + (x || 0) - (moving ? 150 : 0), top = 112 + (y || 0)
      const width = moving && animation === 'self' ? 729 : 763
      return { left, top, right: left + width, bottom: top + 203, width, height: 203 }
    } }
  const window = { requestAnimationFrame: callback => { const id = ++serial; frames.set(id, callback); return id },
    cancelAnimationFrame: id => frames.delete(id), addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name), getComputedStyle: view.getComputedStyle }
  class Observer {
    constructor(callback) { this.callback = callback; this.connected = true; observers.push(this) }
    observe() {}
    disconnect() { this.connected = false }
  }
  const modules = new Map()
  const require = name => {
    if (name === 'react') return { useRef: () => ({ current: node }), useLayoutEffect: fn => { cleanup = fn() } }
    if (!modules.has(name)) {
      const exports = {}
      modules.set(name, exports)
      vm.runInNewContext(sources[name], { exports, require, window, ResizeObserver: Observer, MutationObserver: Observer })
    }
    return modules.get(name)
  }
  require('./useTextBoxLayout').useTextBoxLayout(layout)
  const flush = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()) }
  return { node, frames,
    settle() { moving = false; style.transform = ''; parent.style.transform = ''; observers.filter(o => o.connected).forEach(o => o.callback([])); flush() },
    resize() { listeners.get('resize')?.(); flush() },
    cleanup() { cleanup(); assert.equal(frames.size, 0); assert.equal(listeners.size, 0); assert.ok(observers.every(o => !o.connected)) },
  }
}

test('a saved SPIRIT position is not replaced by bounds measured during its entrance animation', () => {
  const h = mount()
  try {
    assert.equal(h.node.style.translate, '-38px 83.1px')
    h.settle()
    assert.equal(h.node.style.translate, '-38px 83.1px')
  } finally { h.cleanup() }
})

test('an entering ancestor cannot leave a permanent correction on a child text box', () => {
  const h = mount({ animation: 'ancestor' })
  try {
    assert.equal(h.node.style.translate, '-38px 83.1px')
    h.settle()
    assert.equal(h.node.style.translate, '-38px 83.1px')
  } finally { h.cleanup() }
})

test('actual out-of-bounds saved positions are still constrained after the animation settles', () => {
  const h = mount({ layout: { offsetX: -900, offsetY: 1000 } })
  try {
    h.settle()
    assert.equal(h.node.style.translate, '-38px 501px')
    h.resize()
    assert.equal(h.node.style.translate, '-38px 501px')
  } finally { h.cleanup() }
})

test('reduced-motion and non-animated boxes keep immediate bounds protection', () => {
  const h = mount({ animation: 'none', layout: { offsetX: -900, offsetY: 1000 } })
  try { assert.equal(h.node.style.translate, '-38px 501px') } finally { h.cleanup() }
})
