import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const compileUrl = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const stylesUrl = compileUrl(await readFile(new URL('../../../lib/siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const documentUrl = compileUrl((await readFile(new URL('../../../lib/siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const copyTools = await import(compileUrl((await readFile(new URL('./editorCopyTools.ts', import.meta.url), 'utf8')).replaceAll("'../../../lib/siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'../../../lib/siteEditorModel'", JSON.stringify(documentUrl))))
const code = ts.transpileModule(await readFile(new URL('./EditorCopyPanel.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

function panel(definitions) {
  const slots = []
  let cursor = 0, tree
  const document = { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => {
    if (name === 'react') return {
      useId: () => 'copy-test',
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
      useMemo(fn) { cursor++; return fn() },
      useRef(value) { const i = cursor++; slots[i] ??= { current: value }; return slots[i] },
      useEffect() { cursor++ },
    }
    if (name === 'react/jsx-runtime') return require(name)
    const component = name.split('/').at(-1)
    if (['AdminFormField', 'AdminSelect', 'AdminTextarea', 'Button', 'EditorTextSelection', 'EditorCopyActions'].includes(component)) return { [component]: component }
    if (component === 'editorCopyTools') return copyTools
    if (component === 'richCopyKeys') return { richCopyKeys: new Set(definitions.map(d => d.key)) }
    if (component === 'homeRichCopyKeys') return { homeRichCopySourceKeys: { mobile: new Set(), tablet: new Set(), desktop: new Set() } }
    if (component === 'siteEditorTextStyles') return { resolveTextRuns: () => [], supportsTextSegmentation: true }
    throw new Error(name)
  } })
  function render() {
    cursor = 0
    tree = exports.EditorCopyPanel({ definitions, document, baseline: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} }, scope: 'shared', defaults: {}, onFormat(key, text) { document.copy[key] = text }, onChange(key, value) {
      if (value === undefined) delete document.copy[key]
      else document.copy[key] = value
    } })
  }
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return []
    return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child))].filter(Boolean)
  }
  render()
  return { render, find, document,
    search(value) { find(n => n.props?.label === '문구 찾기')[0].props.onChange({ target: { value } }); render() },
    edit(label, value) { const editor = find(n => n.props?.label === label)[0]; editor.props.onChange(value, []); render() },
    fields() { return find(n => n.props?.className === 'site-editor__field') },
    choices() { return find(n => n.props?.className === 'site-editor__copy-choice') },
  }
}

const definition = (n, value = `본문 ${n}`) => ({ key: `test.${n}`, page: 'join', section: n % 2 ? '신청' : '안내', label: `항목 ${n}`, defaultValue: value })

test('editing a matched sentence does not remove its input when the search word is replaced', () => {
  const p = panel([definition(1, '반가운 합창단'), definition(2, '일정 안내')])
  p.search('반가운')
  assert.equal(p.fields().length, 1)
  p.edit('항목 1', '새로운 문장')
  assert.equal(p.find(n => n.props?.label === '항목 1').length, 1, 'the focused editor must remain mounted while typing')
  assert.equal(p.document.copy['test.1'], '새로운 문장')
  p.search('일정')
  assert.equal(p.find(n => n.props?.label === '항목 1').length, 0, 'an explicit new search must refresh results')
  assert.equal(p.find(n => n.props?.label === '항목 2').length, 1)
})

test('a long catalogue shows one editor and bounded choices, keeping each phrase draft across selection', () => {
  const p = panel(Array.from({ length: 45 }, (_, i) => definition(i)))
  assert.equal(p.fields().length, 1)
  assert.equal(p.choices().length, 20)
  p.edit('항목 0', '보존할 초안')
  const more = p.find(n => n.type === 'Button' && String(n.props.children).includes('더 보기'))[0]
  assert.ok(more, 'the rest of the catalogue must be reachable')
  more.props.onClick(); p.render()
  assert.equal(p.fields().length, 1)
  assert.equal(p.choices().length, 40)
  assert.equal(p.find(n => n.props?.label === '항목 0')[0].props.value, '보존할 초안')
  p.search('항목 44')
  assert.equal(p.fields().length, 1)
  p.search('')
  assert.equal(p.fields().length, 1)
  assert.equal(p.choices().length, 20)
  assert.equal(p.document.copy['test.0'], '보존할 초안')
})

test('choosing another phrase changes only that phrase and clearly marks its selection', () => {
  const p = panel([definition(1), definition(2)])
  const choices = p.choices()
  assert.equal(choices.length, 2)
  choices[1].props.onClick(); p.render()
  assert.equal(p.choices()[1].props['aria-pressed'], true)
  p.edit('항목 2', '바꾼 문구')
  assert.equal(p.document.copy['test.2'], '바꾼 문구')
  assert.equal(p.document.copy['test.1'], undefined)
})

test('next result moves to the next phrase and previous wraps without editing content', () => {
  const p = panel([definition(1, '서울 합창단'), definition(2, '청소년 합창단')])
  p.search('합창단')
  const next = p.find(n => n.props?.['aria-label'] === '다음 검색 결과')[0]
  assert.ok(next, 'search needs keyboard-operable result navigation')
  next.props.onClick(); p.render()
  assert.equal(p.choices()[1].props['aria-pressed'], true)
  const previous = p.find(n => n.props?.['aria-label'] === '이전 검색 결과')[0]
  previous.props.onClick(); p.render()
  assert.equal(p.choices()[0].props['aria-pressed'], true)
  assert.deepEqual(p.document.copy, {})
})

test('changed-only view includes locally edited text but excludes untouched fallback values', () => {
  const p = panel([definition(1), definition(2)])
  p.edit('항목 1', '수정한 내용')
  const filter = p.find(n => n.props?.label === '문구 보기')[0]
  assert.ok(filter)
  filter.props.onChange({ target: { value: 'changed' } }); p.render()
  assert.equal(p.choices().length, 1)
  assert.equal(p.find(n => n.props?.label === '항목 1').length, 1)
})

test('favorite filtering is reversible and does not change a website document', () => {
  const p = panel([definition(1), definition(2)])
  const pin = p.find(n => n.props?.['aria-label'] === '선택 문구 즐겨찾기')[0]
  assert.ok(pin)
  pin.props.onClick(); p.render()
  p.find(n => n.props?.label === '문구 보기')[0].props.onChange({ target: { value: 'favorites' } }); p.render()
  assert.equal(p.choices().length, 1)
  assert.deepEqual(p.document.copy, {})
})

test('a Korean composition keeps the active text input mounted while discovery controls are disabled', () => {
  const p = panel([definition(1), definition(2)])
  const input = p.find(n => n.type === 'EditorTextSelection')[0]
  input.props.onCompositionChange(true); p.render()
  assert.equal(p.find(n => n.props?.label === '문구 찾기')[0].props.disabled, true)
  assert.equal(p.find(n => n.props?.label === '문구 보기')[0].props.disabled, true)
  assert.equal(p.choices()[1].props.disabled, true)
  assert.equal(p.find(n => n.type === 'EditorTextSelection').length, 1)
  p.find(n => n.type === 'EditorTextSelection')[0].props.onCompositionChange(false); p.render()
  assert.equal(p.find(n => n.props?.label === '문구 찾기')[0].props.disabled, false)
})
