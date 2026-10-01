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
test('a pointer moving 90 visual pixels under 90% scale stores 100 CSS pixels so the box follows the cursor', () => {
  assert.deepEqual(api.constrainPlacement({ ...block, value: {} }, 90, 40, [], { x: 0.9, y: 0.8 }), { offsetX: 100, offsetY: 50 })
})
test('east resize converts the visual box width to a bounded percent of its containing column', () => {
  assert.deepEqual(api.constrainPlacementWidth(block, 100, 800), { offsetX: 10, offsetY: 20, width: 37.5 })
  assert.deepEqual(api.constrainPlacementWidth(block, -1000, 800), { offsetX: 10, offsetY: 20, width: 10 })
  assert.deepEqual(api.constrainPlacementWidth(block, 1000, 800), { offsetX: 10, offsetY: 20, width: 87.5 })
})
test('a box can grow beyond its original column but never beyond the section edge', () => {
  const column = { ...block, value: {}, rect: { ...block.rect, width: 200 } }
  assert.deepEqual(api.constrainPlacementWidth(column, 100, 200), { width: 150 })
  assert.deepEqual(api.constrainPlacementWidth(column, 1000, 200), { width: 350 })
})
test('dragging an oversized mobile headline stays movable while a readable part remains visible', () => {
  const mobile = { ...block, value: {}, rect: { left: 0, top: 100, width: 600, height: 80 }, bounds: { left: 0, top: 0, width: 390, height: 800 } }
  assert.equal(api.constrainPlacement(mobile, 200, 0, []).offsetX, 200)
  assert.equal(api.constrainPlacement(mobile, -400, 0, []).offsetX, -400)
})
test('choosing an off-screen text box reveals it without requiring repeated scrolling', t => {
  const f = fixture(t)
  f.target.rect = { ...block.rect, top: 1400 }
  const calls = []
  f.target.scrollIntoView = options => calls.push(options)
  f.mode()
  assert.deepEqual(calls, [{ block: 'center', inline: 'nearest', behavior: 'instant' }])
})

