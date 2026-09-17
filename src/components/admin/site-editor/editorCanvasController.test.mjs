import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const exists = await readFile(new URL('./editorCanvasController.ts', import.meta.url), 'utf8').catch(error => {
  if (error.code === 'ENOENT') return null
  throw error
})
const api = exists ? await vite.ssrLoadModule('/src/components/admin/site-editor/editorCanvasController.ts') : {}
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const context = (overrides = {}) => ({
  editorPage: 'notices', previewPage: 'notices', device: 'desktop', scope: 'desktop', documents: { notices: empty() },
  loadedOwners: new Set(['notices']), defaultsTrusted: true,
  defaults: { 'notices.title': '공지사항', 'notices.description': '소개 문장' }, baseDraftSequence: 7, ...overrides,
})
const source = (text = '공지사항', key = 'notices.title', ownerPage = 'notices', scope = 'desktop') => ({ text, key, ownerPage, scope })
const block = (value = source(), overrides = {}) => ({
  id: 'notices-title', label: '공지 제목', visibleText: value.text, revision: 2,
  segments: [{ source: value, sourceStart: 0, sourceEnd: value.text.length, visibleStart: 0, visibleEnd: value.text.length, transform: 'exact' }],
  capabilities: { format: true, replaceText: true }, ...overrides,
})
const options = () => { let sequence = 0; return { editId: 'edit-fixture-1', fieldVersionFactory: () => `field-version-${++sequence}` } }
function make(ctx = context(), value = block()) {
  assert.equal(typeof api.makeCanvasGrant, 'function')
  return api.makeCanvasGrant(ctx, value, options())
}
function issue(ctx = context(), value = block()) { const result = make(ctx, value); assert.equal(result.ok, true, result.message); return result.issued }
function commit(ctx, issued, changes) { assert.equal(typeof api.commitCanvasGrant, 'function'); return api.commitCanvasGrant(ctx, issued, changes) }
const patch = (issued, edits, index = 0) => ({ source: issued.grant.fields[index].source, fieldVersion: issued.grant.fields[index].fieldVersion, edits })
const replacement = (start, end, text, runs = []) => ({ start, end, text, runs })
const style = (start, end, properties) => ({ start, end, style: properties })

test('plain copy edits do not invent an empty formatting override or a second changed field', () => {
  const ctx = context(), issued = issue(ctx)
  const result = commit(ctx, issued, [patch(issued, [replacement(0, 4, '합창 소식')])])
  assert.equal(result.ok, true)
  assert.equal(result.document.deviceCopy.desktop['notices.title'], '합창 소식')
  assert.equal(result.document.textStyles, undefined)
})

test('the parent issues only its resolved catalog source and keeps the ledger outside the wire grant', () => {
  const issued = issue()
  assert.deepEqual(issued.grant, {
    editId: 'edit-fixture-1', blockId: 'notices-title', blockRevision: 2, ownerPage: 'notices', scope: 'desktop', device: 'desktop', baseDraftSequence: 7,
    fields: [{ source: { ownerPage: 'notices', scope: 'desktop', key: 'notices.title' }, fieldVersion: 'field-version-1', text: '공지사항', runs: [], ranges: [{ start: 0, end: 4 }] }],
  })
  assert.ok(issued.state)
  assert.equal(Object.hasOwn(issued.grant, 'state'), false)
})

test('unloaded owners, untrusted defaults, stale renderer text and an unrelated owning page cannot obtain a grant', () => {
  for (const [ctx, value] of [
    [context({ loadedOwners: new Set() }), block()],
    [context({ defaultsTrusted: false }), block()],
    [context({ documents: {} }), block()],
    [context(), block(source('다른 문구'))],
    [context(), block(source('지원서', 'join.applicationTitle', 'join'))],
    [context({ previewPage: 'home' }), block()],
  ]) assert.equal(make(ctx, value).ok, false)
})

test('unknown keys, metadata-only copy and home fields for another device are rejected', () => {
  for (const value of [source('x', 'notices.unknown'), source('공지 제목 또는 내용 검색', 'notices.searchPlaceholder'), source('x', '__proto__.bad')]) {
    assert.equal(make(context({ defaults: { [value.key]: value.text } }), block(value)).ok, false)
  }
  const home = context({ editorPage: 'home', previewPage: 'home', device: 'mobile', scope: 'mobile', loadedOwners: new Set(['home']), documents: { home: empty() }, defaults: { 'home.current.about.title': '원문' } })
  assert.equal(make(home, block(source('원문', 'home.current.about.title', 'home', 'mobile'))).ok, false)
  assert.equal(make(context({ device: 'mobile', scope: 'desktop' }), block()).ok, false)
})

