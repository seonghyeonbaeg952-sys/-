import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
async function compile(path) { return ts.transpileModule(await readFile(new URL(path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText }
const model = {}
vm.runInNewContext(await compile('./sampleDateModel.ts'), { exports: model })
const code = await compile('./SampleDateInput.tsx')

function harness(initialValue) {
  const slots = [], changes = []
  let cursor = 0
  const react = { useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] } }
  const modules = { react, 'react/jsx-runtime': require('react/jsx-runtime'), './useSampleLanguage': { useSampleLanguage: () => ({ enabled: true, language: 'en' }) }, '../../components/site-editor/useSiteEditor': { useSiteEditor: () => ({ copy: (_page, _key, fallback) => fallback }) }, './sampleDateModel': model }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in modules, name); return modules[name] } })
  let value = initialValue, tree
  const render = () => { cursor = 0; const wrapper = exports.SampleDateInput({ id: 'pledge-date', label: 'Pledge date', value, onChange(next) { value = next; changes.push(next) } }); tree = wrapper.type(wrapper.props); return tree }
  const find = (predicate, node = tree) => !node || typeof node !== 'object' ? [] : [predicate(node) ? node : null, ...[node.props?.children].flat(Infinity).flatMap(child => find(predicate, child ?? null))].filter(Boolean)
  render()
  return { render, find, changes, get value() { return value }, get clear() { return find(node => node.type === 'button' && node.props?.type === 'button')[0] } }
}

test('English date control clears a completed date in one action', () => {
  const h = harness('2026-09-28')
  assert.ok(h.clear, 'a completed date needs an explicit clear action')
  h.clear.props.onClick()
  h.render()
  assert.equal(h.value, '')
  assert.equal(h.changes.at(-1), '')
  assert.equal(h.find(node => node.type === 'select')[0].props.value, '')
})

test('English date control clears partially selected month without leaving required empty parts', () => {
  const h = harness('')
  h.find(node => node.type === 'select')[0].props.onChange({ target: { value: '2' } })
  h.render()
  assert.ok(h.clear, 'a partial date must also be clearable')
  h.clear.props.onClick()
  h.render()
  assert.equal(h.find(node => node.type === 'select')[0].props.value, '')
  assert.equal(h.find(node => node.type === 'select')[0].props.required, false)
})
