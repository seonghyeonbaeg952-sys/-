import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('./AdminSingleRecordSection.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText

function harness(row) {
  const slots = []
  let cursor = 0, tree
  const modules = {
    react: { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] } },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '../common/Card': { Card: 'card' }, '../common/Button': { Button: 'button' },
    '../../hooks/useCrudItem': { useCrudItem: () => ({ item: row, isLoading: false, loadError: null, isMutating: false, mutationError: null, message: null, clearMutationFeedback() {}, saveItem: async () => ({ error: null }) }) },
    '../../hooks/useUnsavedChangesGuard': { useUnsavedChangesGuard() {} },
    './AdminErrorState': { AdminErrorState: 'error' }, './AdminLoadingState': { AdminLoadingState: 'loading' },
    './AdminRecordForm': { AdminRecordForm: 'form' },
    './AdminEnglishContentForm': { AdminEnglishContentForm: 'english-form' },
  }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in modules, name); return modules[name] } })
  const render = () => { cursor = 0; tree = exports.AdminSingleRecordSection({ table: 'join_info', title: '입단 안내', fields: [], englishResource: 'join_info' }); return tree }
  const find = (predicate, node = tree) => !node || typeof node !== 'object' ? [] : [predicate(node) ? node : null, ...[node.props?.children].flat(Infinity).flatMap(child => find(predicate, child ?? null))].filter(Boolean)
  render()
  return { render, find, get englishButton() { return find(node => node.type === 'button' && String(node.props?.children).includes('English'))[0] } }
}

test('saved operation settings open their own English draft without editing Korean data', () => {
  const row = { id: '11111111-1111-4111-8111-111111111111', title: '입단 안내', is_visible: true }
  const h = harness(row)
  assert.ok(h.englishButton)
  h.englishButton.props.onClick()
  h.render()
  const english = h.find(node => node.type === 'english-form')[0]
  assert.equal(english.props.resource, 'join_info')
  assert.equal(english.props.row, row)
})

test('new unsaved Korean settings explain why an English version cannot yet be attached', () => {
  const h = harness(null)
  assert.equal(h.englishButton?.props.disabled, true)
})
