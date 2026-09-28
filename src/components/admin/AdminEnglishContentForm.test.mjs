import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'
const require = createRequire(import.meta.url)
async function compile(file) { return ts.transpileModule(await readFile(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText }
const youtube = {}; vm.runInThisContext(`(function(exports) { ${await compile('../../utils/youtube.ts')}\n})`)(youtube)
const model = {}; vm.runInThisContext(`(function(exports, require) { ${await compile('../../features/sample-language/sampleContentModel.ts')}\n})`)(model, () => youtube)
const code = await compile('./AdminEnglishContentForm.tsx')
const id = '11111111-1111-4111-8111-111111111111'
function harness(savedRecord = null) {
  const slots = [], effects = [], writes = [], publication = [], guards = []
  let cursor = 0, tree, closed = 0
  const base = { resource: 'notices', record_id: id, draft: {}, published: null, version: 0, updated_at: '', published_at: null }
  let saveResult = async (_resource, _id, draft, version) => ({ data: { ...base, draft, version: version + 1 }, error: null })
  const react = { useMemo: fn => fn(), useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } }, useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] }, useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((value, index) => value !== slots[i][index])) { slots[i] = deps; effects.push(fn) } } }
  const dependencies = { react, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../../hooks/useUnsavedChangesGuard': { useUnsavedChangesGuard: options => guards.push(options) },
    '../../features/sample-language/sampleContentModel': model,
    '../../features/sample-language/sampleContentApi': { loadEnglishContent: async () => ({ data: savedRecord ?? base, error: null }), saveEnglishContentDraft: async (...args) => { writes.push(args); return saveResult(...args) }, publishEnglishContent: async (...args) => { publication.push(args); return { data: { ...base, draft: { title: 'English' }, published: { title: 'English' }, published_at: '2026-09-28T00:00:00Z', version: args[2] + 1 }, error: null } } },
    '../../features/sample-language/sampleContentGuidance': { getEnglishInputProgress: (...args) => ({ completed: args[2]?.title ? 1 : 0, total: 2, missingLabels: args[2]?.title ? ['내용'] : ['제목', '내용'] }), getEnglishChanges: (_resource, draft, published) => draft.title === published?.title ? [] : [{ name: 'title', label: '제목', kind: 'changed', before: published?.title ?? '', after: draft.title ?? '', isMedia: false }], getEnglishTextStats: value => ({ characters: value.length, words: value.trim() ? value.trim().split(/\s+/).length : 0, aboveRecommendation: false }), recommendedEnglishCharacters: () => 80 },
    '../common/Button': { Button: 'button' }, '../common/OptimizedImage': { OptimizedImage: 'image' }, './AdminModal': { AdminModal: 'modal' }, './AdminRecordForm': { AdminRecordForm: 'record-form' },
  }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in dependencies, name); return dependencies[name] }, window: { confirm: () => false } })
  const props = { resource: 'notices', row: { id, title: '한국어 원문', content: '원본 본문', is_visible: true }, onClose: () => closed++ }
  const render = () => { cursor = 0; tree = exports.AdminEnglishContentForm(props); effects.splice(0).forEach(fn => fn()); return tree }
  const find = (predicate, node = tree) => { if (!node || typeof node !== 'object') return []; return [predicate(node) ? node : null, ...[node.props?.children, node.props?.footer].flat(Infinity).flatMap(child => find(predicate, child ?? null))].filter(Boolean) }
  const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join('') : node && typeof node === 'object' ? text(node.props?.children) : ''
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); render() }
  const form = () => find(node => node.type === 'record-form')[0]
  const publish = () => find(node => node.type === 'button' && text(node) === '영어 버전 게시')[0]
  render()
  return { render, settle, form, publish, text, writes, publication, guards, get closed() { return closed }, get tree() { return tree }, setSave(fn) { saveResult = fn } }
}

test('English manager loads an independent draft; save does not publish or alter source metadata', async () => {
  const h = harness(); await h.settle()
  assert.deepEqual(h.form().props.fields.map(field => field.name), ['title', 'content', 'cover_image_url'])
  assert.equal(h.publish().props.disabled, true)
  assert.equal(await h.form().props.onSubmit({ title: 'English', content: 'Text', cover_image_url: '' }), true)
  h.render()
  assert.equal(h.writes.length, 1); assert.deepEqual(JSON.parse(JSON.stringify(h.writes[0])), ['notices', id, { title: 'English', content: 'Text' }, 0])
  assert.equal(h.publication.length, 0); assert.equal(h.publish().props.disabled, false)
  assert.equal(h.form().props.initialData.title, 'English')
})
test('editing and image-pending dirty state block publication until the draft is saved', async () => {
  const h = harness(); await h.settle(); await h.form().props.onSubmit({ title: 'English' }); h.render()
  h.form().props.onDirtyChange(true); h.render()
  assert.equal(h.publish().props.disabled, true)
  await h.publish().props.onClick(); assert.equal(h.publication.length, 0)
  assert.equal(h.guards.at(-1).enabled, true)
  h.tree.props.onClose(); assert.equal(h.closed, 0)
})
test('failed or conflicting saves keep the mounted form and dirty inputs', async () => {
  const h = harness(); await h.settle(); h.form().props.onDirtyChange(true); h.render()
  const key = h.form().key
  h.setSave(async () => ({ data: null, error: '다른 관리자가 변경했습니다.' }))
  assert.equal(await h.form().props.onSubmit({ title: 'Keep unsaved input' }), false); h.render()
  assert.equal(h.form().key, key); assert.equal(h.publish().props.disabled, true); assert.equal(h.publication.length, 0)
  assert.equal(h.form().props.initialData.title, undefined)
})
test('rapid repeated saves cannot duplicate a write, and explicit publication uses the saved version', async () => {
  const h = harness(); await h.settle()
  let resolve
  h.setSave(() => new Promise(done => { resolve = done }))
  const pending = h.form().props.onSubmit({ title: 'English' })
  assert.equal(await h.form().props.onSubmit({ title: 'Second click' }), false); assert.equal(h.writes.length, 1)
  resolve({ data: { resource: 'notices', record_id: id, draft: { title: 'English' }, published: null, version: 1, updated_at: '', published_at: null }, error: null })
  await pending; h.render(); await h.publish().props.onClick(); await h.settle()
  assert.deepEqual(JSON.parse(JSON.stringify(h.publication)), [['notices', id, 1]])
  assert.equal(h.publish().props.disabled, true)
})

test('saved English draft shows progress and the exact pending publication field before publication', async () => {
  const h = harness({ resource: 'notices', record_id: id, draft: { title: 'New title' }, published: { title: 'Old title' }, version: 2, updated_at: '2026-09-28T00:00:00Z', published_at: '2026-09-27T00:00:00Z' })
  await h.settle()
  const screen = h.text(h.tree)
  assert.match(screen, /저장된 영어 문구 1\/2/)
  assert.match(screen, /게시 전 변경사항/)
  assert.match(screen, /Old title/)
  assert.match(screen, /New title/)
  assert.equal(typeof h.form().props.fields.find(field => field.name === 'title').getTextFeedback, 'function')
})
