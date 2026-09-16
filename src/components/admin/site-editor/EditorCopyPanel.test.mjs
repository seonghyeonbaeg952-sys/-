import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
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
    }
    if (name === 'react/jsx-runtime') return require(name)
    const component = name.split('/').at(-1)
    if (['AdminFormField', 'AdminSelect', 'AdminTextarea', 'Button'].includes(component)) return { [component]: component }
    throw new Error(name)
  } })
  function render() {
    cursor = 0
    tree = exports.EditorCopyPanel({ definitions, document, scope: 'shared', defaults: {}, onChange(key, value) {
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
    edit(label, value) { find(n => n.props?.label === label)[0].props.onChange({ target: { value } }); render() },
    fields() { return find(n => n.props?.className === 'site-editor__field') },
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

test('a long catalogue opens a bounded set and reveals more without losing already edited values', () => {
  const p = panel(Array.from({ length: 45 }, (_, i) => definition(i)))
  assert.equal(p.fields().length, 20)
  p.edit('항목 0', '보존할 초안')
  const more = p.find(n => n.type === 'Button' && String(n.props.children).includes('더 보기'))[0]
  assert.ok(more, 'the rest of the catalogue must be reachable')
  more.props.onClick(); p.render()
  assert.equal(p.fields().length, 40)
  assert.equal(p.find(n => n.props?.label === '항목 0')[0].props.value, '보존할 초안')
  p.search('항목 44')
  assert.equal(p.fields().length, 1)
  p.search('')
  assert.equal(p.fields().length, 20)
  assert.equal(p.document.copy['test.0'], '보존할 초안')
})
