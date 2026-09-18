import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const api = await vite.ssrLoadModule('/src/components/site-editor/canvasPlacementRuntime.ts').catch(() => ({}))
const block = { id: 'notices.intro.title', label: '제목', group: 'notices.intro', value: { offsetX: 10, offsetY: 20 }, rect: { left: 100, top: 100, width: 200, height: 50 }, bounds: { left: 0, top: 50, width: 800, height: 400 } }
test('drag movement clamps to viewport and section bounds and snaps only same-group centres within six pixels', () => {
  assert.equal(typeof api.constrainPlacement, 'function')
  assert.deepEqual(api.constrainPlacement(block, 1000, -1000, []), { offsetX: 510, offsetY: -30 })
  const peer = { ...block, id: 'notices.intro.description', rect: { left: 300, top: 200, width: 200, height: 50 } }
  assert.deepEqual(api.constrainPlacement(block, 195, 96, [peer]), { offsetX: 210, offsetY: 120 })
  assert.deepEqual(api.constrainPlacement(block, 190, 90, [peer]), { offsetX: 200, offsetY: 110 })
  assert.deepEqual(api.constrainPlacement(block, 195, 96, [{ ...peer, group: 'elsewhere' }]), { offsetX: 205, offsetY: 116 })
})

function fixture(t, initiallyLoaded = true) {
  const old = new Map(['window', 'document', 'Element', 'ResizeObserver', 'MutationObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const sent = [], frozen = [], timers = new Map(), frames = new Map(), resizeObservers = [], mutationObservers = []
  let parentSequence = 0, applied = 1, timer = 0, frame = 0
  class Events {
    listeners = new Map()
    addEventListener(type, fn) { const list = this.listeners.get(type) ?? new Set(); list.add(fn); this.listeners.set(type, list) }
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn) }
    dispatch(type, data = {}) { const event = { type, target: this, preventDefault() {}, stopImmediatePropagation() {}, ...data }; for (const fn of this.listeners.get(type) ?? []) fn(event) }
  }
  class Element extends Events {
    constructor(tag) { super(); this.tagName = tag.toUpperCase(); this.style = { translate: '', setProperty(key, value) { this[key] = value } }; this.dataset = {}; this.parentElement = null; this.children = []; this.isConnected = false }
    append(...nodes) { nodes.forEach(node => { node.parentElement = this; node.isConnected = true; this.children.push(node) }) }
    remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(node => node !== this); this.isConnected = false }
    setAttribute(key, value) { this[key] = value }
    getAttribute(key) { return this[key] ?? null }
    querySelector(selector) { return this.children.find(node => selector === '[data-site-layout]' && node['data-site-layout']) ?? this.children.map(node => node.querySelector(selector)).find(Boolean) ?? null }
    closest(selector) { if (['section', 'section, main'].includes(selector) && this.tagName === 'SECTION') return this; if (selector === '[data-site-layout]' && this['data-site-layout']) return this; return this.parentElement?.closest(selector) ?? null }
    getBoundingClientRect() { return this.rect ?? { left: 0, top: 50, width: 800, height: 400 } }
    setPointerCapture() {}
    focus() { document.activeElement = this }
  }
  const body = new Element('body'), section = new Element('section'), target = new Element('h1')
  body.append(section); section.append(target)
  target['data-site-layout'] = block.id; target['data-site-layout-group'] = block.group; target['data-site-layout-value'] = '{}'; target.rect = block.rect
  const targets = initiallyLoaded ? [target] : []
  const document = Object.assign(new Events(), { body, documentElement: { clientWidth: 800, scrollHeight: 900 }, createElement: tag => new Element(tag), querySelectorAll: selector => selector === '[data-site-layout]' ? targets : [], querySelector: () => null })
  const window = Object.assign(new Events(), { location: { origin: 'https://placement.invalid' }, innerWidth: 800, scrollX: 0, scrollY: 0,
    parent: { postMessage(message) { sent.push(structuredClone(message)) } }, setTimeout(fn) { timers.set(++timer, fn); return timer }, clearTimeout(id) { timers.delete(id) },
    requestAnimationFrame(fn) { frames.set(++frame, fn); return frame }, cancelAnimationFrame(id) { frames.delete(id) } })
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); resizeObservers.push(this) }
    observe(node) { this.targets.add(node) }
    unobserve(node) { this.targets.delete(node) }
    disconnect() { this.targets.clear() }
  }
  class MutationObserver {
    constructor(callback) { this.callback = callback; this.observing = false; mutationObservers.push(this) }
    observe() { this.observing = true }
    disconnect() { this.observing = false }
  }
  Object.assign(globalThis, { window, document, Element, ResizeObserver, MutationObserver })
  assert.equal(typeof api.createCanvasPlacementRuntime, 'function')
  const runtime = api.createCanvasPlacementRuntime({ nonce: '11111111-1111-4111-8111-111111111111', page: 'notices', getAppliedSequence: () => applied, freeze: value => frozen.push(value) })
  const unmount = runtime.mount()
  t.after(() => { unmount(); for (const [key, descriptor] of old) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } })
  const latest = type => sent.filter(item => item.type === type).at(-1)
  const receive = payload => window.dispatch('message', { source: window.parent, origin: window.location.origin, data: { channel: 'smyc-placement', version: 1, nonce: '11111111-1111-4111-8111-111111111111', previewPage: 'notices', sequence: ++parentSequence, ...payload } })
  const mode = () => { receive({ type: 'placement-mode', operationId: 'mode-1', mode: 'place', device: 'desktop' }); receive({ type: 'placement-select', id: block.id }) }
  const handle = () => body.children.find(node => node['data-placement-handle'])
  const grant = (before = {}) => receive({ type: 'placement-grant', requestId: latest('placement-begin').requestId, accepted: true, grant: { editId: 'edit-1', id: block.id, device: 'desktop', baseDraftSequence: 1, before } })
  return { runtime, receive, latest, sent, frozen, target, window, document, mode, handle, grant, applied(value) { applied = value; runtime.refreshed() },
    tick() { const queued = [...timers.values()]; timers.clear(); queued.forEach(fn => fn()) },
    frame() { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn()) },
    resize(node = target) { resizeObservers.filter(observer => observer.targets.has(node)).forEach(observer => observer.callback([{ target: node }])) },
    mutate(addedNodes = [], removedNodes = []) { mutationObservers.filter(observer => observer.observing).forEach(observer => observer.callback([{ type: 'childList', addedNodes, removedNodes }])) },
    removeBlock(node) { targets.splice(targets.indexOf(node), 1); node.remove() },
    unmount,
    addBlock(id, rect) { const extra = new Element('p'); extra['data-site-layout'] = id; extra['data-site-layout-group'] = block.group; extra['data-site-layout-value'] = '{}'; extra.rect = rect; section.append(extra); targets.push(extra); return extra },
  }
}
test('handle drag is local until a parent grant and produces one commit on pointerup, retaining freeze until draft application', t => {
  const f = fixture(t); f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 1, clientX: 130, clientY: 140 })
  assert.equal(f.target.style.translate, '')
  f.grant()
  assert.equal(f.target.style.translate, '30px 40px')
  f.document.dispatch('pointerup', { pointerId: 1, clientX: 130, clientY: 140 })
  const commit = f.latest('placement-commit')
  assert.deepEqual(commit.value, { offsetX: 30, offsetY: 40 })
  assert.equal(f.sent.filter(item => item.type === 'placement-commit').length, 1)
  f.receive({ type: 'placement-result', editId: 'edit-1', operationId: commit.operationId, status: 'committed', resumeDraftSequence: 2 })
  assert.equal(f.latest('placement-selection').editId, 'edit-1')
  f.applied(2)
  assert.equal(f.target.style.translate, '')
  assert.equal(f.latest('placement-selection').editId, null)
  assert.equal(f.frozen.at(-1), false)
})
test('Escape or pointercancel restores the original inline translate and never submits replacement coordinates', t => {
  const f = fixture(t); f.mode(); f.target.style.translate = '0px 0px'
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 }); f.grant()
  f.document.dispatch('pointermove', { pointerId: 1, clientX: 170, clientY: 120 })
  f.document.dispatch('keydown', { key: 'Escape' })
  assert.equal(f.target.style.translate, '0px 0px')
  assert.equal(f.latest('placement-commit').outcome, 'cancel')
  assert.equal(Object.hasOwn(f.latest('placement-commit'), 'value'), false)
})
test('placement mode cannot activate while the text editor mode is enabled', t => {
  const f = fixture(t); f.document.body.dataset.canvasEditMode = 'true'; f.mode()
  assert.equal(f.latest('placement-mode-result').accepted, false)
  assert.equal(f.handle(), undefined)
})
test('arrow nudges use one CSS pixel or ten with Shift and still require a parent grant', t => {
  const f = fixture(t); f.mode()
  f.document.dispatch('keydown', { target: f.handle(), key: 'ArrowRight', shiftKey: true })
  assert.equal(f.target.style.translate, '')
  f.grant()
  assert.deepEqual(f.latest('placement-commit').value, { offsetX: 10, offsetY: 0 })
})

