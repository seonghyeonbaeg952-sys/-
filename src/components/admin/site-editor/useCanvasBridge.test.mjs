import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const protocol = await vite.ssrLoadModule('/src/lib/siteEditorCanvasProtocol.ts')
const preview = await vite.ssrLoadModule('/src/lib/siteEditorPreview.ts')
const controller = await vite.ssrLoadModule('/src/components/admin/site-editor/editorCanvasController.ts')
const compiled = ts.transpileModule(await readFile(new URL('./useCanvasBridge.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const copySource = { ownerPage: 'notices', scope: 'desktop', key: 'notices.title', text: '공지사항' }
const block = { id: 'title', label: '공지 제목', visibleText: '공지사항', revision: 2, capabilities: { format: true, replaceText: true },
  segments: [{ source: copySource, sourceStart: 0, sourceEnd: 4, visibleStart: 0, visibleEnd: 4, transform: 'exact' }] }

// State/ref/callback slots and committed effect lifecycles are controlled; the
// actual bridge, wire validator and parent grant/CAS controller are not mocked.
function fixture(t) {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const origin = 'https://canvas.example.invalid', nonce = '11111111-1111-4111-8111-111111111111'
  const listeners = new Set(), sent = [], activeChanges = [], commits = []
  const slots = [], effects = []
  let cursor = 0, dirty = false, output, frameSequence = 0, committedCount = 0, disposed = false
  let context = { editorPage: 'notices', previewPage: 'notices', device: 'desktop', scope: 'desktop', documents: { notices: empty() },
    loadedOwners: new Set(['notices']), defaultsTrusted: true, defaults: { 'notices.title': '공지사항' } }
  const draftSequence = { current: 1 }
  const child = { postMessage(message, targetOrigin) {
    assert.equal(targetOrigin, origin)
    if (message.type !== 'smyc-editor:draft') assert.ok(protocol.parseCanvasMessage(message))
    sent.push(structuredClone(message))
  } }
  const frame = { current: { contentWindow: child } }
  globalThis.window = { location: { origin }, addEventListener(type, listener) { assert.equal(type, 'message'); listeners.add(listener) },
    removeEventListener(type, listener) { assert.equal(type, 'message'); listeners.delete(listener) } }
  const sameDependencies = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]))
  const hooks = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) {
        slots[index] = { value: typeof initial === 'function' ? initial() : initial,
          set(value) { const next = typeof value === 'function' ? value(slots[index].value) : value; if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true } } }
      }
      return [slots[index].value, slots[index].set]
    },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
    useCallback(callback, dependencies) {
      const index = cursor++
      if (!slots[index] || !sameDependencies(slots[index].dependencies, dependencies)) slots[index] = { callback, dependencies }
      return slots[index].callback
    },
    useEffect(callback, dependencies) {
      const index = cursor++
      if (!slots[index] || !sameDependencies(slots[index].dependencies, dependencies)) {
        const previous = slots[index]
        slots[index] = { dependencies, cleanup: previous?.cleanup }
        effects.push(() => { slots[index].cleanup?.(); slots[index].cleanup = callback() })
      }
    },
  }
  const exported = {}
  const dependencies = { react: hooks, '../../../lib/siteEditorCanvasProtocol': protocol, '../../../lib/siteEditorPreview': preview, './editorCanvasController': controller }
  vm.runInThisContext(`(function(exports, require) { ${compiled}\n})`)(exported, name => {
    assert.ok(Object.hasOwn(dependencies, name), `explicit dependency ${name}`)
    return dependencies[name]
  })
  const callbacks = {
    onActiveChange: value => activeChanges.push(value), onCommitted: () => { committedCount += 1 },
    onCommit(issued, changes, sequence) {
      commits.push({ issued, changes: structuredClone(changes), sequence })
      const result = controller.commitCanvasGrant({ ...context, baseDraftSequence: sequence }, issued, changes)
      if (result.ok) context = { ...context, documents: { ...context.documents, [result.ownerPage]: result.document } }
      return result
    },
  }
  function render() {
    for (let pass = 0; pass < 25; pass += 1) {
      cursor = 0; dirty = false
      output = exported.useCanvasBridge({ context, frame, nonce, draftSequence, ...callbacks })
      for (const effect of effects.splice(0)) effect()
      if (!dirty) return
    }
    assert.fail('hook effects did not settle')
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    slots.forEach(slot => slot?.cleanup?.())
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else delete globalThis.window
  }
  t.after(dispose)
  render()
  const messages = type => sent.filter(message => message.type === type)
  const latest = type => messages(type).at(-1)
  function receive(payload, overrides = {}) {
    const message = { channel: protocol.CANVAS_PROTOCOL_CHANNEL, version: protocol.CANVAS_PROTOCOL_VERSION, nonce, previewPage: 'notices', sequence: ++frameSequence,
      ...payload, ...(overrides.message ?? {}) }
    assert.ok(protocol.parseCanvasMessage(message), `valid test envelope ${payload.type}`)
    for (const listener of [...listeners]) listener({ data: message, source: overrides.source ?? child, origin: overrides.origin ?? origin })
    render(); return message
  }
  const begin = (requestId = 'begin-1') => receive({ type: 'canvas-editbegin', requestId, blockId: block.id, blockRevision: block.revision, appliedDraftSequence: draftSequence.current })
  const open = () => {
    receive({ type: 'canvas-ready' })
    receive({ type: 'canvas-register', appliedDraftSequence: draftSequence.current, blocks: [structuredClone(block)] })
    begin()
    const reply = latest('canvas-editgrant'); assert.equal(reply.accepted, true)
    receive({ type: 'canvas-selection', editId: reply.grant.editId, localRevision: 1,
      selection: { blockId: block.id, revision: block.revision, start: 0, end: 4 }, summary: { style: {}, canUndo: false, canRedo: false, composing: false, dirty: false } })
    return reply.grant
  }
  const commitPayload = (grant, operationId = 'commit-1') => ({ type: 'canvas-commit', editId: grant.editId, operationId, baseDraftSequence: grant.baseDraftSequence, outcome: 'apply',
    changes: [{ source: grant.fields[0].source, fieldVersion: grant.fields[0].fieldVersion, edits: [{ start: 0, end: 4, text: '새 공지', runs: [] }] }] })
  return { sent, activeChanges, commits, listeners, draftSequence, messages, latest, receive, begin, open, commitPayload, render, dispose,
    get state() { return output }, get context() { return context }, get committedCount() { return committedCount },
    updateContext(next) { context = { ...context, ...next }; render() } }
}

