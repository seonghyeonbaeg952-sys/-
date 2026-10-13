import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('./EditorToolMenu.tsx', import.meta.url), 'utf8').catch(error => {
  if (error.code === 'ENOENT') return ''
  throw error
})
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
const exports = {}
vm.runInNewContext(code, { exports, require: createRequire(import.meta.url) })

test('disabled tool disclosures refuse opening without unmounting their commands', () => {
  assert.equal(typeof exports.EditorToolMenu, 'function', 'The secondary command disclosure must exist')
  const children = { type: 'button', props: { children: 'Command' } }
  const tree = exports.EditorToolMenu({ label: 'Tools', disabled: true, children })
  let prevented = false
  tree.props.children[0].props.onClick({ preventDefault() { prevented = true } })
  assert.equal(prevented, true)
  assert.equal(tree.props.children[1].props.children, children)
})

test('Escape closes a tool disclosure and returns focus without changing a document', () => {
  assert.equal(typeof exports.EditorToolMenu, 'function')
  const tree = exports.EditorToolMenu({ label: 'Tools', disabled: false, children: 'Commands' })
  let focused = false, prevented = false
  const element = { open: true, contains() { return true }, querySelector() { return { focus() { focused = true } } } }
  tree.props.onKeyDown({ key: 'Escape', nativeEvent: { isComposing: false }, currentTarget: element,
    preventDefault() { prevented = true }, stopPropagation() {} })
  assert.equal(element.open, false)
  assert.equal(focused, true)
  assert.equal(prevented, true)
})

test('a portal dialog keeps its disclosure trigger visible for focus restoration', () => {
  const tree = exports.EditorToolMenu({ label: 'Tools', children: 'Commands' })
  const element = { open: true, contains() { return false },
    ownerDocument: { querySelector() { return { role: 'dialog' } } } }
  tree.props.onBlur({ currentTarget: element, relatedTarget: null })
  assert.equal(element.open, true, 'Making the background inert must not hide the modal trigger')
})

test('Escape in a portal dialog is left to the modal instead of the tool disclosure', () => {
  const tree = exports.EditorToolMenu({ label: 'Tools', children: 'Commands' })
  let prevented = false, focused = false
  const element = { open: true, contains() { return false },
    querySelector() { return { focus() { focused = true } } } }
  tree.props.onKeyDown({ key: 'Escape', nativeEvent: { isComposing: false }, currentTarget: element,
    target: { role: 'dialog' }, preventDefault() { prevented = true }, stopPropagation() {} })
  assert.equal(element.open, true)
  assert.equal(prevented, false)
  assert.equal(focused, false)
})

test('ordinary outside focus still closes a tool disclosure', () => {
  const tree = exports.EditorToolMenu({ label: 'Tools', children: 'Commands' })
  const element = { open: true, contains() { return false }, ownerDocument: { querySelector() { return null } } }
  tree.props.onBlur({ currentTarget: element, relatedTarget: { tagName: 'BUTTON' } })
  assert.equal(element.open, false)
})
