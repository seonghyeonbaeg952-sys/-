import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const api = await vite.ssrLoadModule('/src/lib/CanvasEditBuffer.ts').catch(() => ({}))
const source = { ownerPage: 'notices', scope: 'desktop', key: 'notices.title', text: '앞 공지사항 뒤' }
const block = { id: 'title', label: '제목', visibleText: '공지사항', revision: 1, capabilities: { format: true, replaceText: true }, segments: [{ source, sourceStart: 2, sourceEnd: 6, visibleStart: 0, visibleEnd: 4, transform: 'slice' }] }
const grant = { editId: 'edit1', blockId: 'title', blockRevision: 1, ownerPage: 'notices', scope: 'desktop', device: 'desktop', baseDraftSequence: 1, fields: [{ source: { ownerPage: 'notices', scope: 'desktop', key: 'notices.title' }, fieldVersion: 'v1', text: source.text, runs: [], ranges: [{ start: 2, end: 6 }] }] }
function create() { assert.equal(typeof api.createCanvasEditBuffer, 'function'); const result = api.createCanvasEditBuffer(block, grant); assert.equal(result.ok, true); return result.buffer }
test('slice editing emits only the authorized original interval; hidden prefix and suffix stay outside patch', () => {
  const buffer = create()
  const next = api.replaceCanvasBufferText(buffer, '새 공지', { start: 4, end: 4 }, false)
  assert.equal(next.ok, true)
  assert.deepEqual(api.getCanvasBufferChanges(next.buffer)[0].edits, [{ start: 2, end: 6, text: '새 공지', runs: [] }])
})
test('format, clear and undo preserve text and restore the selected range', () => {
  const original = create()
  const changed = api.applyCanvasBufferStyle(original, { start: 0, end: 2 }, { color: '#68233a', fontWeight: 700 }).buffer
  assert.equal(changed.text, original.text)
  assert.equal(changed.runs[0].style.color, '#68233a')
  const undone = api.moveCanvasBufferHistory(changed, 'undo').buffer
  assert.deepEqual(undone.runs, [])
  const redone = api.moveCanvasBufferHistory(undone, 'redo').buffer
  assert.deepEqual(redone.runs, changed.runs)
  assert.deepEqual(api.applyCanvasBufferStyle(redone, { start: 0, end: 2 }, null).buffer.runs, [])
})
test('Korean composition is one undo step and formatting is deferred while composing', () => {
  let buffer = api.beginCanvasBufferComposition(create())
  buffer = api.replaceCanvasBufferText(buffer, 'ㅎ', { start: 1, end: 1 }, true).buffer
  buffer = api.replaceCanvasBufferText(buffer, '한', { start: 1, end: 1 }, true).buffer
  assert.equal(api.applyCanvasBufferStyle(buffer, { start: 0, end: 1 }, { fontSize: 30 }).ok, false)
  buffer = api.endCanvasBufferComposition(buffer)
  assert.equal(api.moveCanvasBufferHistory(buffer, 'undo').buffer.text, '공지사항')
})
test('invalid markup and non-reversible multi-source blocks fail closed', () => {
  const buffer = create()
  const rejected = api.replaceCanvasBufferText(buffer, '<img src=x>', { start: 0, end: 0 }, false)
  assert.equal(rejected.ok, false)
  assert.equal(rejected.buffer, buffer)
  assert.equal(api.createCanvasEditBuffer({ ...block, segments: [...block.segments, ...block.segments] }, grant).ok, false)
})

test('typing inside a formatted word inherits the insertion style without modifying its neighbours', () => {
  let buffer = create()
  buffer = api.applyCanvasBufferStyle(buffer, { start: 0, end: 2 }, { color: '#68233a', fontSize: 32 }).buffer
  const next = api.replaceCanvasBufferText(buffer, '공새지사항', { start: 2, end: 2 }, false, { start: 1, end: 1 })
  assert.equal(next.ok, true)
  assert.deepEqual(next.buffer.runs, [{ start: 0, end: 3, style: { fontSize: 32, color: '#68233a' } }])
})

function createExact(text, runs = []) {
  const exactSource = { ...source, text }
  const exactBlock = { ...block, visibleText: text, segments: [{ source: exactSource, sourceStart: 0, sourceEnd: text.length, visibleStart: 0, visibleEnd: text.length, transform: 'exact' }] }
  const exactGrant = { ...grant, fields: [{ ...grant.fields[0], text, runs, ranges: [{ start: 0, end: text.length }] }] }
  const result = api.createCanvasEditBuffer(exactBlock, exactGrant)
  assert.equal(result.ok, true)
  return result.buffer
}

