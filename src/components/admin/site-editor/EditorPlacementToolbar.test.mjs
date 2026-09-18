import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('./EditorPlacementToolbar.tsx', import.meta.url), 'utf8').catch(error => {
  if (error.code === 'ENOENT') return ''
  throw error
})
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const first = { id: 'first', label: '제목', group: 'intro', rect: { left: 20, top: 30, width: 200, height: 60 } }
const second = { id: 'second', label: '소개 문장', group: 'intro', rect: { left: 20, top: 100, width: 200, height: 90 } }
const other = { id: 'other', label: '다른 섹션', group: 'footer', rect: { left: 0, top: 400, width: 200, height: 40 } }

// Exercise the real component's callbacks/state. This small hook harness does not
// claim to replace the parent task's real-browser focus/layout verification.
function toolbar(overrides = {}) {
  const slots = []
  let cursor = 0, tree, effects = []
  const events = []
  const dirtyChanges = []
  const props = {
    selected: first, blocks: [first, second, other], value: undefined, disabled: false,
    onChange(value) { events.push(['change', structuredClone(value)]); props.value = value },
    onSelect(id) { events.push(['select', id]) },
    onAlign(id, axis) { events.push(['align', id, axis]) },
    onCancel() { events.push(['cancel']) }, onFinish() { events.push(['finish']) },
    onDirtyChange(dirty) { dirtyChanges.push(dirty) },
    ...overrides,
  }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => {
    if (name === 'react') return {
      useId: () => 'placement-test',
      useState(initial) {
        const index = cursor++
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
        return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
      },
      useRef(value) { const index = cursor++; slots[index] ??= { current: value }; return slots[index] },
      useEffect(effect, deps) {
        const index = cursor++, previous = slots[index]
        if (previous && deps.length === previous.deps.length && deps.every((value, i) => Object.is(value, previous.deps[i]))) return
        const current = { deps, cleanup: previous?.cleanup }
        slots[index] = current
        effects.push(() => { current.cleanup?.(); current.cleanup = effect() })
      },
    }
    if (name === 'react/jsx-runtime') return require(name)
    if (name.endsWith('.css')) return {}
    const component = name.split('/').at(-1)
    if (['AdminFormField', 'AdminSelect', 'Button'].includes(component)) return { [component]: component }
    throw new Error(`Unexpected dependency: ${name}`)
  } })
  assert.equal(typeof exports.EditorPlacementToolbar, 'function', 'the placement toolbar must exist')
  function render(next = {}) {
    Object.assign(props, next); cursor = 0; tree = exports.EditorPlacementToolbar(props)
    const current = effects; effects = []; current.forEach(effect => effect())
  }
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return []
    return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child))].filter(Boolean)
  }
  function field(label) { const node = find(n => n.props?.label === label)[0]; assert.ok(node, `missing field: ${label}`); return node }
  function button(label) {
    const node = find(n => n.type === 'Button' && (n.props['aria-label'] === label || n.props.children === label))[0]
    assert.ok(node, `missing button: ${label}`); return node
  }
  render()
  return { events, dirtyChanges, find, field, button, render,
    unmount() { slots.forEach(slot => slot?.cleanup?.()) },
    edit(label, value) { field(label).props.onChange({ target: { value } }); render() },
    click(label, shiftKey = false) { button(label).props.onClick({ shiftKey }); render() },
    apply() { find(n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} }); render() },
  }
}

test('number edits remain local until one explicit apply emits one complete layout', () => {
  const t = toolbar({ value: { width: 70, textAlign: 'center' } })
  t.edit('가로 이동 X (px)', '12.5'); t.edit('세로 이동 Y (px)', '-20'); t.edit('박스 너비 (%)', '60')
  assert.deepEqual(t.events, [])
  t.apply()
  assert.deepEqual(t.events, [['change', { offsetX: 12.5, offsetY: -20, width: 60, textAlign: 'center' }]])
})

test('empty, nonfinite, and out-of-range position inputs preserve the draft and emit nothing', () => {
  for (const value of ['', ' ', 'Infinity', 'NaN', '2001', '-2001']) {
    const t = toolbar(); t.edit('가로 이동 X (px)', value); t.apply()
    assert.deepEqual(t.events, [], `invalid position ${value} must not become zero`)
    assert.equal(t.field('가로 이동 X (px)').props.value, value)
    assert.ok(t.field('가로 이동 X (px)').props.error)
  }
})

test('manual width is bounded to 10–100 and zero offsets remain valid', () => {
  for (const value of ['', '9', '101', 'Infinity']) {
    const t = toolbar({ value: { width: 50 } }); t.edit('박스 너비 (%)', value); t.apply()
    assert.deepEqual(t.events, []); assert.ok(t.field('박스 너비 (%)').props.error)
  }
  const t = toolbar({ value: { offsetX: 5 } }); t.edit('가로 이동 X (px)', '0'); t.apply()
  assert.deepEqual(t.events, [['change', undefined]])
})