test('successful draft application preserves the new renderer translate instead of restoring the pre-drag value', t => {
  const f = fixture(t); f.mode(); f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 }); f.grant()
  f.document.dispatch('pointerup', { pointerId: 1, clientX: 130, clientY: 140 })
  const commit = f.latest('placement-commit')
  f.receive({ type: 'placement-result', editId: 'edit-1', operationId: commit.operationId, status: 'committed', resumeDraftSequence: 2 })
  f.target.style.translate = '30px 40px'
  f.target['data-site-layout-value'] = '{"offsetX":30,"offsetY":40}'
  f.applied(2)
  assert.equal(f.target.style.translate, '30px 40px')
})
test('keyboard movement remains precise beside an already centre-aligned peer', t => {
  const f = fixture(t); f.addBlock('notices.intro.description', block.rect); f.mode()
  f.document.dispatch('keydown', { target: f.handle(), key: 'ArrowRight' }); f.grant()
  assert.deepEqual(f.latest('placement-commit').value, { offsetX: 1, offsetY: 0 })
})
test('a hidden responsive duplicate does not remove the visible registered block', t => {
  const f = fixture(t); f.addBlock(block.id, { left: 0, top: 0, width: 0, height: 0 }); f.mode()
  assert.equal(f.latest('placement-register').blocks.length, 1)
  assert.ok(f.handle())
})
test('a handle click without movement does not create an apply transaction', t => {
  const f = fixture(t); f.mode(); f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 }); f.grant()
  f.document.dispatch('pointerup', { pointerId: 1, clientX: 100, clientY: 100 })
  assert.equal(f.latest('placement-commit').outcome, 'cancel')
})
test('a lost begin reply retries the same request and Escape releases pending state through the parent abort handshake', t => {
  const f = fixture(t); f.mode(); f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  const begin = f.latest('placement-begin')
  f.tick()
  assert.equal(f.sent.filter(item => item.type === 'placement-begin').length, 2)
  assert.equal(f.latest('placement-begin').requestId, begin.requestId)
  f.document.dispatch('keydown', { key: 'Escape' })
  assert.equal(f.latest('placement-abort').requestId, begin.requestId)
  f.receive({ type: 'placement-aborted', requestId: begin.requestId })
  f.handle().dispatch('pointerdown', { pointerId: 2, button: 0, clientX: 100, clientY: 100 })
  assert.notEqual(f.latest('placement-begin').requestId, begin.requestId)
})
test('a clamped renderer offset is the movement base while the parent grant retains the original stored value', t => {
  const f = fixture(t)
  f.target['data-site-layout-value'] = '{"offsetX":500,"offsetY":200}'
  f.target.style.translate = '100px 80px'
  f.mode()
  assert.deepEqual(f.latest('placement-register').blocks[0].value, { offsetX: 500, offsetY: 200 })
  assert.deepEqual(f.latest('placement-register').blocks[0].renderedOffsets, { x: 100, y: 80 })
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  f.grant({ offsetX: 500, offsetY: 200 })
  assert.equal(f.target.style.translate, '100px 80px', 'grant without movement must not jump to the unclamped stored position')
  f.document.dispatch('pointerup', { pointerId: 1, clientX: 110, clientY: 110 })
  assert.deepEqual(f.latest('placement-commit').value, { offsetX: 110, offsetY: 90 })
})

