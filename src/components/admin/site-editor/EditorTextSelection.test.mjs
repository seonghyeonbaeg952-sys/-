import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const compile = async relative => ts.transpileModule(await readFile(new URL(relative, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
function load(code, dependencies) {
  const exports = {}
  vm.runInThisContext(`(function(exports, require) { ${code}\n})`)(exports, name => dependencies[name] ?? require(name))
  return exports
}
const styles = load(await compile('../../../lib/siteEditorTextStyles.ts'), {})
const layouts = load(await compile('../../../lib/siteEditorLayout.ts'), { './siteEditorTextStyles': styles })
const options = load(await compile('./editorUiOptions.ts'), { '../../../lib/siteEditorLayout': layouts })
const context = load(await compile('../../site-editor/useSiteEditor.ts'), {})
const canvasCopy = load(await compile('../../site-editor/CanvasCopy.tsx'), { './useSiteEditor': context })
const formatted = load(await compile('../../site-editor/FormattedCopy.tsx'), {
  '../../lib/siteEditorTextStyles': styles, './useSiteEditor': context, './CanvasCopy': canvasCopy,
})
const code = await compile('./EditorTextSelection.tsx')

function editor(initial = {}) {
  const slots = []
  let cursor = 0, tree
  let value = initial.value ?? '함께 노래해요'
  let runs = structuredClone(initial.runs ?? [])
  let active = 'text'
  const textarea = { value, selectionStart: 0, selectionEnd: 0,
    focus() { active = 'text' },
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end },
  }
  const component = load(code, {
    react: {
      ...require('react'), useId: () => 'selection-test',
      useState(initialState) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initialState === 'function' ? initialState() : initialState; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
      useRef(initialState) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initialState }; return slots[i] },
    },
    '../../../lib/siteEditorTextStyles': styles,
    '../../site-editor/FormattedCopy': formatted,
    '../../common/Button': { Button: 'Button' },
    './editorUiOptions': options,
  })
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return []
    return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child))].filter(Boolean)
  }
  function render() {
    cursor = 0
    tree = component.EditorTextSelection({ label: '제목', value, runs, allowFormatting: initial.allowFormatting ?? true,
      onChange(text, nextRuns) { value = text; runs = nextRuns },
      onCompositionChange: initial.onCompositionChange,
    })
    textarea.value = value
    find(node => node.type === 'textarea')[0].props.ref.current = textarea
  }
  const input = () => find(node => node.type === 'textarea')[0]
  const button = label => find(node => node.type === 'Button' && node.props.children === label)[0]
  render()
  return {
    find, render, input, button,
    snapshot: () => structuredClone({ text: value, runs }),
    focus: () => ({ active, start: textarea.selectionStart, end: textarea.selectionEnd }),
    select(start, end) { textarea.setSelectionRange(start, end); input().props.onSelect({ currentTarget: textarea }); render() },
    changeFont(font) { active = 'font'; find(node => node.type === 'select')[0].props.onChange({ target: { value: font } }); render() },
    size(text) { active = 'size'; find(node => node.type === 'input' && node.props.type === 'number')[0].props.onChange({ target: { value: text } }); render() },
    click(label) { const target = button(label); assert.ok(target, label); assert.equal(Boolean(target.props.disabled), false, `${label} must be enabled`); target.props.onClick(); render() },
    type(text, isComposing = false) { textarea.value = text; input().props.onChange({ currentTarget: textarea, target: textarea, nativeEvent: { isComposing } }); render() },
    compose(type) { input().props[type === 'start' ? 'onCompositionStart' : 'onCompositionEnd']?.({ currentTarget: textarea, target: textarea, nativeEvent: { isComposing: type === 'start' } }); render() },
    key(key, { shiftKey = false, isComposing = false } = {}) { let prevented = false; input().props.onKeyDown({ key, ctrlKey: true, metaKey: false, shiftKey, nativeEvent: { isComposing }, preventDefault() { prevented = true } }); render(); return prevented },
    remote(text, nextRuns = []) { value = text; runs = nextRuns; render() },
  }
}

test('opening the text editor leaves original text and formatting unchanged until an explicit selection', () => {
  const p = editor({ value: '  원문\n유지  ' })
  assert.deepEqual(p.snapshot(), { text: '  원문\n유지  ', runs: [] })
  assert.equal(p.find(node => node.type === 'select')[0].props.disabled, true)
  assert.equal(p.button('크기 적용').props.disabled, true)
  assert.equal(p.button('실행 취소').props.disabled, true)
})

