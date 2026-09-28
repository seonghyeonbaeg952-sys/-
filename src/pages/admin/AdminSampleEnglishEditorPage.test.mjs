import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const code = ts.transpileModule(await readFile(new URL('./AdminSampleEnglishEditorPage.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
function fixture(responses) {
  const slots = [], effects = []
  let cursor = 0, tree, requests = 0
  const resources = { definitions: [{ page: 'common', key: 'sample.content.example', section: '공개 콘텐츠', label: '새 원문', defaultValue: '새 원문' }], defaults: { 'sample.content.example': '새 원문' },
    deviceDefaults: { mobile: { 'notices.title': 'Mobile news' }, tablet: { 'notices.title': 'Tablet news' }, desktop: { 'notices.title': 'Desktop news' } } }
  const previewPathFor = path => `/sample${path}?lang=en`
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] },
    useCallback(fn, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) slots[i] = { fn, deps }; return slots[i].fn },
    useEffect(fn, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, index) => value !== previous.deps[index])) effects.push(() => { previous?.cleanup?.(); slots[i] = { deps, cleanup: fn() } }) },
  }
  const dependencies = {
    react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'), 'react-router': { useSearchParams: () => [new URLSearchParams('page=notices&device=mobile')] },
    '../../components/admin/AdminPageTitle': { AdminPageTitle: 'AdminPageTitle' }, '../../components/common/Button': { Button: 'Button' },
    './AdminSiteEditorPage': { AdminSiteEditorPage: 'AdminSiteEditorPage' },
    '../../features/sample-language/sampleEnglishEditor': { sampleEnglishPreviewPath: previewPathFor,
      async loadSampleEnglishResources() { const index = requests++; const response = responses?.[index]; if (response instanceof Error) throw response; return response ?? resources },
    },
  }
  const exports = {}
  vm.runInThisContext(`(function(exports, require) { ${code}\n})`)(exports, name => { assert.ok(dependencies[name], name); return dependencies[name] })
  const render = () => { cursor = 0; tree = exports.AdminSampleEnglishEditorPage(); effects.splice(0).forEach(effect => effect()) }
  const find = (predicate, node = tree) => !node || typeof node !== 'object' ? [] : [
    ...(predicate(node) ? [node] : []), ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child)),
  ]
  render()
  return { render, find, resources, previewPathFor, get tree() { return tree }, get requests() { return requests },
    async settle() { await new Promise(resolve => setImmediate(resolve)); render() },
    dispose() { slots.forEach(slot => slot?.cleanup?.()) },
  }
}

test('English wrapper loads public resources once and keeps a stable defaults loader across rerenders', async t => {
  const p = fixture(); t.after(p.dispose)
  assert.equal(p.find(node => node.props?.role === 'status').length, 1)
  await p.settle()
  assert.equal(p.requests, 1)
  assert.equal(p.tree.type, 'AdminSiteEditorPage')
  assert.equal(p.tree.props.storageScope, 'sample-english')
  assert.equal(p.tree.props.copyDefinitions, p.resources.definitions)
  assert.equal(p.tree.props.defaultsByDevice, p.resources.deviceDefaults)
  assert.equal(p.tree.props.previewPathFor, p.previewPathFor)
  const loader = p.tree.props.loadDefaults
  assert.equal(await loader(), p.resources.defaults)
  p.render(); await p.settle()
  assert.equal(p.tree.props.loadDefaults, loader)
  assert.equal(p.requests, 1)
})

test('failed English resource loads expose a retry and never fall back to original editing', async t => {
  const p = fixture([new Error('PRIVATE transport detail')]); t.after(p.dispose)
  await p.settle()
  assert.equal(p.find(node => node.type === 'AdminSiteEditorPage').length, 0)
  assert.equal(p.find(node => node.props?.role === 'alert').length, 1)
  assert.doesNotMatch(JSON.stringify(p.tree), /PRIVATE/)
  const back = p.find(node => node.type === 'Button' && node.props.href)[0]
  assert.equal(back.props.href, '/admin/editor?page=notices&device=mobile')
  const retry = p.find(node => node.type === 'Button' && node.props.children === '영문 편집 문구 다시 불러오기')[0]
  retry.props.onClick(); p.render()
  assert.equal(p.find(node => node.props?.role === 'status').length, 1)
  await p.settle()
  assert.equal(p.requests, 2)
  assert.equal(p.tree.type, 'AdminSiteEditorPage')
  assert.equal(p.tree.props.storageScope, 'sample-english')
})
