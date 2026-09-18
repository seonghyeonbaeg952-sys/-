import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`
const stylesUrl = moduleUrl(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const layoutUrl = moduleUrl((await readFile(new URL('./siteEditorLayout.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const model = await import(stylesUrl)
const documentModel = await import(moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorLayout'", JSON.stringify(layoutUrl))))
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const size = (start, end, fontSize = 24) => ({ start, end, style: { fontSize } })

test('selection updates preserve unrelated formatting and merge adjacent equal runs without mutating inputs', () => {
  assert.equal(typeof model.applyTextStyle, 'function')
  const runs = [size(0, 6)]
  assert.deepEqual(model.applyTextStyle('abcdef', runs, 2, 4, { fontFamily: 'hahmlet' }), [size(0, 2), { start: 2, end: 4, style: { fontSize: 24, fontFamily: 'hahmlet' } }, size(4, 6)])
  assert.deepEqual(model.applyTextStyle('abcdef', runs, 2, 4, { fontSize: 24 }), runs)
  assert.deepEqual(runs, [size(0, 6)])
})

test('clearing a selected property retains other properties and reset clears only selected characters', () => {
  assert.equal(typeof model.applyTextStyle, 'function')
  const runs = [{ start: 0, end: 4, style: { fontSize: 24, fontFamily: 'hahmlet' } }]
  assert.deepEqual(model.applyTextStyle('abcd', runs, 1, 3, { fontSize: undefined }), [{ start: 0, end: 1, style: runs[0].style }, { start: 1, end: 3, style: { fontFamily: 'hahmlet' } }, { start: 3, end: 4, style: runs[0].style }])
  assert.deepEqual(model.applyTextStyle('abcd', [size(0, 4)], 1, 3, null), [size(0, 1), size(3, 4)])
  assert.deepEqual(model.applyTextStyle('abcd', [], 2, 2, { fontSize: 24 }), [])
})

test('UTF-16 selections expand to whole emoji, combining marks and Korean jamo graphemes', () => {
  assert.equal(typeof model.applyTextStyle, 'function')
  for (const [text, start, end, want] of [
    ['A😀B', 2, 3, [size(1, 3)]],
    ['Ae\u0301B', 2, 3, [size(1, 3)]],
    ['A👩‍👩‍👧‍👦B', 4, 5, [size(1, 12)]],
    ['A한B', 2, 3, [size(1, 4)]],
  ]) assert.deepEqual(model.applyTextStyle(text, [], start, end, { fontSize: 24 }), want)
})

test('text edits retain unchanged styled characters while inserted and replaced text inherit no style', () => {
  assert.equal(typeof model.rebaseTextRuns, 'function')
  assert.deepEqual(model.rebaseTextRuns('abcd', 'abXXcd', [size(0, 4)]), [size(0, 2), size(4, 6)])
  assert.deepEqual(model.rebaseTextRuns('abcdef', 'abXYef', [size(0, 6)]), [size(0, 2), size(4, 6)])
  assert.deepEqual(model.rebaseTextRuns('abcdef', 'abef', [size(0, 6)]), [size(0, 4)])
  assert.deepEqual(model.rebaseTextRuns('A😀B', 'AxB', [size(1, 3), size(3, 4, 30)]), [size(2, 3, 30)])
  assert.deepEqual(model.rebaseTextRuns('e!', 'e\u0301!', [size(0, 1)]), [])
})

test('device styles override shared styles only for the exact text snapshot including explicit cleared overrides', () => {
  assert.equal(typeof model.resolveTextRuns, 'function')
  const doc = { ...empty(), textStyles: { shared: { title: { text: '제목', runs: [size(0, 2)] } }, mobile: { title: { text: '제목', runs: [] } } } }
  assert.deepEqual(model.resolveTextRuns(doc, 'desktop', 'title', '제목'), [size(0, 2)])
  assert.deepEqual(model.resolveTextRuns(doc, 'mobile', 'title', '제목'), [])
  assert.deepEqual(model.resolveTextRuns(doc, 'desktop', 'title', '새 제목'), [])
  assert.deepEqual(model.resolveTextRuns({ ...doc, textStyles: { ...doc.textStyles, mobile: { title: { text: '이전', runs: [size(0, 2)] } } } }, 'mobile', 'title', '제목'), [size(0, 2)])
})

test('version-one documents accept bounded styles without changing legacy documents', () => {
  assert.equal(documentModel.validateSiteEditorDocument(empty()), null)
  assert.equal(documentModel.validateSiteEditorDocument({ ...empty(), textStyles: { shared: { title: { text: 'A😀B', runs: [size(1, 3)] } } } }), null)
  assert.equal(documentModel.validateSiteEditorDocument({ ...empty(), textStyles: {} }), null)
})

test('serialized styles reject injection, ambiguous ranges, partial graphemes, invalid size and unknown properties', () => {
  assert.equal(typeof model.validateTextStyles, 'function')
  const valid = { text: 'A😀Be\u0301C', runs: [size(1, 3)] }
  const invalidCopies = [
    { ...valid, html: 'unsafe' }, { text: '<b>x</b>', runs: [] }, { text: 'x'.repeat(10001), runs: [] },
    { text: valid.text, runs: [size(0, 2)] }, { text: valid.text, runs: [size(4, 5)] },
    { text: valid.text, runs: [size(0, 4), size(3, 4)] }, { text: valid.text, runs: [size(3, 4), size(0, 1)] },
    { text: valid.text, runs: [size(1, 1)] }, { text: valid.text, runs: [size(-1, 1)] }, { text: valid.text, runs: [size(0, 99)] },
    { text: valid.text, runs: [size(0, 1, 9)] }, { text: valid.text, runs: [size(0, 1, 121)] }, { text: valid.text, runs: [size(0, 1, NaN)] },
    { text: valid.text, runs: [{ start: 0, end: 1, style: { fontFamily: 'url(evil)' } }] },
    { text: valid.text, runs: [{ start: 0, end: 1, style: { color: 'red' } }] },
    { text: valid.text, runs: [{ start: 0, end: 1, style: {} }] },
    { text: valid.text, runs: [{ ...size(0, 1), extra: true }] },
    { text: 'x'.repeat(501), runs: Array.from({ length: 501 }, (_, i) => size(i, i + 1)) },
  ]
  for (const copy of invalidCopies) assert.ok(model.validateTextStyles({ shared: { title: copy } }), JSON.stringify(copy).slice(0, 200))
  for (const styles of [null, [], { watch: {} }, JSON.parse('{"shared":{"__proto__":{"text":"x","runs":[]}}}')]) assert.ok(model.validateTextStyles(styles))
  assert.equal(model.validateTextStyles({ shared: { title: valid } }), null)
  assert.ok(documentModel.validateSiteEditorDocument({ ...empty(), textStyles: { shared: { title: invalidCopies[0] } } }))
})

test('text snapshots count toward the existing document byte budget', () => {
  const copies = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`text${i}`, { text: '한'.repeat(10000), runs: [] }]))
  assert.match(documentModel.validateSiteEditorDocument({ ...empty(), textStyles: { shared: copies } }), /512KB/)
})

test('browsers without Intl.Segmenter still load defaults and edit plain copy while formatting fails safely', async () => {
  const original = Intl.Segmenter
  let legacyStyles, legacyDocument, legacySession
  try {
    Intl.Segmenter = undefined
    const unavailableUrl = moduleUrl(`${await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8')}\n// Browser without grapheme segmentation`)
    legacyStyles = await import(unavailableUrl)
    const unavailableLayoutUrl = moduleUrl((await readFile(new URL('./siteEditorLayout.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(unavailableUrl)))
    legacyDocument = await import(moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(unavailableUrl)).replaceAll("'./siteEditorLayout'", JSON.stringify(unavailableLayoutUrl))))
    legacySession = await import(moduleUrl((await readFile(new URL('../components/admin/site-editor/editorSessionModel.ts', import.meta.url), 'utf8')).replaceAll("'../../../lib/siteEditorTextStyles'", JSON.stringify(unavailableUrl)).replaceAll("'../../../lib/siteEditorLayout'", JSON.stringify(unavailableLayoutUrl))))
  } finally { Intl.Segmenter = original }
  assert.equal(legacyStyles.supportsTextSegmentation, false)
  assert.equal(legacyDocument.validateSiteEditorDocument(empty()), null)
  assert.equal(legacyDocument.resolveEditorCopy({}, 'home', 'home.title', '기존 홈페이지', 'mobile'), '기존 홈페이지')
  assert.equal(legacyDocument.buildEditorCss({}, 'home'), '')
  const draft = { ...empty(), copy: { title: 'A😀B' }, textStyles: { shared: { title: { text: 'A😀B', runs: [size(1, 3)] } } } }
  assert.equal(legacyDocument.validateSiteEditorDocument(draft), null)
  assert.deepEqual(legacyStyles.resolveTextRuns(draft, 'shared', 'title', 'A😀B'), [])
  assert.deepEqual(legacyStyles.snapTextSelection('A😀B', 1, 3), { start: 1, end: 3 })
  assert.throws(() => legacyStyles.applyTextStyle('A😀B', [], 1, 3, { fontSize: 24 }), /브라우저.*글자 서식/)
  assert.deepEqual(legacyStyles.rebaseTextRuns('기존', '새 문구', []), [])
  const record = { page_key: 'home', draft, published: null, version: 0, updated_at: '', published_at: null }
  let session = legacySession.createEditorSession(record)
  session = legacySession.editSessionCopy(session, 'shared', 'title', 'A 새 문구 B')
  assert.equal(session.document.copy.title, 'A 새 문구 B')
  assert.deepEqual(session.document.textStyles.shared.title, { text: 'A😀B', runs: [size(1, 3)] }, 'unavailable segmentation keeps the old snapshot dormant rather than moving its offsets')
})

