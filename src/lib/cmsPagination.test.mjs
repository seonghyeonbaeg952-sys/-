import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('./cms.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function harness(responses = [{ data: [{ id: 'row' }], error: null }]) {
  const calls = [], exports = {}
  const client = { from(table) {
    calls.push(['from', table])
    const query = { then(resolve) { return Promise.resolve(responses.shift()).then(resolve) } }
    for (const method of ['select', 'eq', 'ilike', 'order', 'range']) query[method] = (...args) => { calls.push([method, ...args]); return query }
    return query
  } }
  vm.runInNewContext(code, { exports, require: name => { assert.equal(name, './auth'); return { getSupabaseClientSafe: () => ({ data: client, error: null }) } } })
  return { ...exports, calls }
}
test('paginated CMS reads issue a bounded inclusive range with a stable ID tie-breaker and literal search', async () => {
  const h = harness()
  const result = await h.listRows({ table: 'contacts', order: { column: 'created_at', ascending: false }, search: { column: 'name', value: '  100%_홍  ' }, range: { offset: 25, limit: 26 } })
  assert.equal(result.error, null)
  assert.deepEqual(h.calls.filter(call => call[0] === 'range'), [['range', 25, 50]])
  assert.deepEqual(JSON.parse(JSON.stringify(h.calls.filter(call => call[0] === 'order'))), [['order', 'created_at', { ascending: false }], ['order', 'id', { ascending: true }]])
  assert.deepEqual(h.calls.find(call => call[0] === 'ilike'), ['ilike', 'name', '%100\\%\\_홍%'])
})
test('invalid pagination is rejected before any database request', async () => {
  for (const range of [{ offset: -1, limit: 26 }, { offset: 0, limit: 10000 }, { offset: 1.5, limit: 26 }, { offset: 0, limit: 0 }, { offset: Number.MAX_SAFE_INTEGER, limit: 2 }]) {
    const h = harness()
    assert.ok((await h.listRows({ table: 'contacts', range })).error)
    assert.equal(h.calls.length, 0)
  }
})
test('legacy member-status fallback retains its range and deterministic ordering', async () => {
  const h = harness([{ data: null, error: { message: 'member_status schema cache' } }, { data: [{ id: 'legacy' }], error: null }])
  assert.equal((await h.listRows({ table: 'members', filters: [{ column: 'member_status', value: 'alumni' }], range: { offset: 50, limit: 26 } })).error, null)
  assert.deepEqual(h.calls.filter(call => call[0] === 'range'), [['range', 50, 75], ['range', 50, 75]])
})
