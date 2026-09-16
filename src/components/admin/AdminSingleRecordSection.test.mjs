import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const sources = await Promise.all([
  '../../hooks/useCrudItem.ts',
  './AdminSingleRecordSection.tsx',
].map(async file => ts.transpileModule(await readFile(new URL(file, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText))

function createSection() {
  const slots = []
  const effects = []
  let cursor = 0
  let dirty = false
  let row = { id: 'join-info', title: '입단 안내' }
  let nextError = null
  const writes = []
  const react = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], value => {
        slots[index] = typeof value === 'function' ? value(slots[index]) : value
        dirty = true
      }]
    },
    useCallback: callback => callback,
    useEffect(callback, deps) {
      const index = cursor++
      if (!slots[index] || deps.some((value, i) => value !== slots[index][i])) effects.push(callback)
      slots[index] = deps
    },
  }
  const imports = {
    react,
    'react/jsx-runtime': require('react/jsx-runtime'),
    '../lib/cms': {
      listRows: async () => ({ data: [row], error: null }),
      upsertSingleRow: async (_table, payload) => {
        writes.push(payload)
        if (nextError) return { data: null, error: nextError }
        row = { ...row, ...payload }
        return { data: row, error: null }
      },
    },
    './usePublicData': { invalidatePublicDataCache() {} },
    '../../hooks/useUnsavedChangesGuard': { useUnsavedChangesGuard() {} },
  }
  for (const name of ['Card', 'AdminErrorState', 'AdminLoadingState', 'AdminRecordForm']) {
    imports[name === 'Card' ? '../common/Card' : `./${name}`] = { [name]: name }
  }
  function load(source) {
    const exports = {}
    vm.runInNewContext(source, { exports, require: name => {
      assert.ok(name in imports, `unexpected dependency: ${name}`)
      return imports[name]
    } })
    return exports
  }
  imports['../../hooks/useCrudItem'] = load(sources[0])
  const { AdminSingleRecordSection } = load(sources[1])
  let tree
  async function render() {
    do {
      dirty = false
      cursor = 0
      tree = AdminSingleRecordSection({
        table: 'join_info', title: '입단 안내', fields: [],
        validatePayload: payload => payload.title ? null : '제목을 입력해 주세요.',
      })
      effects.splice(0).forEach(effect => effect())
      await setImmediate()
    } while (dirty)
  }
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return []
    return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity)
      .flatMap(child => find(predicate, child))].filter(Boolean)
  }
  return {
    render, writes,
    failNextSave: error => { nextError = error },
    messages: role => find(node => node.props?.role === role).map(node => node.props.children),
    async submit(payload) {
      const form = find(node => node.type === 'AdminRecordForm')[0]
      assert.ok(form, 'editable form must be mounted')
      const saved = await form.props.onSubmit(payload)
      await render()
      return saved
    },
  }
}

test('a rejected save removes the previous success without calling persistence', async () => {
  const section = createSection()
  await section.render()
  assert.equal(await section.submit({ title: '입단 안내' }), true)
  assert.deepEqual(section.messages('status'), ['저장되었습니다.'])
  assert.equal(await section.submit({ title: '' }), false)
  assert.deepEqual(section.messages('status'), [])
  assert.deepEqual(section.messages('alert'), ['제목을 입력해 주세요.'])
  assert.equal(section.writes.length, 1)
})

test('a new invalid attempt clears old server errors and a valid retry clears validation', async () => {
  const section = createSection()
  await section.render()
  section.failNextSave('저장에 실패했습니다.')
  assert.equal(await section.submit({ title: '입단 안내' }), false)
  assert.deepEqual(section.messages('alert'), ['저장에 실패했습니다.'])
  await section.submit({ title: '' })
  assert.deepEqual(section.messages('alert'), ['제목을 입력해 주세요.'])
  assert.equal(section.writes.length, 1)
  section.failNextSave(null)
  assert.equal(await section.submit({ title: '입단 안내' }), true)
  assert.deepEqual(section.messages('alert'), [])
  assert.deepEqual(section.messages('status'), ['저장되었습니다.'])
})
