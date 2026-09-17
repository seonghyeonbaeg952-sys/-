import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const url = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const styles = url(await readFile(new URL('../../../lib/siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const documentModel = url((await readFile(new URL('../../../lib/siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(styles)))
const tools = await import(url((await readFile(new URL('./editorCopyTools.ts', import.meta.url), 'utf8')).replaceAll("'../../../lib/siteEditorTextStyles'", JSON.stringify(styles)).replaceAll("'../../../lib/siteEditorModel'", JSON.stringify(documentModel))))
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const field = (key, value, extra = {}) => ({ key, page: 'join', section: '안내', label: key, defaultValue: value, ...extra })
const options = { matchCase: false, wholeWord: false }

test('literal search does not interpret regex or split emoji and composed graphemes', () => {
  assert.deepEqual(tools.findCopyMatches('a.b A.B aXb', 'a.b', options), [{ start: 0, end: 3 }, { start: 4, end: 7 }])
  assert.deepEqual(tools.findCopyMatches('a.b A.B', 'a.b', { ...options, matchCase: true }), [{ start: 0, end: 3 }])
  assert.deepEqual(tools.findCopyMatches('👨‍👩‍👧 가́', '👩', options), [])
  assert.deepEqual(tools.findCopyMatches('가́', '가', options), [])
  assert.deepEqual(tools.findCopyMatches('hello', '', options), [])
})
test('whole-word search supports Korean and rejects word fragments and underscores', () => {
  assert.deepEqual(tools.findCopyMatches('단원 단원소개 (단원) 단원_2', '단원', { ...options, wholeWord: true }), [{ start: 0, end: 2 }, { start: 9, end: 11 }])
})
test('resolved values distinguish blank overrides, shared fallback, and device-native fields', () => {
  const doc = { ...empty(), copy: { title: '공통' }, deviceCopy: { mobile: { title: '' } } }
  assert.equal(tools.copyValue(field('title', '원문'), doc, 'mobile', {}), '')
  assert.equal(tools.copyValue(field('title', '원문'), doc, 'desktop', {}), '공통')
  assert.equal(tools.copyValue(field('home.desktop.title', '기본'), empty(), 'desktop', { 'home.desktop.title': 'CMS 원문' }), 'CMS 원문')
})
test('one replacement preserves repeated-character styling at the actual selected offset', () => {
  const doc = { ...empty(), copy: { title: '가가가' }, textStyles: { shared: { title: { text: '가가가', runs: [{ start: 1, end: 2, style: { color: '#68233a' } }] } } } }
  const defs = [field('title', '가가가')]
  const plan = tools.planCopyReplacement(defs, doc, 'shared', {}, '가', '나나', options, { key: 'title', start: 1 })
  assert.equal(plan.items[0].after, '가나나가')
  const result = tools.applyCopyReplacement(doc, plan, defs, 'shared', {})
  assert.equal(result.ok, true)
  assert.deepEqual(result.document.textStyles.shared.title.runs, [{ start: 1, end: 3, style: { color: '#68233a' } }])
  assert.equal(doc.copy.title, '가가가')
})
test('bulk replacement is scoped, literal ($&), and preserves untouched styles and documents', () => {
  const doc = { ...empty(), copy: { a: '합창 합창', b: '합창', url: 'https://합창.test' }, deviceCopy: { mobile: { a: '다른 기기' } }, textStyles: { shared: { a: { text: '합창 합창', runs: [{ start: 0, end: 2, style: { fontWeight: 700 } }, { start: 3, end: 5, style: { fontStyle: 'italic' } }] } } } }
  const defs = [field('a', ''), field('b', ''), field('url', '', { inputType: 'url' })]
  const plan = tools.planCopyReplacement(defs, doc, 'shared', {}, '합창', '$&', options)
  assert.equal(plan.items.length, 2)
  assert.equal(plan.occurrences, 3)
  const result = tools.applyCopyReplacement(doc, plan, defs, 'shared', {})
  assert.equal(result.ok, true)
  assert.equal(result.document.copy.a, '$& $&')
  assert.equal(result.document.copy.url, 'https://합창.test')
  assert.equal(result.document.deviceCopy.mobile.a, '다른 기기')
  assert.deepEqual(result.document.textStyles.shared.a.runs, doc.textStyles.shared.a.runs)
})
test('stale text or style rejects the entire replacement without partial writes', () => {
  const defs = [field('a', '옛 값'), field('b', '옛 값')], doc = empty()
  const plan = tools.planCopyReplacement(defs, doc, 'desktop', {}, '옛', '새', options)
  const changed = { ...doc, deviceCopy: { desktop: { b: '다른 사람 입력' } } }
  assert.equal(tools.applyCopyReplacement(changed, plan, defs, 'desktop', {}).ok, false)
  assert.equal(changed.deviceCopy.desktop.a, undefined)
  const styled = { ...doc, textStyles: { desktop: { a: { text: '옛 값', runs: [{ start: 0, end: 1, style: { fontWeight: 700 } }] } } } }
  assert.equal(tools.applyCopyReplacement(styled, plan, defs, 'desktop', {}).ok, false)
  assert.equal(tools.applyCopyReplacement(doc, plan, defs, 'mobile', {}).ok, false)
})
test('replacements cannot exceed field limits, inject HTML, or edit another native device', () => {
  const defs = [field('a', '옛', { maxLength: 2 }), field('mobile.title', '옛', { sourceDevice: 'mobile' })]
  assert.ok(tools.planCopyReplacement(defs, empty(), 'desktop', {}, '옛', '세글자', options).error)
  assert.ok(tools.planCopyReplacement(defs, empty(), 'desktop', {}, '옛', '<b>x</b>', options).error)
  const plan = tools.planCopyReplacement(defs, empty(), 'desktop', {}, '옛', '새', options)
  assert.deepEqual(plan.items.map(item => item.key), ['a'])
})
test('unchanged replacements do not create overrides; user selection excludes unchecked items', () => {
  const defs = [field('a', '단원'), field('b', '단원')], doc = empty()
  assert.equal(tools.planCopyReplacement(defs, doc, 'shared', {}, '단원', '단원', options).items.length, 0)
  const plan = tools.planCopyReplacement(defs, doc, 'shared', {}, '단원', '합창단원', options)
  const result = tools.applyCopyReplacement(doc, plan, defs, 'shared', {}, ['b'])
  assert.equal(result.ok, true)
  assert.deepEqual(result.document.copy, { b: '합창단원' })
  assert.equal(result.document.textStyles, undefined)
})
test('inspection identifies whitespace and emptiness without silently modifying text', () => {
  assert.deepEqual(tools.inspectCopyText('  본문  두칸\n', 4), ['앞뒤 공백', '연속 공백', '길이 초과'])
  assert.deepEqual(tools.inspectCopyText('', 100), ['빈 문구'])
  assert.deepEqual(tools.copyTextStats('하나 둘\n👨‍👩‍👧'), { characters: 6, words: 2, lines: 2 })
})

test('a replacement that joins an untouched grapheme cannot expand the matched character style onto its neighbour', () => {
  for (const [text, query, replacement, start, end] of [
    ['AB', 'B', '\u0301', 1, 2],
    ['ᄀX', 'X', 'ᅡ', 1, 2],
    ['X👩', 'X', '👨\u200d', 0, 1],
  ]) {
    const doc = { ...empty(), copy: { title: text }, textStyles: { shared: { title: { text, runs: [
      { start, end, style: { color: '#68233a' } },
    ] } } } }
    const defs = [field('title', text)]
    const plan = tools.planCopyReplacement(defs, doc, 'shared', {}, query, replacement, options)
    assert.ok(plan.error, 'joined graphemes must be rejected instead of coloring an untouched neighbour')
    assert.deepEqual(plan.items, [])
    assert.equal(doc.copy.title, text)
  }
})

test('one unsafe joining replacement prevents every selected item from being partially changed', () => {
  const doc = empty(), defs = [field('first', 'X'), field('second', 'ᄀX')]
  const plan = tools.planCopyReplacement(defs, doc, 'shared', {}, 'X', 'ᅡ', options)
  assert.ok(plan.error)
  assert.equal(plan.occurrences, 0)
  assert.deepEqual(plan.items, [])
  assert.equal(tools.applyCopyReplacement(doc, plan, defs, 'shared', {}).ok, false)
  assert.deepEqual(doc, empty())
})