test('direction clicks immediately use valid local values and Shift moves ten pixels', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '2'); t.edit('세로 이동 Y (px)', '3')
  t.click('문구 오른쪽 이동')
  t.click('문구 왼쪽 이동', true)
  assert.deepEqual(t.events, [['change', { offsetX: 3, offsetY: 3 }], ['change', { offsetX: -7, offsetY: 3 }]])
})

test('nudge refuses invalid local input or stepping outside the allowed position range', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', ''); t.click('문구 오른쪽 이동')
  assert.deepEqual(t.events, [])
  const max = toolbar({ value: { offsetX: 2000 } }); max.click('문구 오른쪽 이동')
  assert.deepEqual(max.events, []); assert.ok(max.field('가로 이동 X (px)').props.error)
})

test('automatic width removes only width while preserving positioning and text alignment', () => {
  const t = toolbar({ value: { offsetX: 12, offsetY: -4, width: 50, textAlign: 'end' } })
  t.click('너비 자동')
  assert.deepEqual(t.events, [['change', { offsetX: 12, offsetY: -4, textAlign: 'end' }]])
})

test('text alignment changes the box contents rather than invoking reference alignment', () => {
  const t = toolbar({ value: { offsetX: 12, width: 60 } }); t.click('글자 가운데 정렬')
  assert.deepEqual(t.events, [['change', { offsetX: 12, width: 60, textAlign: 'center' }]])
})

test('reference choices exclude self and other sections and pass a single explicit axis', () => {
  const t = toolbar()
  assert.deepEqual(Array.from(t.field('기준 문구').props.options, o => o.value).filter(Boolean), ['second'])
  t.edit('기준 문구', 'second'); t.click('좌우 가운데 맞춤')
  assert.deepEqual(t.events, [['align', 'second', 'x']])
})

test('alignment cannot silently discard uncommitted numeric changes', () => {
  const t = toolbar(); t.edit('기준 문구', 'second'); t.edit('가로 이동 X (px)', '20'); t.click('좌우 가운데 맞춤')
  assert.deepEqual(t.events, []); assert.ok(t.find(n => n.props?.role === 'alert').length)
})

test('changing the selected block drops stale local values rather than applying them to another phrase', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '99')
  t.render({ selected: second, value: { offsetY: 20 } })
  assert.equal(t.field('가로 이동 X (px)').props.value, '0')
  assert.equal(t.field('세로 이동 Y (px)').props.value, '20')
  assert.deepEqual(t.events, [])
})

test('disabled gestures block commands even when handlers are directly invoked', () => {
  const t = toolbar({ disabled: true, value: { offsetX: 1 } })
  t.click('문구 오른쪽 이동'); t.click('배치만 원래대로'); t.apply(); t.click('배치 마침')
  assert.deepEqual(t.events, [])
  assert.equal(t.field('가로 이동 X (px)').props.disabled, true)
})

test('cancel clears only local numeric input and finish refuses silent draft loss', () => {
  const t = toolbar({ value: { offsetX: 1 } }); t.edit('가로 이동 X (px)', '22'); t.click('배치 마침')
  assert.deepEqual(t.events, [])
  t.click('입력 취소'); assert.deepEqual(t.events, [['cancel']])
  assert.equal(t.field('가로 이동 X (px)').props.value, '1')
  t.click('배치 마침'); assert.deepEqual(t.events, [['cancel'], ['finish']])
})

test('restoring original layout is one explicit removal, with no text or font mutations', () => {
  const t = toolbar({ value: { offsetX: 20, width: 75, textAlign: 'center' } }); t.click('배치만 원래대로')
  assert.deepEqual(t.events, [['change', undefined]])
})

test('no selected block offers selection guidance without editable geometry', () => {
  const t = toolbar({ selected: null })
  assert.equal(t.find(n => n.type === 'form').length, 0)
  assert.equal(t.find(n => n.props?.label === '가로 이동 X (px)').length, 0)
})

test('acknowledgement followed by undo must not resurrect previously applied numeric input', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '20'); t.apply()
  assert.equal(t.field('가로 이동 X (px)').props.value, '20')
  t.render({ value: undefined })
  assert.equal(t.field('가로 이동 X (px)').props.value, '0')
  assert.equal(t.button('위치·너비 적용').props.disabled, true)
})

test('switching away and back cannot resurrect a stale local draft', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '99')
  t.render({ selected: second, value: undefined }); t.render({ selected: first, value: undefined })
  assert.equal(t.field('가로 이동 X (px)').props.value, '0')
})

test('pending or rejected parent actions keep numeric input until acknowledgement', () => {
  const t = toolbar({ onChange() {} }); t.edit('가로 이동 X (px)', '25'); t.apply()
  t.render({ error: '이 위치는 적용할 수 없습니다.' })
  assert.equal(t.field('가로 이동 X (px)').props.value, '25')
  assert.ok(t.find(n => n.props?.role === 'alert').length)
})

