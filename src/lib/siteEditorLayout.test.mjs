import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const layout = await vite.ssrLoadModule('/src/lib/siteEditorLayout.ts').catch(() => ({}))
const model = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const session = await vite.ssrLoadModule('/src/components/admin/site-editor/editorSessionModel.ts')
const history = await vite.ssrLoadModule('/src/components/admin/site-editor/editorCanvasHistory.ts')
const preview = await vite.ssrLoadModule('/src/lib/siteEditorPreview.ts')
const ui = await vite.ssrLoadModule('/src/components/admin/site-editor/editorUiOptions.ts')
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const entry = (value, device = 'desktop', id = 'home.hero.title') => ({ ...empty(), textLayouts: { [device]: { [id]: value } } })
const record = (draft = empty(), version = 1) => ({ page_key: 'home', draft, published: null, version, updated_at: '2026-09-18T00:00:00Z', published_at: null })
const start = draft => session.createEditorSession(record(draft))
function edit(current, device, id, value) {
  assert.equal(typeof session.editSessionTextLayout, 'function', 'layout edits must participate in session transactions')
  return session.editSessionTextLayout(current, device, id, value)
}

test('legacy documents remain unchanged and layout resolution has no device or shared fallback', () => {
  assert.equal(typeof layout.resolveTextLayout, 'function')
  assert.equal(layout.resolveTextLayout(undefined, 'desktop', 'home.hero.title'), undefined)
  assert.equal(layout.resolveTextLayout(empty(), 'desktop', 'home.hero.title'), undefined)
  assert.deepEqual(model.emptySiteEditorDocument(), empty())
  const doc = entry({ offsetX: 0, width: 55, textAlign: 'center' })
  assert.deepEqual(layout.resolveTextLayout(doc, 'desktop', 'home.hero.title'), { offsetX: 0, width: 55, textAlign: 'center' })
  assert.equal(layout.resolveTextLayout(doc, 'mobile', 'home.hero.title'), undefined)
  assert.equal(layout.resolveTextLayout(doc, 'shared', 'home.hero.title'), undefined)
  const resolved = layout.resolveTextLayout(doc, 'desktop', 'home.hero.title')
  resolved.width = 90
  assert.equal(doc.textLayouts.desktop['home.hero.title'].width, 55, 'resolution cannot expose a mutable draft reference')
})

test('the document accepts bounded pixel offsets and percent widths only in explicit device maps', () => {
  for (const device of ['mobile', 'tablet', 'desktop']) for (const value of [
    {}, { offsetX: -2000, offsetY: 2000, width: 10, textAlign: 'start' },
    { offsetX: 2000, offsetY: -2000, width: 100, textAlign: 'end' },
    { offsetX: 0, offsetY: 0, width: 50.5, textAlign: 'center' }, { offsetX: 0.25, offsetY: -0.25 },
  ]) {
    const doc = entry(value, device), before = structuredClone(doc)
    assert.equal(model.validateSiteEditorDocument(doc), null)
    assert.deepEqual(doc, before)
  }
  assert.equal(model.validateSiteEditorDocument({ ...empty(), textLayouts: {} }), null)
})

test('layout validation rejects arbitrary CSS, invalid bounds, unsupported devices, arrays and unsafe IDs', () => {
  assert.equal(typeof layout.validateTextLayouts, 'function')
  for (const value of [null, [], 'center', { height: 10 }, { position: 'fixed' }, { transform: 'none' }, { offsetX: '10' }, { offsetX: null },
    { offsetX: NaN }, { offsetY: Infinity }, { offsetX: -2000.01 }, { offsetY: 2000.01 }, { width: 9.99 }, { width: 100.01 },
    { textAlign: 'left' }, { textAlign: 'justify' }, { textAlign: 'center;display:none' }, { width: 30, html: '<b>x</b>' }, { width: undefined },
  ]) assert.notEqual(layout.validateTextLayouts({ desktop: { box: value } }), null, JSON.stringify(value))
  for (const value of [null, [], { shared: {} }, { phone: {} }, { desktop: null }, { desktop: [] },
    { desktop: { ['a'.repeat(121)]: {} } }, { desktop: { '.box': {} } }, { desktop: { 'a..b': {} } },
    { desktop: { 'box.constructor.value': {} } }, { desktop: JSON.parse('{"__proto__":{}}') },
  ]) assert.notEqual(layout.validateTextLayouts(value), null)
})