test('real parent CAS rejection keeps the issued edit active and permits explicit cancel without replacing the latest draft', t => {
  const f = fixture(t), grant = f.open()
  const remote = { ...empty(), deviceCopy: { desktop: { 'notices.title': '서버의 새 문구' } } }
  f.updateContext({ documents: { notices: remote } })
  f.receive(f.commitPayload(grant))
  const rejected = f.latest('canvas-command-result')
  assert.equal(rejected.status, 'rejected'); assert.equal(rejected.reason, 'stale')
  assert.equal(f.state.active, true); assert.deepEqual(f.activeChanges, [true])
  assert.equal(f.messages('smyc-editor:draft').length, 0)
  assert.deepEqual(f.context.documents.notices, remote)
  f.state.format({ fontWeight: 700 })
  assert.equal(f.latest('canvas-format').editId, grant.editId)
  f.begin('cannot-begin-another'); assert.equal(f.latest('canvas-editgrant').accepted, false)
  f.receive({ type: 'canvas-commit', editId: grant.editId, operationId: 'cancel-1', outcome: 'cancel' })
  assert.equal(f.latest('canvas-command-result').status, 'cancelled')
  assert.equal(f.state.active, true); assert.equal(f.commits.length, 1)
  assert.deepEqual(f.context.documents.notices, remote)
})

test('successful commit sends the resolved draft before its ACK and unlocks only after the frame clears its active selection', t => {
  const f = fixture(t), grant = f.open(), start = f.sent.length
  f.receive(f.commitPayload(grant))
  const result = f.sent.slice(start)
  assert.deepEqual(result.map(message => message.type), ['smyc-editor:draft', 'canvas-command-result'])
  assert.equal(result[0].documents.notices.deviceCopy.desktop['notices.title'], '새 공지')
  assert.equal(result[1].status, 'committed'); assert.equal(result[1].resumeDraftSequence, result[0].sequence)
  assert.equal(f.state.active, true); assert.deepEqual(f.activeChanges, [true]); assert.equal(f.committedCount, 0)
  f.receive({ type: 'canvas-selection', editId: grant.editId, localRevision: 2,
    selection: { blockId: block.id, revision: block.revision, start: 0, end: 4 }, summary: { style: {}, canUndo: true, canRedo: false, composing: false, dirty: true } })
  assert.equal(f.state.active, true)
  f.receive({ type: 'canvas-selection', editId: null, localRevision: 0, selection: null, summary: null })
  assert.equal(f.state.active, false); assert.deepEqual(f.activeChanges, [true, false]); assert.equal(f.committedCount, 1)
  assert.equal(f.state.selection, null); assert.equal(f.state.summary, null)
})