test('nudge keyboard commands ignore composition and modifier shortcuts without stealing input cursors', () => {
  const t = toolbar()
  const group = () => t.find(n => n.props?.['aria-label'] === '문구 미세 이동')[0]
  const event = extra => ({ key: 'ArrowRight', shiftKey: false, repeat: false, altKey: false, ctrlKey: false, metaKey: false, nativeEvent: { isComposing: false }, preventDefault() {}, stopPropagation() {}, ...extra })
  group().props.onKeyDown(event({ nativeEvent: { isComposing: true } }))
  group().props.onKeyDown(event({ ctrlKey: true }))
  group().props.onKeyDown(event({ repeat: true }))
  assert.deepEqual(t.events, [])
  group().props.onKeyDown(event({ shiftKey: true })); t.render()
  assert.deepEqual(t.events, [['change', { offsetX: 10 }]])
})

test('reference selection rejects stale or fabricated identifiers', () => {
  const t = toolbar(); t.edit('기준 문구', 'other'); t.click('좌우 가운데 맞춤')
  assert.deepEqual(t.events, [])
  t.edit('기준 문구', 'second'); t.render({ blocks: [first, other] }); t.click('좌우 가운데 맞춤')
  assert.deepEqual(t.events, [])
})

test('a new block selection cannot discard pending numeric input through the chooser', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '50'); t.edit('배치할 문구', 'second')
  assert.deepEqual(t.events, [])
  assert.ok(t.find(n => n.props?.role === 'alert').length)
})

test('fresh numeric edits override an old applied-status message', () => {
  const t = toolbar({ status: '배치를 초안에 적용했습니다.' })
  t.edit('가로 이동 X (px)', '10')
  const feedback = t.find(n => n.props?.className === 'placement-toolbar__feedback')[0]
  assert.match(feedback.props.children, /아직 적용하지/)
})

test('text alignment does not silently apply unrelated pending coordinates', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '50'); t.click('글자 가운데 정렬')
  assert.deepEqual(t.events, [])
  assert.equal(t.field('가로 이동 X (px)').props.value, '50')
})

test('automatic width never commits unrelated pending coordinates', () => {
  const t = toolbar({ value: { width: 50 } }); t.edit('가로 이동 X (px)', '50'); t.click('너비 자동')
  assert.deepEqual(t.events, [])
})

test('numeric input locks global navigation synchronously before render or effects', () => {
  const t = toolbar(); t.dirtyChanges.length = 0
  t.field('가로 이동 X (px)').props.onChange({ target: { value: '14' } })
  assert.equal(t.dirtyChanges.at(-1), true)
  assert.deepEqual(t.events, [])
  t.render()
  assert.equal(t.field('가로 이동 X (px)').props.disabled, false, 'dirty state must not disable its own form')
})

test('cancel and restore original release the local-input lock synchronously', () => {
  const t = toolbar({ value: { offsetX: 3 } }); t.edit('가로 이동 X (px)', '15')
  t.button('입력 취소').props.onClick()
  assert.equal(t.dirtyChanges.at(-1), false)
  t.render(); t.edit('가로 이동 X (px)', '25')
  t.button('배치만 원래대로').props.onClick()
  assert.equal(t.dirtyChanges.at(-1), false)
})

test('pending nudge stays dirty until the parent acknowledges its resulting layout', () => {
  const t = toolbar({ onChange() {} }); t.dirtyChanges.length = 0
  t.click('문구 오른쪽 이동')
  assert.equal(t.dirtyChanges.at(-1), true)
  t.render({ status: '확인 중' })
  assert.equal(t.dirtyChanges.at(-1), true)
  t.render({ value: { offsetX: 1 } })
  assert.equal(t.dirtyChanges.at(-1), false)
})

test('invalid input retains the navigation lock until explicitly cancelled', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', ''); t.apply()
  assert.equal(t.dirtyChanges.at(-1), true)
  t.click('입력 취소')
  assert.equal(t.dirtyChanges.at(-1), false)
})

test('returning input to its baseline releases the lock without applying a document', () => {
  const t = toolbar(); t.edit('가로 이동 X (px)', '2')
  t.field('가로 이동 X (px)').props.onChange({ target: { value: '0' } })
  assert.equal(t.dirtyChanges.at(-1), false)
  assert.deepEqual(t.events, [])
})

test('unmount releases the lock using the latest dirty callback', () => {
  const firstChanges = [], latestChanges = []
  const t = toolbar({ onDirtyChange: dirty => firstChanges.push(dirty) })
  t.edit('가로 이동 X (px)', '30')
  t.render({ onDirtyChange: dirty => latestChanges.push(dirty) })
  assert.equal(latestChanges.at(-1), true)
  t.unmount()
  assert.equal(latestChanges.at(-1), false)
  assert.equal(firstChanges.at(-1), true, 'cleanup must not notify a stale callback')
})
