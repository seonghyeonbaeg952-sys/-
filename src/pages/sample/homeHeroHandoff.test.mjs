import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const raw = await readFile(new URL('./HomeV4SamplePage.tsx', import.meta.url), 'utf8')
const file = ts.createSourceFile('HomeV4SamplePage.tsx', raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
let effect
function visit(node) {
  if (ts.isCallExpression(node) && node.expression.getText(file) === 'useLayoutEffect' && node.arguments[0]?.getText(file).includes('paperPieceFinalOffsets')) effect = node.arguments[0].getText(file)
  ts.forEachChild(node, visit)
}
visit(file)
assert.ok(effect, 'Execute the actual production handoff effect, not a copied timing algorithm')

function mount() {
  let clock = 0, serial = 0
  const frames = new Map(), listeners = new Map(), properties = new Map()
  const media = matches => ({ matches, addEventListener(_, callback) { this.change = callback }, removeEventListener() { delete this.change } })
  const desktop = media(true), reduced = media(false)
  const pieces = Array.from({ length: 26 }, () => ({ style: { removeProperty(key) { delete this[key] } } }))
  const hero = { dataset: {}, querySelectorAll: () => pieces, removeAttribute() { delete this.dataset.paperTransition } }
  const intro = { querySelector: () => hero, getBoundingClientRect: () => ({ top: -window.scrollY }) }
  const shell = { querySelector: () => intro, style: { setProperty: (key, value) => properties.set(key, value), removeProperty: key => properties.delete(key) } }
  const window = {
    innerHeight: 900, scrollY: 0,
    matchMedia: query => query.includes('reduced-motion') ? reduced : desktop,
    getComputedStyle: () => ({ getPropertyValue: () => '168px' }),
    requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id },
    cancelAnimationFrame(id) { frames.delete(id) },
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
  }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(`export const effect = ${effect}`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, window, shellRef: { current: shell }, performance: { now: () => clock } })
  const cleanup = exports.effect()
  return {
    properties, pieces, hero, frames, desktop, reduced, cleanup,
    scroll(y) { window.scrollY = y; listeners.get('scroll')?.() },
    advance(ms) { clock += ms; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(clock)) },
  }
}

test('the collage retains its authored assembly and reverse pacing without truncating the final logo', () => {
  const h = mount()
  try {
    h.scroll(100)
    h.advance(1400)
    assert.equal(h.properties.get('--home-v4-paper-seal-opacity'), '0', 'Do not compress the authored assembly into the startup hold budget')
    assert.equal(h.frames.size, 1)
    const middle = h.pieces.map(piece => piece.style.transform)
    h.advance(1880)
    assert.equal(h.properties.get('--home-v4-paper-seal-opacity'), '1')
    assert.equal(h.frames.size, 0, 'Stop work once all paper pieces have settled')
    assert.ok(h.pieces.every(piece => piece.style.opacity === '1'))
    assert.notEqual(h.pieces.at(-1).style.transform, middle.at(-1), 'The delayed centre logo completes its trajectory')
    h.scroll(0)
    h.advance(600)
    assert.equal(h.frames.size, 1, 'Reverse motion must retain its original pacing too')
    h.advance(360)
    assert.equal(h.properties.get('--home-v4-guide-exit-opacity'), '1', 'Reverse returns the original quick menu without a long wait')
    assert.equal(h.frames.size, 0)
    assert.ok(h.pieces.every(piece => piece.style.opacity === '0'))
  } finally { h.cleanup() }
})

for (const mode of ['reduced', 'desktop']) {
  test(`changing ${mode} during the handoff cancels active frames without restoring stale inline motion`, () => {
    const h = mount()
    try {
      h.scroll(100)
      h.advance(200)
      assert.equal(h.frames.size, 1)
      h[mode].matches = mode === 'reduced'
      h[mode].change()
      assert.equal(h.frames.size, 0)
      assert.equal(h.properties.size, 0)
      h.advance(2000)
      assert.equal(h.properties.size, 0, 'A queued frame must not undo the compact/reduced-motion reset')
    } finally { h.cleanup() }
  })
}

test('the collage remains active through reverse assembly until the visible paper pieces are hidden', () => {
  const h = mount()
  try {
    h.scroll(100)
    h.advance(3280)
    h.scroll(0)
    assert.equal(h.hero.dataset.paperTransition, 'playing', 'Do not resume photographic pointer motion while reverse paper layers are still visible')
    h.advance(600)
    assert.equal(h.hero.dataset.paperTransition, 'playing')
    assert.ok(h.pieces.some(piece => piece.style.opacity === '1'))
    h.advance(360)
    assert.equal(h.hero.dataset.paperTransition, 'idle')
    assert.ok(h.pieces.every(piece => piece.style.opacity === '0'))
  } finally { h.cleanup() }
})
