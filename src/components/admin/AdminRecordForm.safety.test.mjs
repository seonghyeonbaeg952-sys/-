import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const paths = { form: './AdminRecordForm.tsx', location: '../../pages/admin/AdminLocationPage.tsx', about: '../../pages/admin/AdminAboutPage.tsx' }
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([key, file]) => [key, ts.transpileModule(await readFile(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText])))
function harness(sourceKey, exportName, initialProps = {}, options = {}) {
  const slots = [], effects = [], dirty = [], guards = []
  let cursor = 0, tree, component, props = initialProps
  const react = {
    createElement: require('react').createElement,
    useId: () => 'test-form',
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useMemo(fn) { return fn() }, useCallback: fn => fn,
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((v, n) => v !== slots[i][n])) effects.push(fn); slots[i] = deps },
  }
  const exports = {}
  vm.runInNewContext(sources[sourceKey], { exports, window: { requestAnimationFrame: fn => fn() }, document: { getElementById: () => null }, require: name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name.endsWith('/cms')) return { cleanPayload: payload => payload }
    if (name.endsWith('/useCrudItem')) return { useCrudItem: () => options.crud }
    if (name.endsWith('/useUnsavedChangesGuard')) return { useUnsavedChangesGuard: value => guards.push(value) }
    if (name.endsWith('/mapLinks')) return { getMapActions: () => ({ status: 'buttons' }), isLikelyEmbeddableMapUrl: () => false }
    const exported = name.slice(name.lastIndexOf('/') + 1)
    return { [exported]: exported }
  } })
  component = exports[exportName]
  function render(nextProps) { if (nextProps) props = nextProps; cursor = 0; tree = component({ onDirtyChange: value => dirty.push(value), ...props }); effects.splice(0).forEach(fn => fn()); return tree }
  function find(predicate, node = tree) { if (!node || typeof node !== 'object') return []; return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child))].filter(Boolean) }
  render()
  return { render, find, dirty, guards, child(node) { component = node.type; props = node.props; slots.length = 0; effects.length = 0; return render() },
    submit() { return find(node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }) },
    change(name, value) { find(node => node.props?.name === name || node.props?.value === name)[0].props.onChange({ target: { value } }); render() },
  }
}
const fields = [{ name: 'title', label: '제목', type: 'text' }, { name: 'image_url', label: '이미지', type: 'image' }]

test('a first keystroke or file selection notifies navigation protection before passive effects run', () => {
  const h = harness('form', 'AdminRecordForm', { fields, initialData: { title: '원문' }, onSubmit: async () => true })
  h.find(node => node.props?.name === 'title')[0].props.onChange({ target: { value: '빠른 수정' } })
  assert.equal(h.dirty.at(-1), true, 'A back action immediately after the edit must not discard it')
  h.render()
  h.find(node => node.props?.name === 'title')[0].props.onChange({ target: { value: '원문' } })
  assert.equal(h.dirty.at(-1), false)
  h.find(node => node.type === 'ImageUploader')[0].props.onUploadStateChange('selected')
  assert.equal(h.dirty.at(-1), true)
})

test('record form locks submits immediately and catches failure without losing input', async () => {
  let complete; const writes = []
  const h = harness('form', 'AdminRecordForm', { fields, initialData: { title: '원문' }, onSubmit: payload => { writes.push(payload); return new Promise(resolve => { complete = resolve }) } })
  const first = h.submit(), duplicate = h.submit()
  assert.equal(writes.length, 1)
  await duplicate; complete(false); await first; h.render()
  assert.equal(h.find(node => node.props?.name === 'title')[0].props.value, '원문')
  h.render({ fields, initialData: { title: '원문' }, onSubmit: async () => { throw new Error('private') } })
  await h.submit(); h.render(); assert.ok(h.find(node => node.props?.role === 'alert').length)
  assert.equal(h.find(node => node.type === 'form')[0].props['aria-busy'], false)
})

test('pending or failed images synchronously block saving an older URL until cancelled or uploaded', async () => {
  const writes = []
  const h = harness('form', 'AdminRecordForm', { fields, initialData: { title: '원문', image_url: 'old-url' }, onSubmit: async payload => { writes.push(payload); return true } })
  for (const state of ['selected', 'uploading', 'error']) {
    const image = h.find(node => node.type === 'ImageUploader')[0]
    assert.equal(typeof image.props.onUploadStateChange, 'function')
    image.props.onUploadStateChange(state)
    await h.submit(); h.render(); assert.equal(writes.length, 0)
    assert.equal(h.dirty.at(-1), true)
  }
  h.find(node => node.type === 'ImageUploader')[0].props.onUploadStateChange('idle'); h.render()
  await h.submit(); assert.equal(writes[0].image_url, 'old-url')
  const image = h.find(node => node.type === 'ImageUploader')[0]
  image.props.onChange('new-url'); image.props.onUploadStateChange('uploaded'); h.render()
  await h.submit(); assert.equal(writes[1].image_url, 'new-url')
})

test('saving captures a snapshot while later edits remain dirty', async () => {
  let complete
  const h = harness('form', 'AdminRecordForm', { fields, initialData: { title: '원문' }, onSubmit: () => new Promise(resolve => { complete = resolve }) })
  h.change('title', '제출 문구'); const saving = h.submit()
  h.change('title', '나중 입력'); complete(true); await saving; h.render()
  assert.equal(h.find(node => node.props?.name === 'title')[0].props.value, '나중 입력')
  assert.equal(h.dirty.at(-1), true)
})

test('location mutation errors keep the editable form mounted', () => {
  const h = harness('location', 'AdminLocationPage', {}, { crud: { item: { id: 'fixture', address: '주소' }, isLoading: false, isMutating: false, loadError: null, mutationError: '저장 실패', error: '저장 실패', saveItem: async () => ({ data: null, error: '저장 실패' }), reload() {} } })
  assert.equal(h.find(node => typeof node.type === 'function' && node.type.name === 'LocationForm').length, 1)
  assert.equal(h.find(node => node.type === 'AdminErrorState').length, 0)
  assert.ok(h.find(node => node.props?.role === 'alert').length)
})

test('location schema failures preserve all requested fields without an automatic partial save', async () => {
  const writes = []
  const h = harness('location', 'AdminLocationPage', {}, { crud: { item: { id: 'fixture', address: '주소', image_url: 'original-photo' }, isLoading: false, isMutating: false, loadError: null, mutationError: null, error: null,
    saveItem: async payload => { writes.push(payload); return { data: null, error: 'schema cache image_url column missing' } }, reload() {} } })
  h.child(h.find(node => typeof node.type === 'function' && node.type.name === 'LocationForm')[0])
  await h.submit(); h.render()
  assert.equal(writes.length, 1)
  assert.equal(writes[0].image_url, 'original-photo')
})

test('about sections use the known registry while preserving an existing legacy key', () => {
  const h = harness('about', 'AdminAboutPage')
  const page = h.find(node => node.type === 'AdminCrudListPage')[0].props
  const field = page.fields.find(field => field.name === 'section_key')
  assert.equal(field.type, 'select')
  assert.ok(field.options.some(option => option.value === 'spirit_hero' && option.label !== option.value))
  assert.ok(page.validatePayload({ section_key: 'invented' }, null))
  assert.equal(page.validatePayload({ section_key: 'legacy' }, { section_key: 'legacy' }), null)
})
