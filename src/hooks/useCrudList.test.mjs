import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const sources = Object.fromEntries(await Promise.all(['useCrudItem', 'useCrudList'].map(async name => [name, ts.transpileModule(await readFile(new URL(`./${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText])))
function harness(name) {
  const slots = [], effects = [], calls = [], reads = []
  let options = { table: 'contacts' }
  let cursor = 0, state, response, loadResponse = { data: [{ id: 'fixture', title: '기존' }], error: null }
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next }] },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useMemo(callback) { return callback() }, useCallback: callback => callback,
    useEffect(callback, deps) { const i = cursor++; if (!slots[i] || deps.some((v, n) => v !== slots[i][n])) effects.push(callback); slots[i] = deps },
  }
  const mutate = async (...args) => { calls.push(args); if (response instanceof Error) throw response; return await response }
  const exports = {}
  vm.runInNewContext(sources[name], { exports, require: specifier => {
    if (specifier === 'react') return react
    if (specifier === '../lib/cms') return { listRows: async args => { reads.push(args); if (loadResponse instanceof Error) throw loadResponse; return loadResponse }, createRow: mutate, updateRow: mutate, deleteRow: mutate, upsertSingleRow: mutate }
    if (specifier === './usePublicData') return { invalidatePublicDataCache() {} }
    return require(specifier)
  } })
  const render = () => { cursor = 0; state = exports[name](name === 'useCrudItem' ? 'locations' : options); effects.splice(0).forEach(effect => effect()); return state }
  return { calls, reads, render, setOptions: next => { options = next }, setResponse: next => { response = next }, setLoadResponse: next => { loadResponse = next }, async ready() { render(); await new Promise(resolve => setImmediate(resolve)); return render() } }
}

for (const name of ['useCrudItem', 'useCrudList']) {
  test(`${name} rejects a same-tick second mutation and releases its lock after completion`, async () => {
    const h = harness(name); const state = await h.ready()
    let complete; h.setResponse(new Promise(resolve => { complete = resolve }))
    const mutate = name === 'useCrudItem' ? state.saveItem : state.createItem
    const first = mutate({ title: '저장' }); const duplicate = mutate({ title: '중복' })
    assert.equal(h.calls.length, 1)
    assert.ok((await duplicate).error)
    assert.equal(h.render().isMutating, true)
    complete({ data: { id: 'fixture', title: '저장' }, error: null }); await first
    assert.equal(h.render().isMutating, false)
    h.setResponse({ data: { id: 'fixture', title: '재시도' }, error: null })
    assert.equal((await mutate({ title: '재시도' })).error, null)
    assert.equal(h.calls.length, 2)
  })
  test(`${name} catches thrown writes and preserves data separately from loading failures`, async () => {
    const h = harness(name); const state = await h.ready()
    h.setResponse(new Error('private transport detail'))
    const result = await (name === 'useCrudItem' ? state.saveItem({ title: '실패' }) : state.updateItem('fixture', { title: '실패' }))
    assert.ok(result.error); assert.doesNotMatch(result.error, /private/)
    const current = h.render()
    assert.equal(current.isMutating, false)
    assert.equal(current.loadError, null)
    assert.ok(current.mutationError)
    assert.equal(name === 'useCrudItem' ? current.item.title : current.rows[0].title, '기존')
  })
  test(`${name} handles thrown initial reads with a retryable loading error`, async () => {
    const h = harness(name); h.setLoadResponse(new Error('read failed'))
    const state = await h.ready()
    assert.equal(state.isLoading, false); assert.ok(state.loadError)
    h.setLoadResponse({ data: [{ id: 'fixture', title: '복구' }], error: null })
    state.reload(); const current = await h.ready()
    assert.equal(current.loadError, null)
  })
}

test('list mutation locking covers create, update and delete together', async () => {
  const h = harness('useCrudList'), state = await h.ready()
  let complete; h.setResponse(new Promise(resolve => { complete = resolve }))
  const deleting = state.deleteItem('fixture')
  const updating = state.updateItem('fixture', { title: 'race' })
  assert.equal(h.calls.length, 1)
  assert.ok((await updating).error)
  complete({ data: true, error: null }); await deleting
})

test('single record save updates the returned row without unmounting the form for another read', async () => {
  const h = harness('useCrudItem'), state = await h.ready()
  h.setResponse({ data: { id: 'fixture', title: '저장' }, error: null })
  await state.saveItem({ title: '저장' })
  assert.equal(h.render().isLoading, false)
  assert.equal(h.render().item.title, '저장')
})

test('CMS page navigation probes one next row, resets on a changed filter and backs up after deleting the last row', async () => {
  const h = harness('useCrudList')
  h.setOptions({ table: 'contacts', pageSize: 2 })
  h.setLoadResponse({ data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], error: null })
  let state = await h.ready()
  assert.equal(state.rows.length, 2)
  assert.equal(state.hasNextPage, true)
  assert.equal(state.pageIndex, 0)
  state.nextPage()
  h.setLoadResponse({ data: [{ id: 'c' }], error: null })
  state = await h.ready()
  assert.equal(state.pageIndex, 1)
  assert.equal(state.hasNextPage, false)
  assert.deepEqual(JSON.parse(JSON.stringify(h.reads.at(-1).range)), { offset: 2, limit: 3 })
  h.setLoadResponse({ data: [], error: null })
  state.reload()
  await h.ready()
  state = await h.ready()
  assert.equal(state.pageIndex, 0)
  h.setLoadResponse({ data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }], error: null })
  state.reload(); state = await h.ready(); state.nextPage(); await h.ready()
  h.setOptions({ table: 'contacts', pageSize: 2, filters: [{ column: 'status', value: 'done' }] })
  state = await h.ready()
  assert.equal(state.pageIndex, 0)
  assert.equal(h.reads.at(-1).range.offset, 0)
})
