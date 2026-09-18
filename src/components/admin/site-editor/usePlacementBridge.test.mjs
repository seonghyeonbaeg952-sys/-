import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const modules = {}
for (const path of ['lib/siteEditorPlacementProtocol', 'lib/siteEditorPreview', 'lib/siteEditorLayout', 'lib/siteEditorModel', 'content/textLayoutCatalog', 'components/admin/site-editor/editorSessionModel']) modules[path.split('/').at(-1)] = await vite.ssrLoadModule(`/src/${path}.ts`)
const source = await readFile(new URL('./usePlacementBridge.ts', import.meta.url), 'utf8').catch(() => 'export {}')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const block = { id: 'notices.intro.title', label: '제목', group: 'notices.intro', value: {}, rect: { left: 10, top: 20, width: 300, height: 80 }, bounds: { left: 0, top: 0, width: 800, height: 600 } }
function fixture(t) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'window'), events = new Set(), sent = [], slots = [], effects = []
  let cursor = 0, dirty = false, output, sequence = 0, writes = 0
  let context = { editorPage: 'notices', previewPage: 'notices', device: 'desktop', documents: { notices: empty() }, loadedOwners: new Set(['notices']), locked: false }
  const nonce = '11111111-1111-4111-8111-111111111111', draftSequence = { current: 1 }
  const child = { postMessage(message) { sent.push(structuredClone(message)) } }, frame = { current: { contentWindow: child } }
  globalThis.window = { location: { origin: 'https://placement.invalid' }, addEventListener(_type, fn) { events.add(fn) }, removeEventListener(_type, fn) { events.delete(fn) } }
  const equal = (a, b) => a && b && a.length === b.length && a.every((value, i) => value === b[i])
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial, set(next) { const value = typeof next === 'function' ? next(slots[i].value) : next; if (value !== slots[i].value) { slots[i].value = value; dirty = true } } }; return [slots[i].value, slots[i].set] },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i] },
    useCallback(fn, deps) { const i = cursor++; if (!slots[i] || !equal(slots[i].deps, deps)) slots[i] = { fn, deps }; return slots[i].fn },
    useEffect(fn, deps) { const i = cursor++, prior = slots[i]; if (!prior || !equal(prior.deps, deps)) { slots[i] = { deps, cleanup: prior?.cleanup }; effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn() }) } },
  }
  const exported = {}
  vm.runInThisContext(`(function(exports,require){${code}\n})`)(exported, name => name === 'react' ? hooks : modules[name.split('/').at(-1)])
  const callbacks = { onActiveChange() {}, onCommitted() {}, onChange(id, next, before, device) {
    const current = modules.siteEditorLayout.resolveTextLayout(context.documents.notices, device, id) ?? {}
    if (JSON.stringify(current) !== JSON.stringify(before)) return { ok: false, message: 'stale' }
    const session = modules.editorSessionModel.createEditorSession({ page_key: 'notices', draft: context.documents.notices, published: null, version: 1, updated_at: '', published_at: null })
    const document = modules.editorSessionModel.editSessionTextLayout(session, device, id, next).document
    writes++; context = { ...context, documents: { notices: document } }
    return { ok: true, document }
  } }
  function render() {
    assert.equal(typeof exported.usePlacementBridge, 'function')
    for (let count = 0; count < 20; count++) { cursor = 0; dirty = false; output = exported.usePlacementBridge({ context, frame, nonce, draftSequence, ...callbacks }); effects.splice(0).forEach(fn => fn()); if (!dirty) return }
    assert.fail('effects must settle')
  }
  t.after(() => { slots.forEach(item => item?.cleanup?.()); if (old) Object.defineProperty(globalThis, 'window', old); else delete globalThis.window })
  render()
  function receive(payload, overrides = {}) { const data = { channel: 'smyc-placement', version: 1, nonce, previewPage: 'notices', sequence: ++sequence, ...payload }; events.forEach(fn => fn({ source: child, origin: window.location.origin, data, ...overrides })); render() }
  const latest = type => sent.filter(item => item.type === type).at(-1)
  const ready = () => { receive({ type: 'placement-ready' }); output.setMode('place'); render(); receive({ type: 'placement-register', appliedDraftSequence: 1, blocks: [block] }) }
  const begin = () => { receive({ type: 'placement-begin', requestId: 'request-1', id: block.id, appliedDraftSequence: 1 }); return latest('placement-grant') }
  return { receive, ready, begin, latest, sent, output: () => output, writes: () => writes, context: () => context, update(value) { context = { ...context, ...value }; render() } }
}
test('parent grants only registered catalog blocks and exposes its own current layout, not the frame snapshot', t => {
  const f = fixture(t); f.ready()
  const response = f.begin(); assert.equal(response.accepted, true); assert.deepEqual(response.grant.before, {})
  f.receive({ type: 'placement-selection', id: block.id, editId: response.grant.editId })
  assert.deepEqual(f.output().selected.value, {})
  f.update({ documents: { notices: { ...empty(), textLayouts: { desktop: { [block.id]: { offsetX: 99 } } } } } })
  assert.deepEqual(f.output().selected.value, { offsetX: 99 })
  assert.equal(f.writes(), 0)
})
test('one pointerup commits once and duplicate operation retries do not create another write or undo step', t => {
  const f = fixture(t); f.ready(); const grant = f.begin().grant
  const commit = { type: 'placement-commit', editId: grant.editId, operationId: 'operation-1', baseDraftSequence: 1, outcome: 'apply', value: { offsetX: 20, offsetY: 10 } }
  f.receive(commit); f.receive(commit)
  assert.equal(f.writes(), 1)
  assert.deepEqual(f.latest('smyc-editor:draft').documents.notices.textLayouts.desktop[block.id], commit.value)
  assert.equal(f.output().active, true)
  f.receive({ type: 'placement-selection', id: block.id, editId: null })
  assert.equal(f.output().active, false)
})
test('a begin retry receives the same grant and abort releases that grant without a write', t => {
  const f = fixture(t); f.ready(); const first = f.begin(), retry = f.begin()
  assert.equal(retry.accepted, true)
  assert.equal(retry.grant.editId, first.grant.editId)
  f.receive({ type: 'placement-abort', requestId: 'request-1' })
  assert.equal(f.latest('placement-aborted').requestId, 'request-1')
  assert.equal(f.output().active, false)
  assert.equal(f.writes(), 0)
})
for (const variant of ['value', 'device', 'locked', 'source']) {
  test(`${variant}: stale or forged contexts cannot write through an old grant`, t => {
    const f = fixture(t); f.ready(); const grant = f.begin().grant
    if (variant === 'value') f.update({ documents: { notices: { ...empty(), textLayouts: { desktop: { [block.id]: { offsetX: 5 } } } } } })
    if (variant === 'device') f.update({ device: 'mobile' })
    if (variant === 'locked') f.update({ locked: true })
    f.receive({ type: 'placement-commit', editId: grant.editId, operationId: 'operation-1', baseDraftSequence: 1, outcome: 'apply', value: { offsetX: 20 } }, variant === 'source' ? { source: {} } : {})
    assert.equal(f.writes(), 0)
  })
}