test('deleting the selected first repeated character removes its style instead of moving it to another occurrence', () => {
  const original = createExact('AAA', [{ start: 0, end: 1, style: { color: '#123456' } }])
  const selected = api.selectCanvasBuffer(original, { start: 0, end: 1 }).buffer
  const result = api.replaceCanvasBufferText(selected, 'AA', { start: 0, end: 0 }, false)
  assert.equal(result.ok, true)
  assert.deepEqual(result.buffer.runs, [])
  assert.deepEqual(api.moveCanvasBufferHistory(result.buffer, 'undo').buffer.runs, original.runs)
})

test('an explicit pre-input range retains repeated-character identity even if selectionchange already moved the buffer caret', () => {
  const original = createExact('AAA', [{ start: 0, end: 1, style: { color: '#123456' } }])
  const moved = api.selectCanvasBuffer(original, { start: 1, end: 1 }).buffer
  const result = api.replaceCanvasBufferText(moved, 'AAAA', { start: 1, end: 1 }, false, { start: 0, end: 0 })
  assert.equal(result.ok, true)
  // Inserted text inherits the adjacent style; the two original unstyled As do not.
  assert.deepEqual(result.buffer.runs, [{ start: 0, end: 2, style: { color: '#123456' } }])
  assert.deepEqual(api.moveCanvasBufferHistory(result.buffer, 'undo').buffer.selection, { start: 0, end: 0 })
})

test('collapsed backspace and forward delete remove the occurrence adjacent to the captured caret', () => {
  for (const before of [{ start: 1, end: 1 }, { start: 0, end: 0 }]) {
    const original = createExact('AAA', [{ start: 0, end: 1, style: { color: '#123456' } }])
    const result = api.replaceCanvasBufferText(original, 'AA', { start: 0, end: 0 }, false, before)
    assert.equal(result.ok, true)
    assert.deepEqual(result.buffer.runs, [])
  }
})

test('text changes outside the exact pre-input range are rejected without changing text, runs or history', () => {
  const original = createExact('ABC', [{ start: 0, end: 3, style: { fontWeight: 700 } }])
  const result = api.replaceCanvasBufferText(original, 'ZBC', { start: 2, end: 2 }, false, { start: 1, end: 2 })
  assert.equal(result.ok, false)
  assert.equal(result.buffer, original)
})

test('an edit cannot split a grapheme even when a native caret reports an interior UTF-16 offset', () => {
  const original = createExact('A😀B')
  const result = api.replaceCanvasBufferText(original, 'A\ud83dX\ude00B', { start: 3, end: 3 }, false, { start: 2, end: 2 })
  assert.equal(result.ok, false)
  assert.equal(result.buffer, original)
})

test('cancelled composition restores original styles and preserves an existing redo branch without an undo entry', () => {
  let original = createExact('AB', [{ start: 0, end: 2, style: { fontWeight: 700 } }])
  const formatted = api.applyCanvasBufferStyle(original, { start: 0, end: 1 }, { color: '#123456' }).buffer
  original = api.moveCanvasBufferHistory(formatted, 'undo').buffer
  original = api.selectCanvasBuffer(original, { start: 0, end: 2 }).buffer
  let buffer = api.beginCanvasBufferComposition(original)
  buffer = api.replaceCanvasBufferText(buffer, 'ㅎ', { start: 1, end: 1 }, true).buffer
  buffer = api.replaceCanvasBufferText(buffer, 'AB', { start: 0, end: 2 }, true).buffer
  buffer = api.endCanvasBufferComposition(buffer)
  assert.deepEqual(buffer.runs, [{ start: 0, end: 2, style: { fontWeight: 700 } }])
  assert.equal(api.getCanvasBufferSummary(buffer).dirty, false)
  assert.equal(buffer.past.length, 0)
  assert.deepEqual(api.moveCanvasBufferHistory(buffer, 'redo').buffer.runs, formatted.runs)
})

test('every IME update derives outside styles from the original composition snapshot and makes one reversible history entry', () => {
  const original = createExact('AAA', [{ start: 0, end: 1, style: { color: '#123456' } }])
  let buffer = api.beginCanvasBufferComposition(api.selectCanvasBuffer(original, { start: 0, end: 0 }).buffer)
  buffer = api.replaceCanvasBufferText(buffer, 'AAAA', { start: 1, end: 1 }, true).buffer
  buffer = api.replaceCanvasBufferText(buffer, '한AAA', { start: 1, end: 1 }, true).buffer
  buffer = api.replaceCanvasBufferText(buffer, 'A한AAA', { start: 2, end: 2 }, true).buffer
  buffer = api.endCanvasBufferComposition(buffer)
  // The composition inherits the starting style; outside original ranges stay exact.
  assert.deepEqual(buffer.runs, [{ start: 0, end: 3, style: { color: '#123456' } }])
  assert.equal(buffer.past.length, 1)
  const undone = api.moveCanvasBufferHistory(buffer, 'undo').buffer
  assert.equal(undone.text, 'AAA')
  assert.deepEqual(undone.runs, original.runs)
  assert.deepEqual(api.moveCanvasBufferHistory(undone, 'redo').buffer.runs, buffer.runs)
})
