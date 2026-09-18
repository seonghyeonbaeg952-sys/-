import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString('base64')}`
const stylesUrl = moduleUrl(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const layoutUrl = moduleUrl((await readFile(new URL('./siteEditorLayout.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const documentUrl = moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorLayout'", JSON.stringify(layoutUrl)))
const canvasUrl = moduleUrl((await readFile(new URL('./siteEditorCanvasModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorModel'", JSON.stringify(documentUrl)))
const code = await readFile(new URL('./siteEditorCanvasProtocol.ts', import.meta.url), 'utf8').catch(error => { if (error.code === 'ENOENT') return 'export {}'; throw error })
const protocol = await import(moduleUrl(code.replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorModel'", JSON.stringify(documentUrl)).replaceAll("'./siteEditorCanvasModel'", JSON.stringify(canvasUrl))))
const parse = value => { assert.equal(typeof protocol.parseCanvasMessage, 'function'); return protocol.parseCanvasMessage(value) }
const accept = (event, expected) => { assert.equal(typeof protocol.acceptCanvasMessage, 'function'); return protocol.acceptCanvasMessage(event, expected) }
const nonce = 'c61ca8a9-0912-4f19-a4fb-b30a54fa6068'
const envelope = { channel: 'smyc-canvas', version: 1, nonce, previewPage: 'home', sequence: 1 }
const message = payload => ({ ...envelope, ...payload })
const identity = { ownerPage: 'home', scope: 'desktop', key: 'home.current.about.title' }
const fullStyle = { fontFamily: 'hahmlet', fontSize: 32, color: '#123ABC', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' }
const block = () => ({ id: 'home-about-title', label: '소개 제목', visibleText: 'A😀B', revision: 2,
  capabilities: { format: true, replaceText: true },
  segments: [{ source: { ...identity, text: 'A😀B' }, sourceStart: 0, sourceEnd: 4, visibleStart: 0, visibleEnd: 4, transform: 'exact' }],
})
const selection = { blockId: 'home-about-title', start: 1, end: 3, revision: 2 }
const summary = { style: { ...fullStyle, fontSize: 'mixed' }, canUndo: true, canRedo: false, composing: false, dirty: true }
const grant = () => ({ editId: 'edit-1', blockId: 'home-about-title', blockRevision: 2, ownerPage: 'home', scope: 'desktop', device: 'desktop', baseDraftSequence: 3,
  fields: [{ source: { ...identity }, fieldVersion: 'field-1', text: 'A😀B', runs: [{ start: 1, end: 3, style: { ...fullStyle } }], ranges: [{ start: 0, end: 4 }] }],
})
const change = () => ({ source: { ...identity }, fieldVersion: 'field-1', edits: [{ start: 0, end: 4, text: '합창', runs: [{ start: 0, end: 2, style: { ...fullStyle } }] }] })
const valid = [
  ['frame-to-parent', { type: 'canvas-ready' }],
  ['frame-to-parent', { type: 'canvas-save' }],
  ['frame-to-parent', { type: 'canvas-register', appliedDraftSequence: 3, blocks: [block()] }],
  ['frame-to-parent', { type: 'canvas-selection', editId: 'edit-1', localRevision: 2, selection, summary }],
  ['frame-to-parent', { type: 'canvas-selection', editId: null, localRevision: 0, selection: null, summary: null }],
  ['frame-to-parent', { type: 'canvas-editbegin', requestId: 'request-1', blockId: 'home-about-title', blockRevision: 2, appliedDraftSequence: 3 }],
  ['frame-to-parent', { type: 'canvas-commit', editId: 'edit-1', operationId: 'operation-1', baseDraftSequence: 3, outcome: 'apply', changes: [change()] }],
  ['frame-to-parent', { type: 'canvas-commit', editId: 'edit-1', operationId: 'operation-1', outcome: 'cancel' }],
  ['frame-to-parent', { type: 'canvas-draft-status', editId: 'edit-1', draftSequence: 4, status: 'deferred' }],
  ['frame-to-parent', { type: 'canvas-command-result', action: 'mode', operationId: 'operation-1', accepted: true }],
  ['frame-to-parent', { type: 'canvas-command-result', action: 'mode', operationId: 'operation-1', accepted: false, reason: 'busy' }],
  ['frame-to-parent', { type: 'canvas-command-result', action: 'format', editId: 'edit-1', operationId: 'operation-1', accepted: true, localRevision: 3, selection }],
  ['frame-to-parent', { type: 'canvas-command-result', action: 'format', editId: 'edit-1', operationId: 'operation-1', accepted: false, localRevision: 3, selection: null, reason: 'composing' }],
  ['parent-to-frame', { type: 'canvas-mode', operationId: 'operation-1', mode: 'edit', scope: 'shared', device: 'desktop' }],
  ['parent-to-frame', { type: 'canvas-begin', operationId: 'operation-1', blockId: 'home-about-title', blockRevision: 2 }],
  ['parent-to-frame', { type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: grant() }],
  ['parent-to-frame', { type: 'canvas-editgrant', requestId: 'request-1', accepted: false, reason: 'stale' }],
  ['parent-to-frame', { type: 'canvas-format', editId: 'edit-1', operationId: 'operation-1', expectedLocalRevision: 2, selection, patch: fullStyle }],
  ['parent-to-frame', { type: 'canvas-command-result', action: 'commit', editId: 'edit-1', operationId: 'operation-1', status: 'committed', resumeDraftSequence: 4 }],
  ['parent-to-frame', { type: 'canvas-command-result', action: 'commit', editId: 'edit-1', operationId: 'operation-1', status: 'cancelled', resumeDraftSequence: 4 }],
  ['parent-to-frame', { type: 'canvas-command-result', action: 'commit', editId: 'edit-1', operationId: 'operation-1', status: 'rejected', reason: 'invalid' }],
  ...['undo', 'redo', 'selectAll', 'finish', 'cancel'].flatMap(action => [
    ['parent-to-frame', { type: 'canvas-action', action, editId: 'edit-1', operationId: 'operation-1', expectedLocalRevision: 2 }],
    ['frame-to-parent', { type: 'canvas-command-result', action, editId: 'edit-1', operationId: 'operation-1', accepted: true, localRevision: 3, selection }],
  ]),
]

test('all declared canvas messages round-trip unchanged only in their allowed direction', () => {
  const source = {}
  for (const [direction, payload] of valid) {
    const data = message(payload)
    const before = structuredClone(data)
    assert.deepEqual(parse(data), data, payload.type)
    const event = { data, source, origin: 'https://choir.example' }
    const expected = { source, origin: event.origin, nonce, previewPage: 'home', lastSequence: 0, direction }
    assert.deepEqual(accept(event, expected), data)
    assert.equal(accept(event, { ...expected, direction: direction === 'frame-to-parent' ? 'parent-to-frame' : 'frame-to-parent' }), null)
    assert.deepEqual(data, before)
  }
})

test('wrong connection identity, replayed sequence and invalid expected state never reach the controller', () => {
  const source = {}, data = message({ type: 'canvas-ready' })
  const event = { data, source, origin: 'https://choir.example' }
  const expected = { source, origin: event.origin, nonce, previewPage: 'home', lastSequence: 0, direction: 'frame-to-parent' }
  for (const patch of [{ origin: 'https://attacker.example' }, { source: {} }, { source: null }, { data: { ...data, nonce: '11111111-1111-4111-8111-111111111111' } }, { data: { ...data, previewPage: 'join' } }]) assert.equal(accept({ ...event, ...patch }, expected), null)
  for (const patch of [{ source: null }, { lastSequence: 1 }, { lastSequence: 2 }, { lastSequence: NaN }, { lastSequence: -1 }, { direction: 'anything' }]) assert.equal(accept(event, { ...expected, ...patch }), null)
  assert.equal(accept({ ...event, data: { ...data, sequence: 2 } }, { ...expected, lastSequence: 1 })?.sequence, 2)
})

test('unknown keys and legacy preview messages are rejected instead of being reinterpreted', () => {
  for (const [, payload] of valid) assert.equal(parse(message({ ...payload, html: '<b>unsafe</b>' })), null)
  const base = message({ type: 'canvas-ready' })
  for (const patch of [{ channel: 'smyc-editor' }, { version: 2 }, { nonce: 'invalid' }, { previewPage: 'admin' }, { type: 'smyc-editor:ready' }, ...[undefined, 0, -1, 1.5, '2', Infinity, Number.MAX_SAFE_INTEGER + 1].map(sequence => ({ sequence }))]) assert.equal(parse({ ...base, ...patch }), null)
  for (const value of [null, [], new Date(), Object.create({ inherited: true })]) assert.equal(parse(value), null)
})

test('non-JSON records and array accessors are rejected without invoking untrusted code', () => {
  let reads = 0
  const getter = message({ type: 'canvas-ready' })
  Object.defineProperty(getter, 'nonce', { enumerable: true, get() { reads++; return nonce } })
  assert.equal(parse(getter), null)
  const items = [block()]
  Object.defineProperty(items, '0', { enumerable: true, get() { reads++; return block() } })
  assert.equal(parse(message({ type: 'canvas-register', appliedDraftSequence: 3, blocks: items })), null)
  const decorated = [block()]; decorated.extra = 'not JSON array data'
  assert.equal(parse(message({ type: 'canvas-register', appliedDraftSequence: 3, blocks: decorated })), null)
  const dangerous = JSON.parse(JSON.stringify(message({ type: 'canvas-ready' })).replace('"sequence":1', '"sequence":1,"__proto__":{}'))
  assert.equal(parse(dangerous), null)
  const cyclic = message({ type: 'canvas-ready' }); cyclic.cycle = cyclic
  assert.equal(parse(cyclic), null)
  const symbol = message({ type: 'canvas-ready' }); symbol[Symbol('hidden')] = 'not JSON data'
  assert.equal(parse(symbol), null)
  assert.equal(reads, 0)
})

test('register validates explicit source projections and distinct occurrences within a bounded inventory', () => {
  const payload = { type: 'canvas-register', appliedDraftSequence: 3, blocks: [block()] }
  for (const mutate of [
    value => { value.blocks[0].segments[0].source.key = '__proto__.title' },
    value => { value.blocks[0].segments[0].source.ownerPage = 'admin' },
    value => { value.blocks[0].segments[0].source.html = 'unexpected' },
    value => { value.blocks[0].segments[0].source.text = 'DIFFERENT' },
    value => { value.blocks[0].segments[0].sourceEnd = 2 },
    value => { value.blocks[0].capabilities.execute = true },
    value => { value.blocks.push(block()) },
    value => { value.blocks[0].label = 'x'.repeat(241) },
    value => { value.blocks = Array.from({ length: 513 }, (_, i) => ({ ...block(), id: `block-${i}` })) },
  ]) { const invalid = structuredClone(payload); mutate(invalid); assert.equal(parse(message(invalid)), null) }
  assert.ok(parse(message({ ...payload, blocks: [] })), 'an empty page can clear its registration inventory')
  // Current rich inventory max is desktop home 83 distinct keys (2026-09-18),
  // not measured DOM occurrence count; the 512-block ceiling allows repeated instances.
  assert.ok(parse(message({ ...payload, blocks: Array.from({ length: 83 }, (_, i) => ({ ...block(), id: `block-${i}` })) })))
})

test('grant binds every field to one owner and scope and validates its full snapshot and grapheme ranges', () => {
  for (const mutate of [
    value => { value.ownerPage = 'admin' }, value => { value.scope = 'watch' }, value => { value.device = 'watch' },
    value => { value.baseDraftSequence = 0 }, value => { value.fields = [] }, value => { value.fields.push(structuredClone(value.fields[0])) },
    value => { value.fields[0].source.ownerPage = 'common' }, value => { value.fields[0].source.scope = 'shared' },
    value => { value.fields[0].fieldVersion = '' }, value => { value.fields[0].text = '<script>x</script>' },
    value => { value.fields[0].runs[0].style.color = '#fff' }, value => { value.fields[0].ranges[0].end = 2 },
    value => { value.fields[0].ranges[0].start = -1 }, value => { value.fields[0].ranges.push({ start: 1, end: 3 }) },
    value => { value.fields[0].ranges[0].extra = true }, value => { value.fields[0].runs.push({ start: 1, end: 3, style: { fontSize: 24 } }) },
  ]) { const invalid = grant(); mutate(invalid); assert.equal(parse(message({ type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: invalid })), null) }
  const common = grant(); common.ownerPage = 'common'; common.fields[0].source.ownerPage = 'common'
  assert.ok(parse(message({ type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: common })), 'route page and document owner are independent; authorization is the parent controller boundary')
  const empty = grant(); empty.fields[0] = { ...empty.fields[0], text: '', runs: [], ranges: [{ start: 0, end: 0 }] }
  assert.ok(parse(message({ type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: empty })))
})

test('commit checks every source replacement, preserving insertion and deletion without accepting arbitrary document writes', () => {
  const base = { type: 'canvas-commit', editId: 'edit-1', operationId: 'operation-1', baseDraftSequence: 3, outcome: 'apply', changes: [change()] }
  for (const mutate of [
    value => { value.changes = [] }, value => { value.changes.push(change()) },
    value => { value.changes[0].source.key = 'constructor' }, value => { value.changes[0].fieldVersion = 'x'.repeat(129) },
    value => { value.changes[0].edits[0].start = -1 }, value => { value.changes[0].edits[0].end = 20001 },
    value => { value.changes[0].edits[0].text = '\ud800' }, value => { value.changes[0].edits[0].text = 'x'.repeat(10001) },
    value => { value.changes[0].edits[0].runs[0].end = 3 }, value => { value.changes[0].edits[0].runs[0].style.fontWeight = 900 },
    value => { value.changes[0].edits.push({ start: 1, end: 2, text: 'x', runs: [] }) },
    value => { value.changes[0].edits[0].document = {} },
  ]) { const invalid = structuredClone(base); mutate(invalid); assert.equal(parse(message(invalid)), null) }
  for (const replacement of [{ start: 2, end: 2, text: '삽입', runs: [] }, { start: 0, end: 4, text: '', runs: [] }]) {
    assert.ok(parse(message({ ...base, changes: [{ ...change(), edits: [replacement] }] })))
  }
})

test('format patch supports all six allowed properties, individual inheritance resets, and explicit reset-all', () => {
  const base = { type: 'canvas-format', editId: 'edit-1', operationId: 'operation-1', expectedLocalRevision: 2, selection }
  for (const patch of [null, {}, fullStyle, { color: undefined, fontWeight: undefined, fontStyle: undefined, textDecoration: undefined }]) assert.ok(parse(message({ ...base, patch })))
  for (const patch of [{ color: '#abc' }, { color: 'red' }, { color: '#123456;display:none' }, { fontWeight: '700' }, { fontStyle: 'oblique' }, { textDecoration: 'underline overline' }, { backgroundColor: undefined }, { color: 'mixed' }]) assert.equal(parse(message({ ...base, patch })), null)
})

test('selection summaries accept mixed display values but never treat unknown or invalid values as inherited', () => {
  const base = { type: 'canvas-selection', editId: 'edit-1', localRevision: 2, selection, summary }
  for (const style of [{}, fullStyle, { fontFamily: 'mixed', fontSize: 'mixed', color: 'mixed', fontWeight: 'mixed', fontStyle: 'mixed', textDecoration: 'mixed' }]) assert.ok(parse(message({ ...base, summary: { ...summary, style } })))
  for (const patch of [
    { summary: null }, { summary: { ...summary, style: { css: 'mixed' } } },
    { summary: { ...summary, style: { color: undefined } } }, { summary: { ...summary, style: { color: '#fff' } } },
    { summary: { ...summary, canUndo: 'true' } }, { summary: { ...summary, dirty: 1 } },
    { selection: { ...selection, start: -1 } }, { selection: { ...selection, end: 20001 } },
    { selection: { ...selection, revision: -1 } }, { selection: { ...selection, extra: true } },
    { editId: null },
  ]) assert.equal(parse(message({ ...base, ...patch })), null)
  assert.ok(parse(message({ ...base, selection: { ...selection, start: 3, end: 1 } })), 'reverse native selections stay representable')
})

test('result discriminants cannot carry contradictory success and error data or unapproved action names', () => {
  const mode = { type: 'canvas-command-result', action: 'mode', operationId: 'operation-1', accepted: true }
  assert.equal(parse(message({ ...mode, reason: 'invalid' })), null)
  assert.equal(parse(message({ ...mode, accepted: false })), null)
  assert.equal(parse(message({ ...mode, accepted: false, reason: 'internal SQL error' })), null)
  assert.equal(parse(message({ type: 'canvas-action', action: 'publish', editId: 'edit-1', operationId: 'operation-1', expectedLocalRevision: 2 })), null)
  assert.equal(parse(message({ type: 'canvas-command-result', action: 'commit', editId: 'edit-1', operationId: 'operation-1', status: 'committed', resumeDraftSequence: 0 })), null)
  assert.equal(parse(message({ type: 'canvas-commit', editId: 'edit-1', operationId: 'operation-1', outcome: 'cancel', changes: [change()] })), null)
})

test('total UTF-8 message budget and nested collection limits are enforced before expensive projection work', () => {
  const large = () => { const value = block(); value.visibleText = '한'.repeat(10000); value.segments[0] = { ...value.segments[0], source: { ...identity, text: value.visibleText }, sourceEnd: 10000, visibleEnd: 10000 }; return value }
  assert.equal(parse(message({ type: 'canvas-register', appliedDraftSequence: 3, blocks: Array.from({ length: 10 }, (_, i) => ({ ...large(), id: `large-${i}` })) })), null)
  const tooMany = block(); tooMany.visibleText = 'x'.repeat(501); tooMany.segments = Array.from({ length: 501 }, (_, i) => ({ source: { ...identity, text: 'x' }, sourceStart: 0, sourceEnd: 1, visibleStart: i, visibleEnd: i + 1, transform: 'exact' }))
  assert.equal(parse(message({ type: 'canvas-register', appliedDraftSequence: 3, blocks: [tooMany] })), null)
  const runs = Array.from({ length: 501 }, (_, i) => ({ start: i, end: i + 1, style: { fontSize: 24 } }))
  const tooManyRuns = grant(); tooManyRuns.fields[0].text = 'x'.repeat(501); tooManyRuns.fields[0].runs = runs; tooManyRuns.fields[0].ranges = [{ start: 0, end: 501 }]
  assert.equal(parse(message({ type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: tooManyRuns })), null)
  const tooManyFields = grant(); tooManyFields.fields = Array.from({ length: 501 }, (_, i) => ({ ...grant().fields[0], source: { ...identity, key: `title.${i}` } }))
  assert.equal(parse(message({ type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: tooManyFields })), null)
  const tooManyRanges = grant(); tooManyRanges.fields[0] = { ...tooManyRanges.fields[0], text: 'x'.repeat(1002), runs: [], ranges: Array.from({ length: 501 }, (_, i) => ({ start: i * 2, end: i * 2 + 1 })) }
  assert.equal(parse(message({ type: 'canvas-editgrant', requestId: 'request-1', accepted: true, grant: tooManyRanges })), null)
  const tooManyEdits = change(); tooManyEdits.edits = Array.from({ length: 501 }, (_, i) => ({ start: i, end: i, text: 'x', runs: [] }))
  assert.equal(parse(message({ type: 'canvas-commit', editId: 'edit-1', operationId: 'operation-1', baseDraftSequence: 3, outcome: 'apply', changes: [tooManyEdits] })), null)
})
