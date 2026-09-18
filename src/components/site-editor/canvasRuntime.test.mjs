import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { createCanvasRuntime } = await vite.ssrLoadModule('/src/components/site-editor/canvasRuntime.ts')
const { CANVAS_PROTOCOL_CHANNEL, CANVAS_PROTOCOL_VERSION, parseCanvasMessage } = await vite.ssrLoadModule('/src/lib/siteEditorCanvasProtocol.ts')

// Controlled native boundaries only: production runtime, buffer, protocol, DOM
// mapping and style code all execute. No browser storage, network or real data.
function fixture(t) {
  const origin = 'https://canvas.example.invalid', nonce = '11111111-1111-4111-8111-111111111111'
  const originalGlobals = new Map(['window', 'document', 'Element', 'getComputedStyle', 'ResizeObserver'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const sent = [], frozen = [], timers = new Map(), observers = []
  let now = 0, timerId = 0, parentSequence = 0, appliedSequence = 1
  class Events {
    listeners = new Map()
    addEventListener(type, listener) { const group = this.listeners.get(type) ?? new Set(); group.add(listener); this.listeners.set(type, group) }
    removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener) }
    dispatch(type, detail = {}) {
      const event = { target: this, defaultPrevented: false, stopped: false, preventDefault() { this.defaultPrevented = true }, stopImmediatePropagation() { this.stopped = true }, ...detail }
      for (const listener of this.listeners.get(type) ?? []) { listener(event); if (event.stopped) break }
      return event
    }
  }
  class Element extends Events {
    constructor(name, type = 1, value = '') {
      super(); this.nodeName = name.toUpperCase(); this.nodeType = type; this.value = value
      this.childNodes = []; this.parentNode = null; this.ownerDocument = document; this.isConnected = false
      this.attributes = new Map(); this.dataset = {}; this.style = { visibility: '', setProperty(key, next) { this[key] = next } }
    }
    get parentElement() { return this.parentNode?.nodeType === 1 ? this.parentNode : null }
    get textContent() { return this.nodeType === 3 ? this.value : this.childNodes.map(child => child.textContent).join('') }
    set textContent(value) { if (this.nodeType === 3) this.value = value; else this.replaceChildren(document.createTextNode(value)) }
    setAttribute(key, value) { this.attributes.set(key, value) }
    getAttribute(key) { return this.attributes.get(key) ?? null }
    appendChild(child) {
      if (child.nodeType === 11) { for (const node of [...child.childNodes]) this.appendChild(node); child.childNodes = [] }
      else { child.remove(); child.parentNode = this; child.isConnected = this.isConnected; this.childNodes.push(child) }
      return child
    }
    append(...children) { children.forEach(child => this.appendChild(child)) }
    replaceChildren(...children) { for (const child of [...this.childNodes]) child.remove(); this.append(...children) }
    remove() { if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter(child => child !== this); this.parentNode = null; this.isConnected = false }
    contains(node) { return node === this || this.childNodes.some(child => child.contains(node)) }
    focus() { document.activeElement = this }
    getBoundingClientRect() { return { left: 80, top: 180, right: 720, bottom: 220, width: 640, height: 40, ...this.box, toJSON() { return { left: this.left, top: this.top, width: this.width } } } }
  }
  const nativeSelection = { rangeCount: 0, anchorNode: null, anchorOffset: 0, focusNode: null, focusOffset: 0,
    setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset) { Object.assign(this, { rangeCount: 1, anchorNode, anchorOffset, focusNode, focusOffset }) } }
  const document = Object.assign(new Events(), {
    createElement: name => new Element(name), createTextNode: value => new Element('#text', 3, value), createDocumentFragment: () => new Element('#fragment', 11),
    getSelection: () => nativeSelection,
    createRange: () => ({ node: null, selectNodeContents(node) { this.node = node }, getBoundingClientRect() { return this.node.glyphBox ?? this.node.getBoundingClientRect() } }),
  })
  document.body = document.createElement('body'); document.body.isConnected = true
  const window = Object.assign(new Events(), {
    location: { origin }, scrollX: 0, scrollY: 0,
    parent: { postMessage(message, targetOrigin) { assert.equal(targetOrigin, origin); assert.ok(parseCanvasMessage(message)); sent.push(structuredClone(message)) } },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id },
    clearTimeout(id) { timers.delete(id) },
  })
  class ResizeObserver {
    constructor(callback) { this.callback = callback; this.targets = new Set(); observers.push(this) }
    observe(node) { this.targets.add(node) }
    disconnect() { this.targets.clear() }
  }
  Object.assign(globalThis, { window, document, Element, ResizeObserver, getComputedStyle: node => ({ display: 'block', textAlign: 'left', getPropertyValue: () => '0', ...node.computed }) })
  const runtime = createCanvasRuntime({ nonce, page: 'notices', getDraftSequence: () => appliedSequence, freeze: value => frozen.push(value) })
  const unmount = runtime.mount()
  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true; unmount()
    for (const [key, descriptor] of originalGlobals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
  }
  t.after(dispose)
  const target = document.createElement('smyc-edit-target'), paragraph = document.createElement('p')
  target.textContent = '공지사항'; paragraph.append(target); document.body.append(paragraph); target.isConnected = true
  runtime.registry.register({ instanceId: 'title', ownerPage: 'notices', key: 'notices.title', text: '공지사항', fullText: '공지사항', offset: 0, element: target })
  const messages = type => sent.filter(message => message.type === type)
  const latest = type => messages(type).at(-1)
  const receive = payload => {
    const message = { channel: CANVAS_PROTOCOL_CHANNEL, version: CANVAS_PROTOCOL_VERSION, nonce, previewPage: 'notices', sequence: ++parentSequence, ...payload }
    assert.ok(parseCanvasMessage(message), `fixture sends a valid ${payload.type}`)
    window.dispatch('message', { source: window.parent, origin, data: message })
  }
  const editor = () => document.body.childNodes.find(node => node.className === 'canvas-editor-overlay')
  const open = () => {
    receive({ type: 'canvas-mode', operationId: 'mode', mode: 'edit', scope: 'desktop', device: 'desktop' })
    const block = latest('canvas-register').blocks[0]
    receive({ type: 'canvas-begin', operationId: 'begin', blockId: block.id, blockRevision: block.revision })
    assert.equal(editor(), undefined, 'registration and begin do not grant DOM editing')
    receive({ type: 'canvas-editgrant', requestId: latest('canvas-editbegin').requestId, accepted: true,
      grant: { editId: 'edit-1', blockId: block.id, blockRevision: block.revision, ownerPage: 'notices', scope: 'desktop', device: 'desktop', baseDraftSequence: 1,
        fields: [{ source: { ownerPage: 'notices', scope: 'desktop', key: 'notices.title' }, fieldVersion: 'field-1', text: '공지사항', runs: [], ranges: [{ start: 0, end: 4 }] }] } })
    assert.ok(editor()); return editor()
  }
  const action = value => receive({ type: 'canvas-action', editId: 'edit-1', operationId: `action-${parentSequence}`, expectedLocalRevision: latest('canvas-selection').localRevision, action: value })
  const format = patch => {
    const selected = latest('canvas-selection')
    receive({ type: 'canvas-format', editId: 'edit-1', operationId: `format-${parentSequence}`, expectedLocalRevision: selected.localRevision, selection: selected.selection, patch })
  }
  const acknowledge = (commit, extra = {}) => receive({ type: 'canvas-command-result', action: 'commit', editId: commit.editId, operationId: commit.operationId, status: 'committed', resumeDraftSequence: 2, ...extra })
  const input = (text, composing = false) => {
    const node = editor(); node.dispatch('beforeinput', { inputType: composing ? 'insertCompositionText' : 'insertText' })
    node.textContent = text; nativeSelection.setBaseAndExtent(node.childNodes[0], text.length, node.childNodes[0], text.length)
    const nativeNode = node.childNodes[0]
    node.dispatch('input', { isComposing: composing })
    return nativeNode
  }
  const advance = milliseconds => {
    const end = now + milliseconds
    while (true) {
      const next = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      timers.delete(next[0]); now = next[1].at; next[1].callback()
    }
    now = end
  }
  return { runtime, target, document, window, nativeSelection, frozen, sent, messages, latest, receive, editor, open, action, format, acknowledge, input, advance, dispose, observers,
    resize(node) { observers.filter(observer => observer.targets.has(node)).forEach(observer => observer.callback([])) },
    applied(sequence) { appliedSequence = sequence; runtime.refreshed() } }
}

