import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

async function hold(kind) {
  const path = kind === 'v4' ? '../sample/HomeV4SamplePage.tsx' : './HomeSectionFlowSamplePage.tsx'
  const raw = await readFile(new URL(path, import.meta.url), 'utf8')
  const file = ts.createSourceFile(path, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let effect
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(file) === 'useLayoutEffect' && node.arguments[0]?.getText(file).includes('hold-track')) effect ??= node.arguments[0].getText(file)
    ts.forEachChild(node, visit)
  }
  visit(file)
  assert.ok(effect, 'test must execute the actual hold effect, not a duplicate algorithm')
  const frames = new Map(), timers = new Map(), listeners = new Map()
  let id = 0, reads = 0, disconnected = false
  const media = matches => ({ matches, addEventListener(_, cb) { this.change = cb }, removeEventListener(_, cb) { if (this.change === cb) delete this.change } })
  const desktop = media(true), reduced = media(false)
  function element(top, height = 2000) {
    const properties = new Map(), dataset = {}
    return { dataset, offsetParent: null, get offsetTop() { reads++; return top }, offsetHeight: height,
      style: { setProperty: (k,v) => properties.set(k,v), getPropertyValue: k => properties.get(k) ?? '', removeProperty: k => properties.delete(k) },
      removeAttribute(name) { delete dataset[name.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] },
      closest: () => null, classList: { contains: () => false },
    }
  }
  const track = element(1000), finale = element(3000), panel = element(0,400)
  const header = { getBoundingClientRect: () => ({ bottom: 72 }) }
  track.querySelector = () => panel
  const root = { ...element(0), querySelectorAll: () => [track], querySelector: selector => selector.includes('finale') ? finale : track }
  const shell = { querySelector: selector => selector.includes('header') ? header : root }
  const window = { scrollY: 0, innerWidth: 1440, innerHeight: 900,
    matchMedia: query => query.includes('reduced-motion') ? reduced : desktop,
    requestAnimationFrame: cb => { const token = ++id; frames.set(token,cb); return token }, cancelAnimationFrame: token => frames.delete(token),
    setTimeout: cb => { const token = ++id; timers.set(token,cb); return token }, clearTimeout: token => timers.delete(token),
    addEventListener: (event,cb) => listeners.set(event,cb), removeEventListener: (event,cb) => { if(listeners.get(event) === cb) listeners.delete(event) },
  }
  const exports = {}
  vm.runInNewContext(ts.transpileModule(`export const effect = ${effect}`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, window, document: { querySelector: () => root }, shellRef: { current: shell },
    ResizeObserver: class { observe() {} disconnect() { disconnected = true } },
  })
  const cleanup = exports.effect()
  function frame() { const batch = [...frames.values()]; frames.clear(); batch.forEach(cb => cb()) }
  function settle() { for(let n=0;frames.size && n<5;n++) frame(); const batch=[...timers.values()];timers.clear();batch.forEach(cb=>cb()); }
  settle(); reads = 0
  return { window, frames, timers, listeners, reduced, desktop, frame, settle, cleanup,
    reads: () => reads, state: () => track.dataset[kind === 'v4' ? 'v4HoldState' : 'holdState'], disconnected: () => disconnected,
    scroll(y) { window.scrollY=y;listeners.get('scroll')?.() },
  }
}

for (const kind of ['v4','flow']) {
  test(`${kind}: a burst of scroll events measures once at the next frame using the latest position`, async () => {
    const h = await hold(kind)
    for(let i=0;i<80;i++) h.scroll(1000+i*10)
    assert.equal(h.reads(), 0, 'scroll events must only schedule, not synchronously remeasure')
    assert.equal(h.frames.size, 1)
    h.frame(); assert.equal(h.state(),'fixed')
    assert.ok(h.reads() <= 2)
    h.scroll(4000); h.frame(); assert.equal(h.state(),'ended')
    h.scroll(0); h.frame(); assert.equal(h.state(),'before')
    h.cleanup()
  })
  test(`${kind}: reduced motion and mobile release hold, and unmount cancels pending work`, async () => {
    const h = await hold(kind)
    h.scroll(1500);h.frame();assert.equal(h.state(),'fixed')
    h.reduced.matches=true;h.reduced.change();h.frame();assert.equal(h.state(),undefined)
    h.reduced.matches=false;h.desktop.matches=false;h.desktop.change();h.frame();assert.equal(h.state(),undefined)
    h.scroll(4000);h.cleanup();
    assert.equal(h.frames.size,0);assert.equal(h.timers.size,0);assert.equal(h.listeners.size,0)
    assert.equal(h.disconnected(),true);assert.equal(h.state(),undefined)
  })
}
test('v4: pageshow restores the latest scroll state and queued work remains cancellable', async () => {
  const h = await hold('v4')
  h.scroll(1500);h.listeners.get('pageshow')();h.window.scrollY=4000;h.settle()
  assert.equal(h.state(),'ended')
  h.scroll(1000);h.listeners.get('pageshow')();h.cleanup()
  assert.equal(h.frames.size,0);assert.equal(h.timers.size,0)
})