test('layout validators reject prototype objects and accessors without evaluating them', () => {
  assert.equal(typeof layout.isEditorTextLayout, 'function')
  let reads = 0
  const accessor = Object.defineProperty({}, 'width', { enumerable: true, get() { reads++; return 50 } })
  assert.equal(layout.isEditorTextLayout(accessor), false)
  assert.equal(layout.isEditorTextLayout(Object.assign(Object.create({ injected: true }), { width: 50 })), false)
  assert.equal(layout.isEditorTextLayout({ [Symbol('hidden')]: 1 }), false)
  assert.equal(layout.isEditorTextLayout(Object.defineProperty({}, 'width', { value: 50, enumerable: false })), false)
  assert.notEqual(layout.validateTextLayouts(Object.defineProperty({}, 'desktop', { enumerable: true, get() { reads++; return {} } })), null)
  assert.equal(reads, 0)
})

test('layout maps are bounded and malformed layout documents cannot cross the preview protocol', () => {
  const values = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`box.${i}`, { width: 50 }]))
  const doc = { ...empty(), textLayouts: { mobile: values } }
  assert.equal(model.validateSiteEditorDocument(doc), null)
  const message = { type: 'smyc-editor:draft', version: 1, nonce: '11111111-1111-4111-8111-111111111111', page: 'home', sequence: 1, documents: { home: doc } }
  assert.deepEqual(preview.parseSiteEditorMessage(message)?.documents.home.textLayouts, { mobile: values })
  values['box.500'] = { width: 50 }
  assert.notEqual(model.validateSiteEditorDocument(doc), null)
  assert.equal(preview.parseSiteEditorMessage(message), null)
  assert.notEqual(model.validateSiteEditorDocument({ ...empty(), textLayouts: { shared: {} } }), null)
})

test('layout-only edits become dirty and save acknowledgement retains later local layout input', () => {
  let current = edit(start(), 'desktop', 'home.hero.title', { width: 60, textAlign: 'center' })
  assert.equal(session.getEditorStatus(current).unsavedCount, 1)
  const submitted = structuredClone(current.document)
  current = edit(current, 'desktop', 'home.hero.title', { width: 70, textAlign: 'end' })
  current = session.acceptEditorSave(current, record(submitted, 2))
  assert.deepEqual(current.baseline.textLayouts.desktop['home.hero.title'], { width: 60, textAlign: 'center' })
  assert.deepEqual(current.document.textLayouts.desktop['home.hero.title'], { width: 70, textAlign: 'end' })
  assert.equal(session.getEditorStatus(current).unsavedCount, 1)
  const saved = session.acceptEditorSave(current, record(current.document, 3))
  assert.deepEqual(session.getEditorStatus(saved), { unsavedCount: 0, unpublishedCount: 1, canPublish: true })
})

test('property insertion order does not create false layout changes', () => {
  const before = entry({ width: 40, offsetX: 3, textAlign: 'center' })
  const after = entry({ textAlign: 'center', offsetX: 3, width: 40 })
  assert.deepEqual(session.getEditorChanges(before, after), [])
  after.textLayouts.desktop['home.hero.title'].offsetX = 4
  assert.equal(session.getEditorChanges(before, after)[0]?.kind, 'textLayout')
})

test('remote changes merge unrelated devices and copy without discarding a local layout', () => {
  let current = edit(start(), 'mobile', 'home.hero.title', { width: 80, offsetY: 12 })
  const remote = { ...entry({ width: 45 }, 'desktop'), copy: { title: '서버 원문' } }
  current = session.reconcileEditorSession(current, record(remote, 2))
  assert.deepEqual(current.document.textLayouts.mobile['home.hero.title'], { width: 80, offsetY: 12 })
  assert.deepEqual(current.document.textLayouts.desktop['home.hero.title'], { width: 45 })
  assert.deepEqual(current.document.copy, { title: '서버 원문' })
  assert.deepEqual(current.conflicts, [])
})