test('common copy can be edited from the home preview only with a parent-trusted matching fallback', () => {
  const key = 'common.fixed.Footer.9bb6e639c7'
  const ctx = context({ editorPage: 'common', previewPage: 'home', loadedOwners: new Set(['common']), documents: { common: empty(), home: empty() }, defaults: { [key]: '합창단 원문' } })
  const issued = issue(ctx, block(source('합창단 원문', key, 'common')))
  const result = commit(ctx, issued, [patch(issued, [replacement(0, 6, '합창단 안내')])])
  assert.equal(result.ok, true)
  assert.equal(result.ownerPage, 'common')
  assert.equal(result.document.deviceCopy.desktop[key], '합창단 안내')
  assert.deepEqual(ctx.documents.home, empty())
  assert.equal(make({ ...ctx, defaults: { [key]: '다른 내비게이션 원문' } }, block(source('합창단 원문', key, 'common'))).ok, false)
})

test('shared edits cannot target copy or style hidden behind a device override, even when the text is identical', () => {
  for (const doc of [
    { ...empty(), deviceCopy: { desktop: { 'notices.title': '공지사항' } } },
    { ...empty(), textStyles: { desktop: { 'notices.title': { text: '공지사항', runs: [] } } } },
  ]) assert.equal(make(context({ scope: 'shared', documents: { notices: doc } }), block(source('공지사항', 'notices.title', 'notices', 'shared'))).ok, false)
})

test('granted slice and normalized ranges exclude invisible source prefixes and suffixes', () => {
  const text = source('앞|  A   B  |뒤')
  const value = block(text, { visibleText: 'A B', segments: [{ source: text, sourceStart: 2, sourceEnd: 11, visibleStart: 0, visibleEnd: 3, transform: 'collapse-whitespace' }] })
  const ctx = context({ defaults: { 'notices.title': text.text } })
  const issued = issue(ctx, value)
  assert.deepEqual(issued.grant.fields[0].ranges, [{ start: 4, end: 9 }])
  assert.equal(commit(ctx, issued, [patch(issued, [replacement(2, 9, '바꿈')])]).ok, false)
  const result = commit(ctx, issued, [patch(issued, [replacement(4, 9, 'C')])])
  assert.equal(result.ok, true)
  assert.equal(result.document.deviceCopy.desktop['notices.title'], '앞|  C  |뒤')
})

