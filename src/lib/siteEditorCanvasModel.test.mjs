import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText).toString('base64')}`
const stylesUrl = moduleUrl(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const documentUrl = moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const sourceCode = await readFile(new URL('./siteEditorCanvasModel.ts', import.meta.url), 'utf8').catch(error => {
  if (error.code === 'ENOENT') return 'export {}'
  throw error
})
const model = await import(moduleUrl(sourceCode.replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorModel'", JSON.stringify(documentUrl))))
const call = (name, ...args) => {
  assert.equal(typeof model[name], 'function', `${name} must implement the canvas mapping contract`)
  return model[name](...args)
}
const source = (text, key = 'home.current.about.title', overrides = {}) => ({ ownerPage: 'home', scope: 'desktop', key, text, ...overrides })
const segment = (value, sourceStart, sourceEnd, visibleStart, visibleEnd, transform = 'slice') => ({ source: value, sourceStart, sourceEnd, visibleStart, visibleEnd, transform })
const block = (visibleText, segments, overrides = {}) => ({ id: 'home-about-title', label: '소개 제목', visibleText, segments, revision: 2, capabilities: { format: true, replaceText: true }, ...overrides })
const exact = value => block(value.text, [segment(value, 0, value.text.length, 0, value.text.length, 'exact')])
const selection = (value, start = 0, end = value.visibleText.length, overrides = {}) => ({ blockId: value.id, start, end, revision: value.revision, ...overrides })
const map = (value, selected) => call('mapCanvasRange', value, selected ?? selection(value))
const edit = (value, selected, insertedText) => call('applyCanvasTextEdit', value, selected, insertedText)

test('the second repeated title line maps to its explicit source slice and preserves the first line', () => {
  const text = source('노래\n노래')
  const value = block('노래', [segment(text, 3, 5, 0, 2)])
  assert.deepEqual(map(value), [{ source: text, start: 3, end: 5 }])
  assert.deepEqual(edit(value, selection(value), '합창'), { ok: true, changes: [{ source: text, nextText: '노래\n합창' }] })
})

test('exact replacement, insertion and deletion retain all untouched source characters', () => {
  const text = source('서울모테트')
  const value = exact(text)
  assert.deepEqual(edit(value, selection(value, 2, 5), '합창단'), { ok: true, changes: [{ source: text, nextText: '서울합창단' }] })
  assert.deepEqual(edit(value, selection(value, 2, 2), ' '), { ok: true, changes: [{ source: text, nextText: '서울 모테트' }] })
  assert.deepEqual(edit(value, selection(value, 2, 5), ''), { ok: true, changes: [{ source: text, nextText: '서울' }] })
  assert.deepEqual(map(value, selection(value, 2, 2)), [])
})

test('empty exact fields and explicitly empty slices accept an insertion without inventing a source position', () => {
  for (const [text, start, want] of [[source(''), 0, '새 문구'], [source('앞뒤'), 1, '앞새 문구뒤']]) {
    const value = block('', [segment(text, start, start, 0, 0, text.text ? 'slice' : 'exact')])
    assert.equal(call('isCanvasBlock', value), true)
    assert.deepEqual(edit(value, selection(value), '새 문구'), { ok: true, changes: [{ source: text, nextText: want }] })
  }
})

test('backward selections map and replace the same selected text as forward selections', () => {
  const text = source('첫째 둘째')
  const value = exact(text)
  assert.deepEqual(map(value, selection(value, 5, 3)), [{ source: text, start: 3, end: 5 }])
  assert.deepEqual(edit(value, selection(value, 5, 3), '합창'), { ok: true, changes: [{ source: text, nextText: '첫째 합창' }] })
})

test('nonempty partial selections snap to complete emoji, combining marks and Korean jamo graphemes', () => {
  for (const [raw, start, end, expectedEnd] of [['A😀B', 2, 3, 3], ['Ae\u0301B', 2, 3, 3], ['A한B', 2, 3, 4], ['A👩‍👩‍👧‍👦B', 4, 5, 12]]) {
    const text = source(raw), value = exact(text)
    assert.deepEqual(map(value, selection(value, start, end)), [{ source: text, start: 1, end: expectedEnd }])
    assert.deepEqual(edit(value, selection(value, start, end), '새'), { ok: true, changes: [{ source: text, nextText: 'A새B' }] })
    assert.deepEqual(edit(value, selection(value, 2, 2), 'x'), { ok: false, reason: 'unmapped' })
  }
})

test('whitespace normalization maps formatting to the first original whitespace but editing to the full whitespace span', () => {
  const text = source(' \t서울\r\n  모테트 \t')
  const value = block('서울 모테트', [segment(text, 0, 12, 0, 6, 'collapse-whitespace')])
  assert.equal(call('isCanvasBlock', value), true)
  assert.deepEqual(map(value, selection(value, 2, 3)), [{ source: text, start: 4, end: 6 }], 'CRLF is one grapheme represented by the visible space')
  assert.deepEqual(edit(value, selection(value, 2, 3), ''), { ok: true, changes: [{ source: text, nextText: ' \t서울모테트 \t' }] })
  assert.deepEqual(edit(value, selection(value), '합창'), { ok: true, changes: [{ source: text, nextText: ' \t합창 \t' }] })
})

test('trimmed source prefixes and suffixes survive edits and insertions at either visible boundary', () => {
  const text = source('  A   B  ')
  const value = block('A B', [segment(text, 0, 9, 0, 3, 'collapse-whitespace')])
  assert.deepEqual(edit(value, selection(value, 0, 0), 'X'), { ok: true, changes: [{ source: text, nextText: '  XA   B  ' }] })
  assert.deepEqual(edit(value, selection(value, 3, 3), 'X'), { ok: true, changes: [{ source: text, nextText: '  A   BX  ' }] })
  assert.deepEqual(map(value), [{ source: text, start: 2, end: 4 }, { source: text, start: 6, end: 7 }])
})

test('normalized slices keep absolute offsets through hidden prefixes, CRLF and emoji', () => {
  const text = source('前|  A   😀 \r\nB  |後')
  const value = block('A 😀 B', [segment(text, 2, 16, 0, 6, 'collapse-whitespace')])
  assert.deepEqual(map(value, selection(value, 3, 4)), [{ source: text, start: 8, end: 10 }])
  assert.deepEqual(edit(value, selection(value, 3, 4), '合'), { ok: true, changes: [{ source: text, nextText: '前|  A   合 \r\nB  |後' }] })
  assert.deepEqual(edit(value, selection(value, 4, 5), ''), { ok: true, changes: [{ source: text, nextText: '前|  A   😀B  |後' }] })
})

test('a whitespace-only normalized field never guesses where to insert into trimmed original text', () => {
  const text = source(' \r\n ')
  const value = block('', [segment(text, 0, 4, 0, 0, 'collapse-whitespace')])
  assert.equal(call('isCanvasBlock', value), true)
  assert.deepEqual(map(value), [])
  assert.deepEqual(edit(value, selection(value), '새'), { ok: false, reason: 'non-reversible' })
})

test('multipart selection formats each known key while literal separators are never editable source text', () => {
  const first = source('함께', 'home.first'), second = source('노래', 'home.second')
  const value = block('함께 · 노래', [segment(first, 0, 2, 0, 2, 'exact'), segment(null, 0, 0, 2, 5, 'literal'), segment(second, 0, 2, 5, 7, 'exact')])
  assert.deepEqual(map(value), [{ source: first, start: 0, end: 2 }, { source: second, start: 0, end: 2 }])
  assert.deepEqual(edit(value, selection(value), '합창'), { ok: false, reason: 'non-reversible' })
  assert.deepEqual(edit(value, selection(value, 2, 5), ''), { ok: false, reason: 'non-reversible' })
  assert.deepEqual(edit(value, selection(value, 0, 2), '같이'), { ok: true, changes: [{ source: first, nextText: '같이' }] })
})

test('cross-key replacement and insertion at an ambiguous source boundary fail without a partial write', () => {
  const first = source('앞', 'home.first'), second = source('뒤', 'home.second')
  const value = block('앞뒤', [segment(first, 0, 1, 0, 1, 'exact'), segment(second, 0, 1, 1, 2, 'exact')])
  assert.deepEqual(edit(value, selection(value), '새'), { ok: false, reason: 'non-reversible' })
  assert.deepEqual(edit(value, selection(value, 1, 1), '새'), { ok: false, reason: 'non-reversible' })
})

test('one source split across adjacent segments is merged; repeated occurrences are not formatted twice', () => {
  const text = source('ABCD')
  const value = block('ABCDAB', [segment(text, 0, 2, 0, 2), segment(text, 2, 4, 2, 4), segment(text, 0, 2, 4, 6)])
  assert.deepEqual(map(value), [{ source: text, start: 0, end: 4 }])
  assert.deepEqual(edit(value, selection(value, 0, 4), 'X'), { ok: true, changes: [{ source: text, nextText: 'X' }] })
  assert.deepEqual(edit(value, selection(value), 'X'), { ok: false, reason: 'non-reversible' })
})

test('same keys in distinct scopes retain their source identity and are never jointly replaced', () => {
  const shared = source('앞', 'home.same', { scope: 'shared' }), mobile = source('뒤', 'home.same', { scope: 'mobile' })
  const value = block('앞뒤', [segment(shared, 0, 1, 0, 1, 'exact'), segment(mobile, 0, 1, 1, 2, 'exact')])
  assert.deepEqual(map(value), [{ source: shared, start: 0, end: 1 }, { source: mobile, start: 0, end: 1 }])
  assert.deepEqual(edit(value, selection(value), '새'), { ok: false, reason: 'non-reversible' })
})

test('source gaps hidden between slices cannot be deleted by replacing their visible concatenation', () => {
  const text = source('앞 숨긴 문구 뒤')
  const value = block('앞뒤', [segment(text, 0, 1, 0, 1), segment(text, 8, 9, 1, 2)])
  assert.deepEqual(map(value), [{ source: text, start: 0, end: 1 }, { source: text, start: 8, end: 9 }])
  assert.deepEqual(edit(value, selection(value), '새'), { ok: false, reason: 'non-reversible' })
})

test('stale occurrence IDs or revisions do not reuse an old selection against a new block', () => {
  const value = exact(source('원문'))
  for (const stale of [{ blockId: 'different-occurrence' }, { revision: 1 }]) {
    const selected = selection(value, 0, 2, stale)
    assert.deepEqual(map(value, selected), [])
    assert.deepEqual(edit(value, selected, '새'), { ok: false, reason: 'stale' })
  }
})

test('format and text replacement capabilities are independent and enforced', () => {
  const value = exact(source('원문'))
  const formatOnly = { ...value, capabilities: { format: true, replaceText: false } }
  assert.equal(map(formatOnly).length, 1)
  assert.deepEqual(edit(formatOnly, selection(formatOnly), '새'), { ok: false, reason: 'non-reversible' })
  const replaceOnly = { ...value, capabilities: { format: false, replaceText: true } }
  assert.deepEqual(map(replaceOnly), [])
  assert.equal(edit(replaceOnly, selection(replaceOnly), '새').ok, true)
})

test('mismatched visible text, gaps, overlaps, inconsistent snapshots and partial-grapheme segment boundaries are rejected', () => {
  const text = source('A😀B'), value = exact(text)
  const invalid = [
    { ...value, visibleText: 'different' },
    { ...value, segments: [segment(text, 0, 1, 0, 1), segment(text, 3, 4, 3, 4)] },
    { ...value, segments: [segment(text, 0, 3, 0, 3), segment(text, 1, 4, 1, 4)] },
    block('AB', [segment(source('A', 'same'), 0, 1, 0, 1), segment(source('B', 'same'), 0, 1, 1, 2)]),
    { ...value, segments: [segment(text, 0, 2, 0, 2), segment(text, 2, 4, 2, 4)] },
    block('AB', [segment(source('A'), 0, 1, 0, 1), segment(source('B', 'other', { ownerPage: 'common' }), 0, 1, 1, 2)]),
    block('x', [segment(source('x'), 0, 1, 0, 1, 'literal')]),
    block('x', [segment(null, 1, 2, 0, 1, 'literal')]),
    block('\u0301A', [segment(source(' \u0301A'), 0, 3, 0, 2, 'collapse-whitespace')]),
  ]
  for (const candidate of invalid) {
    assert.equal(call('isCanvasBlock', candidate), false)
    assert.deepEqual(map(candidate), [])
    assert.deepEqual(edit(candidate, selection(candidate), '새'), { ok: false, reason: 'unmapped' })
  }
})

test('block validation rejects extra properties, invalid identities, getters and malformed range values', () => {
  const value = exact(source('문구'))
  const invalid = [null, [], { ...value, html: '<script>' }, { ...value, revision: -1 }, { ...value, revision: Infinity },
    { ...value, capabilities: { ...value.capabilities, move: true } },
    { ...value, segments: [{ ...value.segments[0], guessed: true }] },
    { ...value, segments: [{ ...value.segments[0], transform: new String('exact') }] },
    { ...value, segments: Object.assign([...value.segments], { html: 'bad' }) },
    { ...value, segments: [{ ...value.segments[0], sourceStart: 0.5 }] },
    { ...value, segments: [{ ...value.segments[0], source: source('문구', '__proto__.bad') }] },
    { ...value, segments: [{ ...value.segments[0], source: source('문구', 'valid', { scope: 'watch' }) }] },
    { ...value, segments: [{ ...value.segments[0], source: source('문구', 'valid', { ownerPage: 'secret' }) }] },
    { ...value, segments: [{ ...value.segments[0], source: { ...source('문구'), html: 'bad' } }] },
    Object.assign(Object.create({ secret: true }), value),
  ]
  const accessor = { ...value }; Object.defineProperty(accessor, 'visibleText', { enumerable: true, get() { throw new Error('must not execute') } }); invalid.push(accessor)
  for (const candidate of invalid) assert.equal(call('isCanvasBlock', candidate), false)
  for (const selected of [selection(value, -1, 1), selection(value, 0.5, 1), selection(value, 0, 3), { ...selection(value), html: 'bad' }]) {
    assert.deepEqual(map(value, selected), [])
    assert.deepEqual(edit(value, selected, '새'), { ok: false, reason: 'unmapped' })
  }
})

test('unsafe or over-limit replacement text is rejected and successful edits do not mutate their block', () => {
  const value = exact(source('원문')), before = structuredClone(value)
  for (const inserted of ['<b>새</b>', 'x'.repeat(10001), null, {}, '\ud800']) {
    assert.deepEqual(edit(value, selection(value), inserted), { ok: false, reason: 'unmapped' })
  }
  assert.equal(edit(value, selection(value), '새 문구').ok, true)
  assert.deepEqual(value, before)
  const full = exact(source('x'.repeat(10000)))
  assert.deepEqual(edit(full, selection(full, 5000, 5000), 'x'), { ok: false, reason: 'unmapped' })
})

test('replacement mapping returns the exact repeated-character insertion point without inferring a text diff', () => {
  const text = source('aaaa'), value = exact(text)
  assert.deepEqual(call('getCanvasReplacementRange', value, selection(value, 2, 2)), { source: text, start: 2, end: 2 })
  assert.deepEqual(call('getCanvasReplacementRange', value, selection(value, 3, 1)), { source: text, start: 1, end: 3 })
})

test('replacement mapping includes all collapsed source whitespace while keeping hidden trim outside', () => {
  const text = source('  A \r\n B  ')
  const value = block('A B', [segment(text, 0, 10, 0, 3, 'collapse-whitespace')])
  assert.deepEqual(call('getCanvasReplacementRange', value, selection(value, 1, 2)), { source: text, start: 3, end: 7 })
  assert.deepEqual(call('getCanvasReplacementRange', value, selection(value)), { source: text, start: 2, end: 8 })
})

test('replacement mapping never authorizes stale, disabled, cross-source or literal ranges', () => {
  const first = source('A', 'home.first'), second = source('B', 'home.second')
  const value = block('A B', [segment(first, 0, 1, 0, 1, 'exact'), segment(null, 0, 0, 1, 2, 'literal'), segment(second, 0, 1, 2, 3, 'exact')])
  assert.equal(call('getCanvasReplacementRange', value, selection(value)), null)
  assert.equal(call('getCanvasReplacementRange', value, selection(value, 0, 1, { revision: 1 })), null)
  assert.equal(call('getCanvasReplacementRange', { ...value, capabilities: { format: true, replaceText: false } }, selection(value, 0, 1)), null)
})

test('projection atoms expose exact normalization coordinates once without re-inferring visible text', () => {
  const text = source(' A  B ')
  const value = block('A B', [segment(text, 0, 6, 0, 3, 'collapse-whitespace')])
  assert.deepEqual(call('getCanvasProjectionAtoms', value), [
    { source: text, sourceStart: 1, sourceEnd: 2, visibleStart: 0, visibleEnd: 1, transform: 'linear' },
    { source: text, sourceStart: 2, sourceEnd: 4, visibleStart: 1, visibleEnd: 2, transform: 'whitespace' },
    { source: text, sourceStart: 4, sourceEnd: 5, visibleStart: 2, visibleEnd: 3, transform: 'linear' },
  ])
  assert.equal(call('getCanvasProjectionAtoms', { ...value, visibleText: 'different' }), null)
})