test('registration requires a parent grant and formatting stays local until one explicit commit', t => {
  const f = fixture(t), editor = f.open()
  assert.deepEqual(f.frozen, [true]); assert.equal(f.target.style.visibility, 'hidden')
  f.format({ fontWeight: 700, color: '#68233a' })
  assert.equal(editor.textContent, '공지사항')
  assert.equal(editor.childNodes[0].style.fontWeight, '700')
  assert.equal(f.messages('canvas-commit').length, 0)
  f.action('finish')
  const commit = f.latest('canvas-commit')
  assert.equal(commit.outcome, 'apply')
  assert.deepEqual(commit.changes, [{ source: { ownerPage: 'notices', scope: 'desktop', key: 'notices.title' }, fieldVersion: 'field-1',
    edits: [{ start: 0, end: 4, text: '공지사항', runs: [{ start: 0, end: 4, style: { color: '#68233a', fontWeight: 700 } }] }] }])
  assert.equal(editor.contentEditable, 'false')
})

test('pending commit blocks paste, native beforeinput, composition and repeated finish without altering its text', t => {
  const f = fixture(t), editor = f.open()
  f.input('새 공지'); f.action('finish')
  const commit = f.latest('canvas-commit'), revision = f.latest('canvas-selection').localRevision
  const paste = editor.dispatch('paste', { clipboardData: { getData: () => '유실되면 안 되는 입력' } })
  assert.equal(paste.defaultPrevented, true)
  assert.equal(editor.dispatch('beforeinput', { inputType: 'insertText' }).defaultPrevented, true)
  editor.dispatch('compositionstart'); editor.dispatch('compositionend')
  f.action('finish')
  assert.equal(editor.textContent, '새 공지')
  assert.equal(f.latest('canvas-selection').localRevision, revision)
  assert.equal(f.messages('canvas-commit').length, 1)
  assert.equal(commit.changes[0].edits[0].text, '새 공지')
})