test('text splicing preserves surrounding copy and all six style properties outside the granted interval', () => {
  const originalRuns = [style(0, 2, { fontFamily: 'hahmlet', fontSize: 32, color: '#112233', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' }), style(4, 6, { color: '#445566', fontWeight: 500 })]
  const ctx = context({ defaults: { 'notices.title': '앞앞중중뒤뒤' }, documents: { notices: { ...empty(), textStyles: { shared: { 'notices.title': { text: '앞앞중중뒤뒤', runs: originalRuns } } } } } })
  const text = source('앞앞중중뒤뒤')
  const issued = issue(ctx, block(text, { visibleText: '중중', segments: [{ source: text, sourceStart: 2, sourceEnd: 4, visibleStart: 0, visibleEnd: 2, transform: 'slice' }] }))
  const result = commit(ctx, issued, [patch(issued, [replacement(2, 4, '새', [style(0, 1, { fontSize: 48, color: '#abcdef', textDecoration: 'line-through' })])])])
  assert.equal(result.ok, true)
  assert.equal(result.document.deviceCopy.desktop['notices.title'], '앞앞새뒤뒤')
  assert.deepEqual(result.document.textStyles.desktop['notices.title'], { text: '앞앞새뒤뒤', runs: [originalRuns[0], style(2, 3, { fontSize: 48, color: '#abcdef', textDecoration: 'line-through' }), style(3, 5, { color: '#445566', fontWeight: 500 })] })
  assert.deepEqual(ctx.documents.notices.textStyles.shared['notices.title'].runs, originalRuns)
})

test('multiple edits use the original source positions and apply atomically without shifting later input ranges', () => {
  const ctx = context({ defaults: { 'notices.title': 'AABBCC' } }), issued = issue(ctx, block(source('AABBCC')))
  const result = commit(ctx, issued, [patch(issued, [replacement(0, 2, 'X'), replacement(4, 6, 'YYY')])])
  assert.equal(result.ok, true)
  assert.equal(result.document.deviceCopy.desktop['notices.title'], 'XBBYYY')
})

test('all granted field dependencies participate in CAS, including an unchanged field omitted from the patch list', () => {
  const first = source(), second = source('소개 문장', 'notices.description')
  const value = block(first, { visibleText: '공지사항소개 문장', segments: [
    { source: first, sourceStart: 0, sourceEnd: 4, visibleStart: 0, visibleEnd: 4, transform: 'exact' },
    { source: second, sourceStart: 0, sourceEnd: 5, visibleStart: 4, visibleEnd: 9, transform: 'exact' },
  ] })
  const ctx = context(), issued = issue(ctx, value)
  const current = context({ documents: { notices: { ...empty(), copy: { 'notices.description': '서버 변경' } } } })
  const result = commit(current, issued, [patch(issued, [replacement(0, 4, '새 제목')])])
  assert.equal(result.ok, false)
  assert.equal(result.reason, 'stale')
  assert.deepEqual(current.documents.notices.deviceCopy, {})
})

test('same-text override creation, inherited style changes and fallback changes invalidate a granted field', () => {
  const ctx = context(), issued = issue(ctx)
  for (const current of [
    context({ documents: { notices: { ...empty(), copy: { 'notices.title': '공지사항' } } } }),
    context({ documents: { notices: { ...empty(), deviceCopy: { desktop: { 'notices.title': '공지사항' } } } } }),
    context({ documents: { notices: { ...empty(), textStyles: { shared: { 'notices.title': { text: '공지사항', runs: [style(0, 2, { color: '#123456' })] } } } } } }),
    context({ documents: { notices: { ...empty(), textStyles: { desktop: { 'notices.title': { text: '공지사항', runs: [] } } } } } }),
    context({ defaults: { 'notices.title': '변한 기본값' } }),
    context({ defaults: {} }),
  ]) {
    const result = commit(current, issued, [patch(issued, [replacement(0, 4, '새 제목')])])
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'stale')
  }
})

test('unrelated field edits and a newer draft sequence are retained when the target field CAS is unchanged', () => {
  const issued = issue()
  const ctx = context({ baseDraftSequence: 99, documents: { notices: { ...empty(), copy: { 'notices.description': '다른 편집 유지' } } } })
  const result = commit(ctx, issued, [patch(issued, [replacement(0, 4, '새 제목')])])
  assert.equal(result.ok, true)
  assert.equal(result.document.copy['notices.description'], '다른 편집 유지')
  assert.equal(result.document.deviceCopy.desktop['notices.title'], '새 제목')
})

test('property ordering in equivalent style objects does not fabricate a CAS conflict', () => {
  const doc = { ...empty(), textStyles: { shared: { 'notices.title': { text: '공지사항', runs: [style(0, 2, { color: '#123456', fontSize: 32 })] } } } }
  const ctx = context({ documents: { notices: doc } }), issued = issue(ctx)
  const same = structuredClone(doc)
  same.textStyles.shared['notices.title'].runs[0].style = { fontSize: 32, color: '#123456' }
  assert.equal(commit({ ...ctx, documents: { notices: same } }, issued, [patch(issued, [replacement(2, 4, '소식')])]).ok, true)
})

test('invalid tokens, keys, scopes, overlap, split graphemes and unauthorized ranges never mutate the parent document', () => {
  const ctx = context({ defaults: { 'notices.title': 'A😀B' } }), issued = issue(ctx, block(source('A😀B')))
  const good = patch(issued, [replacement(1, 3, '새')])
  const invalid = [
    [{ ...good, fieldVersion: 'wrong-version' }], [{ ...good, source: { ...good.source, key: 'notices.description' } }],
    [{ ...good, source: { ...good.source, scope: 'mobile' } }], [{ ...good, source: { ...good.source, ownerPage: 'home' } }],
    [patch(issued, [replacement(1, 2, '새')])], [patch(issued, [replacement(0, 3, 'X'), replacement(1, 4, 'Y')])],
    [patch(issued, [replacement(0, 0, 'X'), replacement(0, 0, 'Y')])],
    [patch(issued, [replacement(0, 5, 'X')])], [patch(issued, [replacement(0, 4, '<b>HTML</b>')])],
    [patch(issued, [replacement(0, 4, '새', [style(0, 2, { fontSize: 20 })])])],
    [{ ...good, html: 'bad' }], [good, good], [],
  ]
  const before = structuredClone(ctx.documents)
  for (const changes of invalid) assert.equal(commit(ctx, issued, changes).ok, false)
  assert.deepEqual(ctx.documents, before)
})

test('format-only grants cannot replace source text', () => {
  const ctx = context(), issued = issue(ctx, block(source(), { capabilities: { format: true, replaceText: false } }))
  assert.equal(commit(ctx, issued, [patch(issued, [replacement(0, 4, '새 제목')])]).ok, false)
  assert.equal(commit(ctx, issued, [patch(issued, [replacement(0, 4, '공지사항', [style(0, 2, { fontWeight: 700 })])])]).ok, true)
  assert.deepEqual(ctx.documents.notices, empty())
})

test('a text-only grant cannot clear existing formatting by echoing plain replacement text', () => {
  const ctx = context({ documents: { notices: { ...empty(), textStyles: { shared: { 'notices.title': { text: '공지사항', runs: [style(0, 2, { color: '#123456' })] } } } } } })
  const issued = issue(ctx, block(source(), { capabilities: { format: false, replaceText: true } }))
  assert.equal(commit(ctx, issued, [patch(issued, [replacement(0, 4, '공지사항')])]).ok, false)
  assert.deepEqual(ctx.documents.notices.deviceCopy, {})
})

test('malformed Unicode and a final source exceeding its text limit reject the whole commit', () => {
  const ctx = context(), issued = issue(ctx)
  assert.equal(commit(ctx, issued, [patch(issued, [replacement(0, 4, '\ud800')])]).ok, false)
  const long = context({ defaults: { 'notices.title': 'x'.repeat(10000) } })
  const full = issue(long, block(source('x'.repeat(10000))))
  assert.equal(commit(long, full, [patch(full, [replacement(5000, 5000, 'x')])]).ok, false)
  assert.deepEqual(long.documents.notices, empty())
})

test('two explicit field replacements commit together and a malformed second field never returns a partially changed document', () => {
  const first = source(), second = source('소개 문장', 'notices.description')
  const value = block(first, { visibleText: '공지사항소개 문장', segments: [
    { source: first, sourceStart: 0, sourceEnd: 4, visibleStart: 0, visibleEnd: 4, transform: 'exact' },
    { source: second, sourceStart: 0, sourceEnd: 5, visibleStart: 4, visibleEnd: 9, transform: 'exact' },
  ] })
  const ctx = context(), issued = issue(ctx, value)
  const result = commit(ctx, issued, [patch(issued, [replacement(0, 4, '새 제목')]), patch(issued, [replacement(0, 5, '새 설명')], 1)])
  assert.equal(result.ok, true)
  assert.deepEqual(result.document.deviceCopy.desktop, { 'notices.title': '새 제목', 'notices.description': '새 설명' })
  const rejected = commit(ctx, issued, [patch(issued, [replacement(0, 4, '새 제목')]), patch(issued, [replacement(0, 6, '잘못된 설명')], 1)])
  assert.equal(rejected.ok, false)
  assert.equal(Object.hasOwn(rejected, 'document'), false)
  assert.deepEqual(ctx.documents.notices, empty())
})

test('an unchanged edit does not materialize inherited copy or style overrides', () => {
  const ctx = context(), issued = issue(ctx)
  const result = commit(ctx, issued, [patch(issued, [replacement(0, 4, '공지사항')])])
  assert.equal(result.ok, true)
  assert.deepEqual(result.document, empty())
})

test('tampering with the returned wire grant does not expand the parent-issued authority', () => {
  const ctx = context(), issued = issue(ctx)
  issued.grant.fields[0].ranges[0].end = 999
  assert.equal(commit(ctx, issued, [patch(issued, [replacement(0, 4, '새')])]).ok, false)
})