test('missing inline translation uses stored offsets as display geometry without changing the saved value', t => {
  const f = fixture(t); f.target['data-site-layout-value'] = '{"offsetX":45,"offsetY":-20,"width":70}'; f.mode()
  const registered = f.latest('placement-register').blocks[0]
  assert.deepEqual(registered.renderedOffsets, { x: 45, y: -20 })
  assert.deepEqual(registered.value, { offsetX: 45, offsetY: -20, width: 70 })
})

test('unsupported inline translation cannot enter the registry as trusted pixel geometry', t => {
  const f = fixture(t); f.target.style.translate = '50% 20px'; f.mode()
  assert.deepEqual(f.latest('placement-register').blocks, [])
  assert.equal(f.handle(), undefined)
})
test('snapping displays explicit centre guides and pointer cancellation removes them', t => {
  const f = fixture(t); f.addBlock('notices.intro.description', { left: 300, top: 200, width: 200, height: 50 }); f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 }); f.grant()
  f.document.dispatch('pointermove', { pointerId: 1, clientX: 295, clientY: 196 })
  const guides = f.document.body.children.filter(node => node['data-placement-guide'])
  assert.equal(guides.length, 2)
  assert.equal(guides.find(node => node['data-placement-guide'] === 'x').style.left, '400px')
  f.document.dispatch('pointercancel', { pointerId: 1, clientX: 295, clientY: 196 })
  assert.equal(f.latest('placement-commit').outcome, 'cancel')
  assert.equal(guides.every(node => node.hidden), true)
})
test('a text-editor activation crossing a pending placement grant does not acquire or release the shared freeze', t => {
  const f = fixture(t); f.mode(); f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  f.document.body.dataset.canvasEditMode = 'true'; f.grant()
  assert.deepEqual(f.frozen, [])
  const commit = f.latest('placement-commit')
  assert.equal(commit.outcome, 'cancel')
  f.receive({ type: 'placement-result', editId: 'edit-1', operationId: commit.operationId, status: 'cancelled', resumeDraftSequence: 1 })
  assert.deepEqual(f.frozen, [])
})
test('an accepted grant crossing pending cancellation is fully released by the abort acknowledgement', t => {
  const f = fixture(t); f.mode(); f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  const requestId = f.latest('placement-begin').requestId
  f.document.dispatch('keydown', { key: 'Escape' }); f.grant()
  f.receive({ type: 'placement-aborted', requestId })
  assert.equal(f.target.style.translate, '')
  assert.equal(f.latest('placement-selection').editId, null)
  f.handle().dispatch('pointerdown', { pointerId: 2, button: 0, clientX: 100, clientY: 100 })
  assert.notEqual(f.latest('placement-begin').requestId, requestId)
})
test('drag bounds match the renderer section content reachability as well as the viewport', t => {
  const f = fixture(t); f.target.parentElement.rect = { left: 50, top: 50, width: 700, height: 400 }; f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 }); f.grant()
  f.document.dispatch('pointerup', { pointerId: 1, clientX: 1100, clientY: 100 })
  assert.deepEqual(f.latest('placement-commit').value, { offsetX: 450, offsetY: 0 })
})
test('the explicit move handle receives focus after pointer selection so subsequent arrow keys reach placement editing', t => {
  const f = fixture(t); f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  assert.equal(f.document.activeElement, f.handle())
})