test('a matching acknowledgement keeps the same overlay until its resume draft was actually applied', t => {
  const f = fixture(t), editor = f.open()
  f.input('새 공지'); f.action('finish')
  const commit = f.latest('canvas-commit')
  f.acknowledge(commit, { operationId: 'wrong-operation', resumeDraftSequence: 3 })
  assert.equal(f.editor(), editor); assert.deepEqual(f.frozen, [true])
  f.acknowledge(commit, { resumeDraftSequence: 3 })
  assert.equal(f.editor(), editor); assert.equal(editor.textContent, '새 공지')
  assert.equal(f.target.style.visibility, 'hidden')
  f.applied(2); assert.equal(f.editor(), editor)
  f.applied(3)
  assert.equal(f.editor(), undefined); assert.equal(f.target.style.visibility, '')
  assert.equal(f.latest('canvas-selection').editId, null)
  assert.equal(f.latest('canvas-selection').selection, null)
})

test('a rejected commit retains native selection and input in the same editable node', t => {
  const f = fixture(t), editor = f.open()
  f.input('유지할 공지'); f.action('finish')
  const commit = f.latest('canvas-commit'), anchor = f.nativeSelection.anchorNode
  f.receive({ type: 'canvas-command-result', action: 'commit', editId: commit.editId, operationId: commit.operationId, status: 'rejected', reason: 'stale' })
  assert.equal(f.editor(), editor); assert.equal(editor.textContent, '유지할 공지')
  assert.equal(editor.contentEditable, 'plaintext-only')
  assert.equal(f.nativeSelection.anchorNode, anchor); assert.equal(f.nativeSelection.anchorOffset, 6)
  assert.deepEqual(f.frozen, [true])
  assert.match(f.document.body.textContent, /입력은 유지됩니다/)
  f.advance(30000); assert.equal(f.messages('canvas-commit').length, 1)
  f.action('finish'); assert.notEqual(f.latest('canvas-commit').operationId, commit.operationId)
})