test('same-operation retries replay the reply without a second CAS, draft or completion even after unlock', t => {
  const f = fixture(t), grant = f.open(), commit = f.commitPayload(grant)
  f.receive(commit)
  const first = f.latest('canvas-command-result')
  f.receive(commit)
  const repeated = f.latest('canvas-command-result')
  assert.equal(f.commits.length, 1); assert.equal(f.messages('smyc-editor:draft').length, 1)
  assert.equal(repeated.operationId, first.operationId); assert.equal(repeated.resumeDraftSequence, first.resumeDraftSequence)
  assert.ok(repeated.sequence > first.sequence)
  f.receive({ type: 'canvas-selection', editId: null, localRevision: 0, selection: null, summary: null })
  f.receive(commit)
  assert.equal(f.commits.length, 1); assert.equal(f.messages('smyc-editor:draft').length, 1)
  assert.equal(f.committedCount, 1); assert.deepEqual(f.activeChanges, [true, false])
})

test('an unregistered nonempty selection is not an acknowledgement that the active editor closed', t => {
  const f = fixture(t), grant = f.open()
  f.receive(f.commitPayload(grant))
  f.receive({ type: 'canvas-selection', editId: null, localRevision: 0,
    selection: { blockId: 'unregistered-target', revision: 0, start: 0, end: 0 }, summary: null })
  assert.equal(f.state.active, true)
  assert.deepEqual(f.activeChanges, [true]); assert.equal(f.committedCount, 0)
  f.receive({ type: 'canvas-selection', editId: null, localRevision: 0, selection: null, summary: null })
  assert.equal(f.state.active, false); assert.equal(f.committedCount, 1)
})

test('wrong origin, window, nonce and replayed wire sequence cannot apply a granted source patch', t => {
  const f = fixture(t), grant = f.open(), commit = f.commitPayload(grant), sentCount = f.sent.length
  f.receive(commit, { origin: 'https://other.example.invalid' })
  f.receive(commit, { source: {} })
  f.receive(commit, { message: { nonce: '22222222-2222-4222-8222-222222222222' } })
  f.receive(commit, { message: { sequence: 1 } })
  assert.equal(f.commits.length, 0); assert.equal(f.sent.length, sentCount)
  assert.deepEqual(f.context.documents.notices, empty()); assert.equal(f.state.active, true)
  f.receive(commit)
  assert.equal(f.commits.length, 1); assert.equal(f.context.documents.notices.deviceCopy.desktop['notices.title'], '새 공지')
})

test('a registration for an unapplied draft cannot grant editing and active registration cannot replace its authority', t => {
  const f = fixture(t)
  f.receive({ type: 'canvas-ready' })
  f.receive({ type: 'canvas-register', appliedDraftSequence: 2, blocks: [structuredClone(block)] })
  f.begin(); assert.equal(f.latest('canvas-editgrant').accepted, false)
  assert.equal(f.state.active, false)
  const grant = f.open()
  f.receive({ type: 'canvas-register', appliedDraftSequence: 1, blocks: [] })
  f.state.format({ fontSize: 32 })
  assert.equal(f.latest('canvas-format').editId, grant.editId)
  assert.equal(f.latest('canvas-format').selection.blockId, 'title')
  assert.equal(f.state.choices.length, 1)
})

test('effect rerenders replace their listener and unmount removes it instead of multiplying commit handlers', t => {
  const f = fixture(t), grant = f.open()
  for (let index = 0; index < 4; index += 1) f.updateContext({ defaults: { 'notices.title': '공지사항' } })
  assert.equal(f.listeners.size, 1)
  f.receive(f.commitPayload(grant))
  assert.equal(f.commits.length, 1)
  f.dispose(); assert.equal(f.listeners.size, 0)
})