test('resized text and its renderer clamp publish final geometry once per animation frame', t => {
  const f = fixture(t); f.mode()
  const count = f.sent.filter(item => item.type === 'placement-register').length
  f.resize(); f.resize(f.target.parentElement)
  f.target.rect = { left: 120, top: 130, width: 300, height: 160 }
  f.target.style.translate = '20px 30px'
  assert.equal(f.sent.filter(item => item.type === 'placement-register').length, count)
  f.frame()
  assert.deepEqual(f.latest('placement-register').blocks[0].rect, { left: 120, top: 130, width: 300, height: 160 })
  assert.deepEqual(f.latest('placement-register').blocks[0].renderedOffsets, { x: 20, y: 30 })
  assert.equal(f.sent.filter(item => item.type === 'placement-register').length, count + 1)
  f.resize(); f.frame()
  assert.equal(f.sent.filter(item => item.type === 'placement-register').length, count + 1, 'unchanged geometry does not republish')
})

test('late nested layout nodes register after loading and disappear after subtree removal', t => {
  const f = fixture(t, false); f.mode()
  assert.deepEqual(f.latest('placement-register').blocks, [])
  const late = f.addBlock(block.id, block.rect)
  f.mutate([late.parentElement]); f.frame()
  assert.equal(f.latest('placement-register').blocks.length, 1)
  assert.equal(f.latest('placement-register').blocks[0].id, block.id)
  f.removeBlock(late); f.mutate([], [late]); f.frame()
  assert.deepEqual(f.latest('placement-register').blocks, [])
})

test('editor overlay child changes do not discover unrelated layout nodes or trigger registry work', t => {
  const f = fixture(t); f.mode()
  f.addBlock('notices.intro.description', block.rect)
  const count = f.sent.length
  f.mutate([f.handle()]); f.frame()
  assert.equal(f.sent.length, count)
  assert.equal(f.latest('placement-register').blocks.length, 1)
})

test('unmount cancels scheduled geometry work and disconnects mutation and resize observation', t => {
  const f = fixture(t); f.mode()
  f.resize(); f.unmount()
  const count = f.sent.length
  f.target.rect = { ...block.rect, height: 300 }
  const late = f.addBlock('notices.intro.description', block.rect)
  f.resize(); f.mutate([late]); f.frame()
  assert.equal(f.sent.length, count)
})
