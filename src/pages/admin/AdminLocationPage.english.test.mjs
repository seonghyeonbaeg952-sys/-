import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('./AdminLocationPage.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
const row = { id: '11111111-1111-4111-8111-111111111111', address: '서울', is_visible: true }
const slots = []
let cursor = 0
const react = { useRef: initial => ({ current: initial }), useMemo: fn => fn(), useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] } }
const dependencies = {
  react, 'react/jsx-runtime': require('react/jsx-runtime'),
  '../../components/admin/AdminErrorState': { AdminErrorState: 'error' },
  '../../components/admin/AdminLoadingState': { AdminLoadingState: 'loading' },
  '../../components/admin/AdminPageTitle': { AdminPageTitle: 'title' },
  '../../components/admin/AdminSwitch': { AdminSwitch: 'switch' },
  '../../components/admin/ImageUploader': { ImageUploader: 'image-uploader' },
  '../../components/admin/AdminEnglishContentForm': { AdminEnglishContentForm: 'english-form' },
  '../../components/common/Button': { Button: 'button' },
  '../../components/common/Card': { Card: 'card' },
  '../../components/common/MapPreview': { MapPreview: 'map' },
  '../../hooks/useCrudItem': { useCrudItem: () => ({ item: row, isLoading: false, loadError: null, mutationError: null, message: null, isMutating: false }) },
  '../../hooks/useUnsavedChangesGuard': { useUnsavedChangesGuard() {} },
  '../../utils/mapLinks': { getMapActions: () => [], isLikelyEmbeddableMapUrl: () => false },
}
const exports = {}
vm.runInNewContext(code, { exports, require: name => { assert.ok(name in dependencies, name); return dependencies[name] } })
const render = () => { cursor = 0; return exports.AdminLocationPage() }
const find = (predicate, node) => !node || typeof node !== 'object' ? [] : [predicate(node) ? node : null, ...[node.props?.children].flat(Infinity).flatMap(child => find(predicate, child ?? null))].filter(Boolean)

test('saved location settings open a separate English version editor', () => {
  let tree = render()
  const button = find(node => node.type === 'button' && String(node.props?.children).includes('English'), tree)[0]
  assert.ok(button)
  button.props.onClick()
  tree = render()
  const english = find(node => node.type === 'english-form', tree)[0]
  assert.equal(english.props.resource, 'locations')
  assert.equal(english.props.row, row)
})