test('version-one snapshots accept only the explicit character color, weight, style and decoration values', () => {
  const cases = [
    { color: '#A0b1C2' }, { color: '#000000' }, { color: '#FFFFFF' },
    ...[400, 500, 600, 700, 800].map(fontWeight => ({ fontWeight })),
    ...['normal', 'italic'].map(fontStyle => ({ fontStyle })),
    ...['none', 'underline', 'line-through'].map(textDecoration => ({ textDecoration })),
    { fontFamily: 'hahmlet', fontSize: 32, color: '#10233F', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' },
  ]
  for (const style of cases) {
    const document = { ...empty(), textStyles: { shared: { title: { text: '제목', runs: [{ start: 0, end: 2, style }] } } } }
    const before = structuredClone(document)
    assert.equal(documentModel.validateSiteEditorDocument(document), null, JSON.stringify(style))
    assert.deepEqual(model.resolveTextRuns(document, 'desktop', 'title', '제목'), [{ start: 0, end: 2, style }])
    assert.deepEqual(document, before)
  }
  assert.deepEqual(documentModel.emptySiteEditorDocument(), empty())
  assert.equal(documentModel.buildEditorCss({ home: empty() }, 'home'), '')
})

test('color and emphasis updates affect only selected characters while keeping existing font and size', () => {
  const original = [size(0, 6)]
  const result = model.applyTextStyle('abcdef', original, 2, 4, { color: '#123ABC', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' })
  assert.deepEqual(result, [size(0, 2), { start: 2, end: 4, style: { fontSize: 24, color: '#123ABC', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' } }, size(4, 6)])
  assert.deepEqual(original, [size(0, 6)])
})

test('adjacent runs differing in any new property are never incorrectly merged', () => {
  for (const [first, second] of [
    [{ color: '#112233' }, { color: '#445566' }],
    [{ fontWeight: 400 }, { fontWeight: 700 }],
    [{ fontStyle: 'normal' }, { fontStyle: 'italic' }],
    [{ textDecoration: 'none' }, { textDecoration: 'underline' }],
  ]) {
    const runs = [{ start: 0, end: 2, style: first }, { start: 2, end: 4, style: second }]
    assert.deepEqual(model.applyTextStyle('abcd', runs, 0, 4, {}), runs)
    assert.deepEqual(model.rebaseTextRuns('aXXb', 'ab', [{ start: 0, end: 1, style: first }, { start: 3, end: 4, style: second }]), [{ start: 0, end: 1, style: first }, { start: 1, end: 2, style: second }])
  }
})

test('each optional style property can be removed without losing other selected formatting', () => {
  const full = { fontFamily: 'hahmlet', fontSize: 24, color: '#10233F', fontWeight: 600, fontStyle: 'italic', textDecoration: 'line-through' }
  const runs = [{ start: 0, end: 4, style: full }]
  const partiallyCleared = model.applyTextStyle('abcd', runs, 1, 3, { color: undefined, fontWeight: undefined, fontStyle: undefined, textDecoration: undefined })
  assert.deepEqual(partiallyCleared, [
    { start: 0, end: 1, style: full },
    { start: 1, end: 3, style: { fontFamily: 'hahmlet', fontSize: 24 } },
    { start: 3, end: 4, style: full },
  ])
  assert.deepEqual(model.applyTextStyle('abcd', runs, 0, 4, { fontFamily: undefined, fontSize: undefined, color: undefined, fontWeight: undefined, fontStyle: undefined, textDecoration: undefined }), [])
  assert.deepEqual(model.applyTextStyle('abcd', runs, 1, 3, null), [{ start: 0, end: 1, style: full }, { start: 3, end: 4, style: full }])
  assert.deepEqual(model.applyTextStyle('abcd', [], 0, 4, { fontStyle: 'normal', textDecoration: 'none' }), [{ start: 0, end: 4, style: { fontStyle: 'normal', textDecoration: 'none' } }])
})

test('canonical character styles preserve all properties and remove undefined independent of object key order', () => {
  assert.equal(typeof model.canonicalTextStyle, 'function')
  const style = { textDecoration: 'underline', fontStyle: 'italic', fontWeight: 700, color: '#112233', fontSize: 30, fontFamily: 'hahmlet' }
  const canonical = model.canonicalTextStyle(style)
  assert.equal(JSON.stringify(canonical), '{"fontFamily":"hahmlet","fontSize":30,"color":"#112233","fontWeight":700,"fontStyle":"italic","textDecoration":"underline"}')
  assert.deepEqual(model.canonicalTextStyle({ fontSize: undefined, fontFamily: undefined, color: '#112233', fontWeight: undefined, fontStyle: 'normal', textDecoration: 'none' }), { color: '#112233', fontStyle: 'normal', textDecoration: 'none' })
  assert.deepEqual(style, { textDecoration: 'underline', fontStyle: 'italic', fontWeight: 700, color: '#112233', fontSize: 30, fontFamily: 'hahmlet' })
})

test('new style values reject CSS injection, shorthand colors, unapproved weights and arbitrary decorations', () => {
  for (const style of [
    ...['red', '#abc', '#12345678', '#12345G', '#123456;display:none', 'var(--secret)', 'url(javascript:1)', ' #123456', '#123456 '].map(color => ({ color })),
    ...[300, 900, 450, '700', null, Infinity].map(fontWeight => ({ fontWeight })),
    ...['oblique', 'initial', '', null].map(fontStyle => ({ fontStyle })),
    ...['underline line-through', 'overline', 'inherit', '', null].map(textDecoration => ({ textDecoration })),
    { color: undefined }, { fontWeight: undefined }, { fontStyle: undefined }, { textDecoration: undefined },
    { backgroundColor: '#123456' }, { color: '#123456', fontWeight: 700, css: 'display:none' },
  ]) {
    assert.ok(model.validateTextStyles({ shared: { title: { text: '제목', runs: [{ start: 0, end: 2, style }] } } }), JSON.stringify(style))
    if (!Object.values(style).includes(undefined)) assert.throws(() => model.applyTextStyle('제목', [], 0, 2, style), RangeError)
  }
})