test('lost commit replies retry the same operation and payload, then expose a same-operation manual retry', t => {
  const f = fixture(t), editor = f.open()
  f.input('재시도 공지'); f.action('finish')
  const original = f.latest('canvas-commit')
  f.advance(24000)
  const commits = f.messages('canvas-commit')
  assert.equal(commits.length, 4)
  for (const commit of commits) { assert.equal(commit.operationId, original.operationId); assert.deepEqual(commit.changes, original.changes) }
  assert.ok(commits[3].sequence > original.sequence)
  assert.equal(f.editor(), editor)
  const status = f.document.body.childNodes.find(node => node.className === 'canvas-editor-status')
  const retry = status.childNodes.find(node => node.nodeName === 'BUTTON')
  assert.equal(retry.textContent, '다시 확인')
  retry.dispatch('click')
  assert.equal(f.messages('canvas-commit').length, 5)
  assert.equal(f.latest('canvas-commit').operationId, original.operationId)
})

test('IME keeps native input untouched by Escape, F2 and formatting; one post-composition Escape commits once', t => {
  const f = fixture(t), editor = f.open()
  editor.dispatch('compositionstart'); f.input('ㅎ', true)
  const compositionNode = f.input('한', true)
  assert.equal(editor.childNodes[0], compositionNode, 'native input is not repainted during composition')
  for (const key of ['Escape', 'F2']) assert.equal(f.document.dispatch('keydown', { key, isComposing: true }).defaultPrevented, false)
  assert.equal(f.document.dispatch('keydown', { key: 'Escape', keyCode: 229 }).defaultPrevented, false)
  f.format({ fontWeight: 700 })
  assert.equal(f.latest('canvas-command-result').accepted, false)
  assert.equal(f.latest('canvas-command-result').reason, 'composing')
  assert.equal(f.messages('canvas-commit').length, 0)
  assert.equal(f.editor(), editor); assert.equal(editor.textContent, '한')
  assert.equal(editor.childNodes[0], compositionNode, 'ignored shortcuts do not replace the native composition node')
  editor.dispatch('compositionend')
  assert.equal(f.latest('canvas-selection').summary.composing, false)
  assert.equal(f.document.dispatch('keydown', { key: 'Escape' }).defaultPrevented, true)
  f.document.dispatch('keydown', { key: 'Escape' })
  assert.equal(f.messages('canvas-commit').length, 1)
  assert.equal(f.latest('canvas-commit').changes[0].edits[0].text, '한')
})

test('Ctrl+Enter is not finish and explicit cancel sends no replacement data', t => {
  const f = fixture(t), editor = f.open()
  f.input('취소할 입력')
  assert.equal(f.document.dispatch('keydown', { key: 'Enter', ctrlKey: true }).defaultPrevented, false)
  assert.equal(f.messages('canvas-commit').length, 0)
  f.action('cancel')
  const commit = f.latest('canvas-commit')
  assert.equal(commit.outcome, 'cancel'); assert.equal(Object.hasOwn(commit, 'changes'), false)
  f.acknowledge(commit, { status: 'cancelled', resumeDraftSequence: 1 })
  assert.equal(f.editor(), undefined); assert.equal(editor.isConnected, false)
  assert.equal(f.target.textContent, '공지사항'); assert.equal(f.target.style.visibility, '')
})

