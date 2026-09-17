import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`
const stylesUrl = moduleUrl(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const model = await import(stylesUrl)
const documentModel = await import(moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl))))
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
    legacyDocument = await import(moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(unavailableUrl))))
    legacySession = await import(moduleUrl((await readFile(new URL('../components/admin/site-editor/editorSessionModel.ts', import.meta.url), 'utf8')).replaceAll("'../../../lib/siteEditorTextStyles'", JSON.stringify(unavailableUrl))))
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