test('the whole layout entry is one conflict unit, independent of copy and text runs', () => {
  const base = { ...entry({ width: 60, offsetX: 0 }), copy: { 'home.hero.title': '원문' }, textStyles: { shared: { 'home.hero.title': { text: '원문', runs: [] } } } }
  let current = edit(start(base), 'desktop', 'home.hero.title', { width: 70, offsetX: 0 })
  const remote = structuredClone(base)
  remote.textLayouts.desktop['home.hero.title'].offsetX = 20
  remote.copy['home.hero.title'] = '서버 새 원문'
  remote.textStyles.shared['home.hero.title'] = { text: '서버 새 원문', runs: [] }
  current = session.reconcileEditorSession(current, record(remote, 2))
  assert.equal(current.conflicts.length, 1)
  assert.equal(current.conflicts[0].kind, 'textLayout')
  const server = session.resolveEditorConflict(current, current.conflicts[0].id, 'server')
  assert.deepEqual(server.document, remote)
  const local = session.resolveEditorConflict(current, current.conflicts[0].id, 'local')
  assert.deepEqual(local.document.textLayouts.desktop['home.hero.title'], { width: 70, offsetX: 0 })
  assert.equal(local.document.copy['home.hero.title'], '서버 새 원문')
})

test('restore retains layout changes made while the request was pending and restores unchanged layout entries', () => {
  const submitted = entry({ width: 60 })
  const current = edit(start(submitted), 'desktop', 'home.hero.title', { width: 75 })
  const restored = { ...entry({ width: 30 }), textLayouts: { desktop: { 'home.hero.title': { width: 30 }, 'home.about.title': { offsetY: 10 } } } }
  const result = session.acceptEditorRestore(current, submitted, record(restored, 2))
  assert.deepEqual(result.document.textLayouts.desktop, { 'home.hero.title': { width: 75 }, 'home.about.title': { offsetY: 10 } })
  assert.deepEqual(result.baseline, restored)
})

test('reset is device-specific and removing the final entry restores the legacy document shape', () => {
  let current = edit(start(), 'desktop', 'home.hero.title', { offsetX: 0 })
  current = edit(current, 'mobile', 'home.hero.title', { width: 100 })
  const sharedReset = session.resetEditorScope(current, 'shared')
  assert.deepEqual(sharedReset.document.textLayouts, current.document.textLayouts)
  current = session.resetEditorScope(sharedReset, 'desktop')
  assert.deepEqual(current.document.textLayouts, { mobile: { 'home.hero.title': { width: 100 } } })
  current = edit(current, 'mobile', 'home.hero.title', {})
  assert.deepEqual(current.document, empty())
  current = edit(current, 'tablet', 'box', { width: 50 })
  assert.deepEqual(edit(current, 'tablet', 'box', undefined).document, empty())
})

test('invalid edits fail without mutating the current document', () => {
  const current = start(), before = structuredClone(current)
  for (const [device, id, value] of [['shared', 'box', {}], ['desktop', '__proto__', {}], ['mobile', 'box', { height: 40 }], ['tablet', 'box', { width: 101 }], ['desktop', 'box', null]]) {
    assert.throws(() => edit(current, device, id, value), RangeError)
    assert.deepEqual(current, before)
  }
})

test('layout-only transactions support undo and redo and reject overwriting newer layout changes', () => {
  const before = empty(), after = entry({ width: 80, textAlign: 'center' })
  const recorded = history.recordCanvasHistory(history.emptyCanvasHistory(), before, after)
  assert.equal(recorded.past.length, 1)
  const undone = history.moveCanvasHistory(recorded, after, 'undo')
  assert.equal(undone.ok, true)
  assert.deepEqual(undone.document, before)
  assert.deepEqual(history.moveCanvasHistory(undone.history, before, 'redo').document, after)
  assert.equal(history.moveCanvasHistory(recorded, entry({ width: 81 }), 'undo').ok, false)
})

test('change summaries describe the layout without exposing serialized JSON', () => {
  const formatted = ui.formatEditorChangeValue('textLayout', JSON.stringify({ offsetX: 0, offsetY: -12, width: 75, textAlign: 'center' }))
  assert.match(formatted, /0px/)
  assert.match(formatted, /-12px/)
  assert.match(formatted, /75%/)
  assert.match(formatted, /가운데/)
  assert.doesNotMatch(formatted, /[{}]|offsetX|textAlign/)
})