test('unmount clears pending retry work and all mounted handlers without leaving a hidden original', t => {
  const f = fixture(t), editor = f.open()
  f.action('finish'); const count = f.sent.length
  f.dispose(); f.advance(60000)
  assert.equal(f.sent.length, count)
  assert.equal(editor.isConnected, false); assert.equal(f.target.style.visibility, '')
  assert.equal([...f.window.listeners.values()].every(group => group.size === 0), true)
  assert.equal([...f.document.listeners.values()].every(group => group.size === 0), true)
  assert.equal(f.observers.every(observer => observer.targets.size === 0), true)
  assert.equal(Object.hasOwn(f.document.body.dataset, 'canvasEditMode'), false)
})

test('a normalized target registers its exact raw source slice and commits only the parent-authorized untrimmed text', t => {
  const f = fixture(t)
  const target = f.document.createElement('smyc-edit-target')
  target.textContent = '함께 노래'; f.document.body.append(target)
  const text = '앞| \t함께\t\t노래  |뒤'
  f.runtime.registry.register({ instanceId: 'normalized', ownerPage: 'notices', key: 'notices.title', text: '함께 노래', fullText: text, offset: 2, element: target,
    parts: [{ key: 'notices.title', text: ' \t함께\t\t노래  ', fullText: text, offset: 2, collapseWhitespace: true }] })
  f.receive({ type: 'canvas-mode', operationId: 'mode', mode: 'edit', scope: 'desktop', device: 'desktop' })
  const block = f.latest('canvas-register').blocks.find(item => item.id === 'normalized')
  assert.ok(block, 'normalized source is registered rather than discarded as a mismatched exact slice')
  assert.deepEqual(block.segments, [{ source: { ownerPage: 'notices', scope: 'desktop', key: 'notices.title', text }, sourceStart: 2, sourceEnd: 12, visibleStart: 0, visibleEnd: 5, transform: 'collapse-whitespace' }])
  f.receive({ type: 'canvas-begin', operationId: 'begin', blockId: block.id, blockRevision: block.revision })
  f.receive({ type: 'canvas-editgrant', requestId: f.latest('canvas-editbegin').requestId, accepted: true,
    grant: { editId: 'edit-1', blockId: block.id, blockRevision: block.revision, ownerPage: 'notices', scope: 'desktop', device: 'desktop', baseDraftSequence: 1,
      fields: [{ source: { ownerPage: 'notices', scope: 'desktop', key: 'notices.title' }, fieldVersion: 'field-1', text, runs: [], ranges: [{ start: 4, end: 10 }] }] } })
  const editor = f.editor(); assert.ok(editor)
  f.nativeSelection.setBaseAndExtent(editor.childNodes[0], 3, editor.childNodes[0], 5)
  f.input('함께 합창'); f.action('finish')
  assert.deepEqual(f.latest('canvas-commit').changes[0].edits, [{ start: 4, end: 10, text: '함께\t\t합창', runs: [] }])
})

test('multiple explicit sources show a list-editing fallback without requesting a grant or changing the page', t => {
  const f = fixture(t)
  const target = f.document.createElement('smyc-edit-target'); target.textContent = '함께\n노래'; f.document.body.append(target)
  f.runtime.registry.register({ instanceId: 'combined', ownerPage: 'notices', key: 'notices.title', text: '함께\n노래', fullText: '함께', offset: 0, element: target,
    parts: [{ key: 'notices.title', text: '함께' }, { text: '\n' }, { key: 'notices.description', text: '노래' }] })
  f.receive({ type: 'canvas-mode', operationId: 'mode', mode: 'edit', scope: 'desktop', device: 'desktop' })
  const block = f.latest('canvas-register').blocks.find(item => item.id === 'combined')
  assert.ok(block)
  assert.deepEqual(block.capabilities, { format: false, replaceText: false })
  f.receive({ type: 'canvas-begin', operationId: 'begin', blockId: block.id, blockRevision: block.revision })
  assert.equal(f.messages('canvas-editbegin').length, 0)
  assert.equal(f.editor(), undefined)
  assert.equal(target.textContent, '함께\n노래')
  assert.match(f.document.body.textContent, /여러.*원문.*문구 목록/)
})