function fixture(t, initiallyLoaded = true) {
  const old = new Map(['window', 'document', 'Element', 'ResizeObserver', 'MutationObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const sent = [], frozen = [], timers = new Map(), frames = new Map(), resizeObservers = [], mutationObservers = []
  let parentSequence = 0, applied = 1, timer = 0, frame = 0, textEditing = false, finishRequests = 0
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
    removeAttribute(key) { delete this[key] }
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
  const document = Object.assign(new Events(), { body, documentElement: { clientWidth: 800, scrollHeight: 900 }, createElement: tag => new Element(tag),
    createRange: () => ({ selectNodeContents(node) { this.node = node }, getBoundingClientRect() { return this.node.rangeRect ?? this.node.getBoundingClientRect() } }),
    querySelectorAll: selector => selector === '[data-site-layout]' ? targets : [], querySelector: selector => selector === '.canvas-editor-overlay' && textEditing ? { isConnected: true } : null })
  const window = Object.assign(new Events(), { location: { origin: 'https://placement.invalid' }, innerWidth: 800, innerHeight: 900, scrollX: 0, scrollY: 0,
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
  const runtime = api.createCanvasPlacementRuntime({ nonce: '11111111-1111-4111-8111-111111111111', page: 'notices', getAppliedSequence: () => applied, freeze: value => frozen.push(value), finishTextEdit: () => { if (!textEditing) return false; finishRequests++; return true } })
  const unmount = runtime.mount()
  t.after(() => { unmount(); for (const [key, descriptor] of old) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] } })
  const latest = type => sent.filter(item => item.type === type).at(-1)
  const receive = payload => window.dispatch('message', { source: window.parent, origin: window.location.origin, data: { channel: 'smyc-placement', version: 1, nonce: '11111111-1111-4111-8111-111111111111', previewPage: 'notices', sequence: ++parentSequence, ...payload } })
  const mode = () => { receive({ type: 'placement-mode', operationId: 'mode-1', mode: 'place', device: 'desktop' }); receive({ type: 'placement-select', id: block.id }) }
  const handle = () => body.children.find(node => node['data-placement-handle'])
  const grant = (before = {}) => receive({ type: 'placement-grant', requestId: latest('placement-begin').requestId, accepted: true, grant: { editId: 'edit-1', id: latest('placement-begin').id, device: 'desktop', baseDraftSequence: applied, before } })
  return { runtime, receive, latest, sent, frozen, target, window, document, mode, handle, grant, applied(value) { applied = value; runtime.refreshed() }, setTextEditing(value) { textEditing = value }, finishRequests: () => finishRequests,
    tick() { const queued = [...timers.values()]; timers.clear(); queued.forEach(fn => fn()) },
    frame() { const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn()) },
    resize(node = target) { resizeObservers.filter(observer => observer.targets.has(node)).forEach(observer => observer.callback([{ target: node }])) },
    mutate(addedNodes = [], removedNodes = []) { mutationObservers.filter(observer => observer.observing).forEach(observer => observer.callback([{ type: 'childList', addedNodes, removedNodes }])) },
    removeBlock(node) { targets.splice(targets.indexOf(node), 1); node.remove() },
    unmount,
    addBlock(id, rect) { const extra = new Element('p'); extra['data-site-layout'] = id; extra['data-site-layout-group'] = block.group; extra['data-site-layout-value'] = '{}'; extra.rect = rect; section.append(extra); targets.push(extra); return extra },
  }
}
test('handle drag previews locally before a parent grant and produces one commit on pointerup', t => {
  const f = fixture(t); f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 1, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 1, clientX: 130, clientY: 140 })
  assert.equal(f.target.style.translate, '30px 40px')
  assert.equal(f.latest('placement-commit'), undefined)
  assert.equal(f.frozen.length, 0)
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
test('a text box starts dragging directly without first using a direction button', t => {
  const f = fixture(t); f.mode()
  f.document.dispatch('pointerdown', { target: f.target, pointerId: 51, button: 0, isPrimary: true, clientX: 120, clientY: 120 })
  f.document.dispatch('pointermove', { pointerId: 51, clientX: 150, clientY: 140 })
  assert.equal(f.latest('placement-begin')?.id, block.id)
  f.grant()
  f.document.dispatch('pointerup', { pointerId: 51, clientX: 150, clientY: 140 })
  assert.deepEqual(f.latest('placement-commit').value, { offsetX: 30, offsetY: 20 })
})
test('a stationary text click stays available for text selection instead of starting placement', t => {
  const f = fixture(t); f.mode()
  f.document.dispatch('pointerdown', { target: f.target, pointerId: 52, button: 0, isPrimary: true, clientX: 120, clientY: 120 })
  f.document.dispatch('pointermove', { pointerId: 52, clientX: 123, clientY: 122 })
  f.document.dispatch('pointerup', { pointerId: 52, clientX: 123, clientY: 122 })
  assert.equal(f.latest('placement-begin'), undefined)
  assert.equal(f.latest('placement-selection').id, block.id)
})
test('a rejected drag grant restores the optimistic visual change without saving it', t => {
  const f = fixture(t); f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 31, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 31, clientX: 140, clientY: 100 })
  assert.equal(f.target.style.translate, '40px 0px')
  f.receive({ type: 'placement-grant', requestId: f.latest('placement-begin').requestId, accepted: false, reason: 'stale' })
  assert.equal(f.target.style.translate, '')
  assert.equal(f.latest('placement-commit'), undefined)
})
test('Escape while waiting for a grant immediately removes the drag preview', t => {
  const f = fixture(t); f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 32, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 32, clientX: 140, clientY: 100 })
  f.document.dispatch('keydown', { key: 'Escape' })
  assert.equal(f.target.style.translate, '')
  assert.equal(f.latest('placement-commit'), undefined)
})
test('dragging the move handle while typing finishes text and continues the same gesture after unlock', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  const border = f.document.body.children.find(node => node['data-placement-outline'])
  f.handle().dispatch('pointerdown', { pointerId: 41, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 41, clientX: 140, clientY: 100 })
  assert.equal(border.style.translate, '40px 0px')
  assert.equal(f.handle().style.translate, '40px 0px')
  f.document.dispatch('pointerup', { pointerId: 41, clientX: 140, clientY: 100 })
  assert.equal(f.finishRequests(), 1)
  assert.equal(f.latest('placement-begin'), undefined)
  f.setTextEditing(false)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  assert.equal(f.latest('placement-begin').id, block.id)
  f.grant()
  assert.equal(f.latest('placement-commit').value.offsetX, 40)
  assert.equal(border.style.translate, '')
})
test('automatic scroll anchoring during text handoff cannot invent vertical pointer movement', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  f.handle().dispatch('pointerdown', { pointerId: 44, button: 0, clientX: 100, clientY: 100 })
  f.window.scrollY = 43
  f.document.dispatch('pointerup', { pointerId: 44, clientX: 140, clientY: 100 })
  f.setTextEditing(false)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  f.grant()
  assert.equal(f.latest('placement-commit').value.offsetX, 40)
  assert.equal(f.latest('placement-commit').value.offsetY, 0)
})
test('scroll anchoring after the placement request starts still cannot move a horizontal handoff vertically', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  f.handle().dispatch('pointerdown', { pointerId: 46, button: 0, clientX: 100, clientY: 100 })
  f.setTextEditing(false); f.applied(2)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  f.window.scrollY = 43
  f.document.dispatch('pointerup', { pointerId: 46, clientX: 140, clientY: 100 })
  f.grant()
  assert.equal(f.latest('placement-commit').value.offsetX, 40)
  assert.equal(f.latest('placement-commit').value.offsetY, 0)
})
test('a moved and scaled preview frame uses screen pointer travel, not shifted child client coordinates', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  f.window.frameElement = { offsetWidth: 800, offsetHeight: 900, getBoundingClientRect: () => ({ width: 400, height: 450 }) }
  f.handle().dispatch('pointerdown', { pointerId: 47, button: 0, clientX: 100, clientY: 100, screenX: 500, screenY: 500 })
  f.setTextEditing(false); f.applied(2)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  f.document.dispatch('pointerup', { pointerId: 47, clientX: 140, clientY: 143, screenX: 540, screenY: 500 })
  f.grant()
  assert.equal(f.latest('placement-commit').value.offsetX, 80)
  assert.equal(f.latest('placement-commit').value.offsetY, 0)
})
test('a stale first placement grant after text commit retries once the parent has caught up', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  f.handle().dispatch('pointerdown', { pointerId: 45, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointerup', { pointerId: 45, clientX: 140, clientY: 100 })
  f.setTextEditing(false); f.applied(2)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  const first = f.latest('placement-begin')
  f.receive({ type: 'placement-grant', requestId: first.requestId, accepted: false, reason: 'stale' })
  f.frame()
  const second = f.latest('placement-begin')
  assert.notEqual(second.requestId, first.requestId)
  f.grant()
  assert.equal(f.latest('placement-commit').value.offsetX, 40)
})
test('failed text-to-placement retries clear the drag outline without changing layout', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  const border = f.document.body.children.find(node => node['data-placement-outline'])
  f.handle().dispatch('pointerdown', { pointerId: 48, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 48, clientX: 140, clientY: 100 })
  f.setTextEditing(false)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  for (let attempt = 0; attempt < 3; attempt++) {
    f.receive({ type: 'placement-grant', requestId: f.latest('placement-begin').requestId, accepted: false, reason: 'stale' })
    if (attempt < 2) f.frame()
  }
  assert.equal(border.style.translate, '')
  assert.equal(f.latest('placement-commit'), undefined)
  assert.equal(f.target.style.translate, '')
})
test('the same text-to-placement handoff can resize without losing the text edit', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  const resize = f.document.body.children.find(node => node['data-placement-resize'] === 'east')
  const border = f.document.body.children.find(node => node['data-placement-outline'])
  resize.dispatch('pointerdown', { pointerId: 42, button: 0, clientX: 300, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 42, clientX: 380, clientY: 100 })
  assert.equal(border.style.width, '280px')
  assert.equal(resize.style.translate, '80px 0px')
  f.document.dispatch('pointerup', { pointerId: 42, clientX: 380, clientY: 100 })
  assert.equal(f.finishRequests(), 1)
  f.setTextEditing(false)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  f.grant()
  assert.equal(f.latest('placement-commit').value.width, 35)
  const commit = f.latest('placement-commit')
  f.receive({ type: 'placement-result', editId: 'edit-1', operationId: commit.operationId, status: 'committed', resumeDraftSequence: 2 })
  f.applied(2)
  assert.match(f.document.body.children.find(node => node.role === 'status').textContent, /너비를 초안에 반영/)
  assert.equal(resize.style.translate, '')
})
test('Escape cancels a text-to-placement handoff without a layout write', t => {
  const f = fixture(t); f.mode(); f.setTextEditing(true)
  const border = f.document.body.children.find(node => node['data-placement-outline'])
  f.handle().dispatch('pointerdown', { pointerId: 43, button: 0, clientX: 100, clientY: 100 })
  f.document.dispatch('pointermove', { pointerId: 43, clientX: 140, clientY: 100 })
  f.document.dispatch('keydown', { key: 'Escape' })
  assert.equal(border.style.translate, '')
  f.setTextEditing(false)
  f.receive({ type: 'placement-mode', operationId: 'unlocked', mode: 'place', device: 'desktop' })
  assert.equal(f.latest('placement-begin'), undefined)
  assert.equal(f.latest('placement-commit'), undefined)
})
test('a scaled heading drag commits pointer movement in layout coordinates without lag', t => {
  const f = fixture(t)
  f.target.offsetWidth = 200 / 0.9
  f.target.offsetHeight = 50 / 0.9
  f.mode()
  f.handle().dispatch('pointerdown', { pointerId: 21, button: 0, clientX: 100, clientY: 100 })
  f.grant()
  f.document.dispatch('pointerup', { pointerId: 21, clientX: 190, clientY: 100 })
  assert.equal(f.latest('placement-commit').value.offsetX, 100)
})
test('selection border is draggable and east resize handle commits width once, with Escape restoring the box', t => {
  const f = fixture(t); f.mode()
  const border = f.document.body.children.find(node => node['data-placement-outline'])
  const resize = f.document.body.children.find(node => node['data-placement-resize'] === 'east')
  assert.ok(border); assert.ok(resize)
  border.dispatch('pointerdown', { pointerId: 3, button: 0, clientX: 100, clientY: 100 }); f.grant()
  f.document.dispatch('pointerup', { pointerId: 3, clientX: 120, clientY: 100 })
  assert.deepEqual(f.latest('placement-commit').value, { offsetX: 20, offsetY: 0 })
  f.receive({ type: 'placement-result', editId: 'edit-1', operationId: f.latest('placement-commit').operationId, status: 'committed', resumeDraftSequence: 2 })
  f.target.style.translate = '20px 0px'; f.target['data-site-layout-value'] = '{"offsetX":20}'
  f.applied(2)
  resize.dispatch('pointerdown', { pointerId: 4, button: 0, clientX: 300, clientY: 100 }); f.grant({ offsetX: 20 })
  f.document.dispatch('pointerup', { pointerId: 4, clientX: 400, clientY: 100 })
  assert.equal(f.latest('placement-commit').value.width, 37.5)
})
test('a tall selected text box keeps its resize handle in the visible portion of the box', t => {
  const f = fixture(t)
  f.target.rect = { left: 100, top: 0, width: 200, height: 2000 }
  f.mode()
  const resize = f.document.body.children.find(node => node['data-placement-resize'] === 'east')
  assert.equal(resize.style.top, '428px')

  // Scrolling away must not leave an unrelated handle floating at the viewport edge.
  f.target.rect = { left: 100, top: 1200, width: 200, height: 200 }
  f.runtime.refreshed()
  assert.equal(resize.style.top, '1278px')
})
test('scrolling a selected box completely out of view hides its floating controls until it returns', t => {
  const f = fixture(t)
  f.target.rect = { left: 100, top: -300, width: 200, height: 50 }
  f.mode()
  const resize = f.document.body.children.find(node => node['data-placement-resize'] === 'east')
  const border = f.document.body.children.find(node => node['data-placement-outline'])
  assert.equal(f.handle().hidden, true)
  assert.equal(resize.hidden, true)
  assert.equal(border.hidden, true)

  f.target.rect = { left: 100, top: 100, width: 200, height: 50 }
  f.runtime.refreshed()
  assert.equal(f.handle().hidden, false)
  assert.equal(resize.hidden, false)
  assert.equal(border.hidden, false)
})
test('clicking a decorated word selects its registered whole heading box', t => {
  const f = fixture(t); f.mode()
  f.receive({ type: 'placement-select', id: null })
  assert.equal(f.latest('placement-selection').id, null)
  const word = f.document.createElement('span')
  word['data-site-layout'] = 'notices.decorated-word'
  f.target.append(word)
  f.document.dispatch('click', { target: word })
  assert.equal(f.latest('placement-selection').id, block.id)
})
test('resizing with Escape restores the native inline width and does not save a replacement', t => {
  const f = fixture(t); f.mode()
  const resize = f.document.body.children.find(node => node['data-placement-resize'] === 'east')
  f.target.style.width = '65%'; f.target.style.maxWidth = '100%'
  resize.dispatch('pointerdown', { pointerId: 5, button: 0, clientX: 300, clientY: 100 }); f.grant()
  f.document.dispatch('pointermove', { pointerId: 5, clientX: 410, clientY: 100 })
  assert.notEqual(f.target.style.width, '65%')
  f.document.dispatch('keydown', { key: 'Escape' })
  assert.equal(f.target.style.width, '65%')
  assert.equal(f.latest('placement-commit').outcome, 'cancel')
})
test('the resize handle supports keyboard width nudges without a pointer', t => {
  const f = fixture(t); f.mode()
  const resize = f.document.body.children.find(node => node['data-placement-resize'] === 'east')
  f.document.dispatch('keydown', { target: resize, key: 'ArrowRight', shiftKey: true }); f.grant()
  assert.equal(f.latest('placement-commit').value.width, 26.3)
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
test('text selection and box placement can share one mode, but an active text overlay blocks a placement gesture', t => {
  const f = fixture(t); f.document.body.dataset.canvasEditMode = 'true'; f.mode()
  assert.equal(f.latest('placement-mode-result').accepted, true)
  assert.ok(f.handle())
  f.document.body.dataset.canvasEditPending = 'true'
  f.handle().dispatch('pointerdown', { pointerId: 10, button: 0, clientX: 100, clientY: 100 })
  assert.equal(f.latest('placement-begin'), undefined)
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
test('an inline source-owned text fragment registers its glyph box and becomes independently movable', t => {
  const f = fixture(t)
  f.target.tagName = 'SMYC-EDIT-TARGET'
  f.target.rect = { left: 0, top: 0, width: 0, height: 0 }
  f.target.rangeRect = { left: 120, top: 130, width: 180, height: 32 }
  f.target['data-site-layout'] = 'notices.title'; f.target['data-site-layout-group'] = 'notices.copy'
  f.target.textContent = '공지사항'
  f.mode()
  f.receive({ type: 'placement-select', id: 'notices.title' })
  assert.deepEqual(f.latest('placement-register').blocks[0].rect, { left: 120, top: 130, width: 180, height: 32 })
  assert.equal(f.latest('placement-register').blocks[0].label, '공지사항')
  f.handle().dispatch('pointerdown', { pointerId: 12, button: 0, clientX: 120, clientY: 130 }); f.grant()
  f.document.dispatch('pointerup', { pointerId: 12, clientX: 140, clientY: 130 })
  assert.equal(f.latest('placement-commit').value.offsetX, 20)
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
  f.document.body.dataset.canvasEditPending = 'true'; f.grant()
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