test('moving focus into the font toolbar keeps the selected range and changes only those characters', () => {
  const p = editor()
  p.select(3, 5)
  p.changeFont('hahmlet')
  assert.deepEqual(p.snapshot(), { text: '함께 노래해요', runs: [{ start: 3, end: 5, style: { fontFamily: 'hahmlet' } }] })
  assert.deepEqual(p.focus(), { active: 'text', start: 3, end: 5 })
  assert.equal(p.button('크기 적용').props.disabled, false)
})

test('invalid size gives a visible error without changing text or creating an undo entry', () => {
  const p = editor()
  p.select(0, 2)
  p.size('121')
  p.click('크기 적용')
  assert.deepEqual(p.snapshot(), { text: '함께 노래해요', runs: [] })
  assert.equal(p.input().props['aria-invalid'], true)
  assert.equal(p.find(node => node.props?.role === 'alert').length, 1)
  assert.equal(p.button('실행 취소').props.disabled, true)
  p.size('30')
  p.click('크기 적용')
  assert.deepEqual(p.snapshot().runs, [{ start: 0, end: 2, style: { fontSize: 30 } }])
  assert.equal(p.input().props['aria-invalid'], false)
})

test('undo and redo distinguish different formatting snapshots even when their text is identical', () => {
  const p = editor()
  p.select(0, 2)
  p.changeFont('hahmlet')
  p.size('32')
  p.click('크기 적용')
  assert.deepEqual(p.snapshot().runs, [{ start: 0, end: 2, style: { fontFamily: 'hahmlet', fontSize: 32 } }])
  p.click('실행 취소')
  assert.deepEqual(p.snapshot(), { text: '함께 노래해요', runs: [{ start: 0, end: 2, style: { fontFamily: 'hahmlet' } }] })
  p.click('다시 실행')
  assert.deepEqual(p.snapshot().runs, [{ start: 0, end: 2, style: { fontFamily: 'hahmlet', fontSize: 32 } }])
})

test('text insertion preserves existing styled characters and undo restores text with its offsets', () => {
  const p = editor({ value: 'abcd', runs: [{ start: 0, end: 4, style: { fontSize: 24 } }] })
  p.type('abXcd')
  assert.deepEqual(p.snapshot(), { text: 'abXcd', runs: [{ start: 0, end: 2, style: { fontSize: 24 } }, { start: 3, end: 5, style: { fontSize: 24 } }] })
  assert.equal(p.key('z'), true)
  assert.deepEqual(p.snapshot(), { text: 'abcd', runs: [{ start: 0, end: 4, style: { fontSize: 24 } }] })
  assert.equal(p.key('z', { shiftKey: true }), true)
  assert.equal(p.snapshot().text, 'abXcd')
})

test('a later server replacement invalidates local undo instead of overwriting the new server text', () => {
  const p = editor()
  p.type('내 수정')
  p.remote('다른 관리자의 문구')
  assert.equal(p.button('실행 취소').props.disabled, true)
  p.key('z')
  assert.deepEqual(p.snapshot(), { text: '다른 관리자의 문구', runs: [] })
})

test('keyboard undo is left to the input method while Korean composition is active', () => {
  const p = editor({ value: '' })
  p.compose('start')
  p.type('ㅎ', true)
  assert.equal(p.key('z', { isComposing: true }), false)
  assert.equal(p.snapshot().text, 'ㅎ')
})

test('one undo reverses a completed Korean IME composition without leaving an unfinished syllable', () => {
  const p = editor({ value: '' })
  p.compose('start')
  p.type('ㅎ', true)
  p.type('하', true)
  p.type('한', true)
  p.compose('end')
  p.type('한', false)
  assert.equal(p.snapshot().text, '한')
  p.key('z')
  assert.equal(p.snapshot().text, '')
  p.key('z', { shiftKey: true })
  assert.equal(p.snapshot().text, '한')
})

test('outer document history receives one composition boundary including the final text', () => {
  const phases = []
  const p = editor({ value: '', onCompositionChange: active => phases.push({ active, text: p.snapshot().text }) })
  p.compose('start'); p.type('ㅎ', true); p.type('하', true); p.type('한', true); p.compose('end')
  assert.deepEqual(phases, [{ active: true, text: '' }, { active: false, text: '한' }])
})