test('native input resizes the live outline, including font overflow, and shorter input shrinks it again', t => {
  const f = fixture(t), editor = f.open()
  editor.box = { left: 80, top: 180, width: 300, height: 120 }
  editor.glyphBox = { left: 80, top: 176, width: 280, height: 130 }
  const native = f.input('길어진 여러 줄의 공지사항')
  const outline = f.document.body.childNodes.find(node => node.className === 'canvas-editor-outline')
  assert.equal(outline.hidden, false)
  assert.equal(outline.style.height, '130px')
  assert.equal(outline.style.width, '300px')
  assert.equal(editor.childNodes[0], native, 'measuring must not repaint the active native text node')
  editor.box = { left: 80, top: 180, width: 100, height: 24 }
  editor.glyphBox = { left: 80, top: 180, width: 90, height: 20 }
  f.nativeSelection.setBaseAndExtent(editor.childNodes[0], 0, editor.childNodes[0], editor.textContent.length)
  f.input('짧음')
  assert.equal(outline.style.height, '24px')
  assert.equal(outline.style.width, '100px')
  assert.equal(editor.style.whiteSpace, 'pre-wrap')
})

test('inline centred source text keeps its alignment and uses a natural-width editor instead of a fixed old glyph width', t => {
  const f = fixture(t)
  f.target.parentElement.computed = { display: 'inline', textAlign: 'center' }
  f.target.computed = { textAlign: 'center' }
  const editor = f.open()
  assert.equal(editor.style.textAlign, 'center')
  assert.equal(editor.style.width, 'max-content')
  assert.equal(editor.style.minWidth, '44px')
})

test('composition changes measure live geometry without replacing the browser composition node', t => {
  const f = fixture(t), editor = f.open()
  editor.dispatch('compositionstart')
  editor.box = { left: 80, top: 180, width: 640, height: 140 }
  const node = f.input('한', true)
  const outline = f.document.body.childNodes.find(value => value.className === 'canvas-editor-outline')
  assert.equal(outline.style.height, '140px')
  assert.equal(editor.childNodes[0], node)
  assert.equal(f.latest('canvas-selection').summary.composing, true)
})

test('late font or wrapping changes refresh the active outline and disconnect measurement after the editor closes', t => {
  const f = fixture(t), editor = f.open()
  editor.box = { left: 80, top: 180, width: 640, height: 96 }
  f.resize(editor)
  const outline = f.document.body.childNodes.find(value => value.className === 'canvas-editor-outline')
  assert.equal(outline.style.height, '96px')
  f.action('cancel')
  const commit = f.latest('canvas-commit')
  f.acknowledge(commit, { status: 'cancelled', resumeDraftSequence: 1 })
  assert.equal(f.observers.every(observer => observer.targets.size === 0), true)
})

test('font commands and explicit line breaks update the same live border without requiring a window resize', t => {
  const f = fixture(t), editor = f.open()
  editor.box = { left: 80, top: 180, width: 640, height: 90 }
  f.format({ fontSize: 72 })
  const outline = f.document.body.childNodes.find(value => value.className === 'canvas-editor-outline')
  assert.equal(editor.childNodes[0].style.fontSize, '72px')
  assert.equal(outline.style.height, '90px')
  editor.box = { left: 80, top: 180, width: 640, height: 180 }
  f.input('첫 줄\n둘째 줄')
  assert.equal(outline.style.height, '180px')
  assert.equal(f.latest('canvas-selection').summary.dirty, true)
  editor.box = { left: 80, top: 180, width: 640, height: 90 }
  f.action('undo')
  assert.equal(editor.textContent, '공지사항')
  assert.equal(outline.style.height, '90px')
})
