import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = ts.transpileModule(await readFile(new URL('./ImageUploader.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
function uploader() {
  const slots = [], effects = [], states = [], changes = [], writes = [], revoked = []
  let cursor = 0, tree, response, disabled = false
  const react = {
    useId: () => 'image-test',
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || deps.some((v, n) => v !== slots[i][n])) effects.push(callback); slots[i] = deps },
  }
  const exports = {}
  vm.runInNewContext(source, { exports, URL: { createObjectURL: file => `blob:${file.name}`, revokeObjectURL: url => revoked.push(url) }, require: name => {
    if (name === 'react') return react
    if (name === 'react/jsx-runtime') return require(name)
    if (name === '../../lib/storage') return { validateImageFile: file => file.type === 'image/png' ? { data: true, error: null } : { data: null, error: '형식을 확인해 주세요.' }, uploadImage: async options => { writes.push(options); if (response instanceof Error) throw response; return await response } }
    if (name === '../../utils/classNames') return { classNames: (...values) => values.filter(Boolean).join(' ') }
    if (name === '../common/Button') return { Button: 'Button' }
    if (name === '../common/OptimizedImage') return { OptimizedImage: 'OptimizedImage' }
    throw new Error(name)
  } })
  function render() { cursor = 0; tree = exports.ImageUploader({ folder: 'locations', value: 'https://old.invalid/photo.jpg', onChange: value => changes.push(value), onUploadStateChange: state => states.push(state), disabled }); effects.splice(0).forEach(fn => fn()); return tree }
  function find(predicate, node = tree) { if (!node || typeof node !== 'object') return []; return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child))].filter(Boolean) }
  render()
  return { states, changes, writes, revoked, render, find, response: next => { response = next },
    select(file) { find(node => node.props?.type === 'file')[0].props.onChange({ target: { files: [file], value: 'file' } }); render() },
    upload() { return find(node => node.type === 'Button' && ['선택한 이미지 업로드', '업로드 중'].includes(node.props.children))[0].props.onClick() },
    cancel() { const button = find(node => node.type === 'Button' && node.props.children === '선택 취소')[0]; assert.ok(button, 'selection cancellation must be available'); button.props.onClick(); render() },
    setDisabled(value) { disabled = value; render() },
  }
}
const image = { name: 'fixture.png', type: 'image/png', size: 512 }

test('selection is reported before upload and can be cancelled without changing the saved URL', () => {
  const u = uploader(); u.select(image)
  assert.equal(u.states.at(-1), 'selected'); assert.deepEqual(u.changes, [])
  u.cancel(); assert.equal(u.states.at(-1), 'idle'); assert.deepEqual(u.changes, [])
  assert.deepEqual(u.revoked, ['blob:fixture.png'])
})

test('upload reports progress, blocks immediate duplicate requests and publishes only the completed URL', async () => {
  const u = uploader(); u.select(image)
  let complete; u.response(new Promise(resolve => { complete = resolve }))
  const first = u.upload(), duplicate = u.upload()
  assert.equal(u.writes.length, 1); assert.equal(u.states.at(-1), 'uploading')
  complete({ data: { publicUrl: 'https://new.invalid/photo.png' }, error: null })
  await Promise.all([first, duplicate]); u.render()
  assert.deepEqual(u.changes, ['https://new.invalid/photo.png']); assert.equal(u.states.at(-1), 'uploaded')
})

test('thrown upload failure is visible, blocks saving and allows cancellation or retry', async () => {
  const u = uploader(); u.select(image); u.response(new Error('private service detail'))
  await u.upload(); u.render()
  assert.equal(u.states.at(-1), 'error'); assert.deepEqual(u.changes, [])
  assert.ok(u.find(node => node.props?.role === 'alert').length)
  u.response({ data: { publicUrl: 'https://new.invalid/photo.png' }, error: null })
  await u.upload(); u.render(); assert.equal(u.states.at(-1), 'uploaded')
})

test('invalid replacement file blocks the parent until selection is explicitly cancelled', () => {
  const u = uploader(); u.select({ ...image, type: 'text/plain' })
  assert.equal(u.states.at(-1), 'error'); assert.deepEqual(u.changes, [])
  u.cancel(); assert.equal(u.states.at(-1), 'idle')
})
