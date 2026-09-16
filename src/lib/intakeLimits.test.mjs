import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

let source = ''
try { source = await readFile(new URL('./intakeLimits.ts', import.meta.url), 'utf8') } catch (e) { if (e.code !== 'ENOENT') throw e }
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function fixture(response) {
  const calls = [], exports = {}
  const query = { then: resolve => Promise.resolve(response).then(resolve) }
  for (const method of ['from', 'select', 'update', 'eq', 'maybeSingle', 'order']) query[method] = (...args) => { calls.push([method, ...args]); return query }
  vm.runInNewContext(code, { exports, require: name => { assert.equal(name, './auth'); return { getSupabaseClientSafe: () => ({ data: query, error: null }) } } })
  return { api: exports, calls }
}
const current = { kind: 'join', hourly_total: 100, hourly_contact: 5 }
test('quota updates use the observed values as an atomic compare-and-set and write only allowed numbers', async () => {
  const f = fixture({ data: { ...current, hourly_total: 200 }, error: null })
  assert.equal(typeof f.api.saveIntakeLimit, 'function')
  const result = await f.api.saveIntakeLimit(current, { hourly_total: 200, hourly_contact: 5 })
  assert.equal(result.error, null)
  assert.deepEqual(JSON.parse(JSON.stringify(f.calls.filter(call => call[0] === 'update'))), [['update', { hourly_total: 200, hourly_contact: 5 }]])
  assert.deepEqual(f.calls.filter(call => call[0] === 'eq'), [['eq', 'kind', 'join'], ['eq', 'hourly_total', 100], ['eq', 'hourly_contact', 5]])
})
test('bad quotas, kinds and unexpected fields are rejected before transport', async () => {
  for (const next of [{ hourly_total: 9, hourly_contact: 5 }, { hourly_total: 10001, hourly_contact: 5 }, { hourly_total: 100, hourly_contact: 0 }, { hourly_total: 10, hourly_contact: 11 }, { hourly_total: 50.5, hourly_contact: 2 }, { hourly_total: 100, hourly_contact: 5, kind: 'contact' }]) {
    const f = fixture({ data: current, error: null })
    assert.equal(typeof f.api.saveIntakeLimit, 'function')
    assert.ok((await f.api.saveIntakeLimit(current, next)).error)
    assert.equal(f.calls.length, 0)
  }
})
test('missing rows, conflicts and denied reads fail visibly rather than claiming a successful save', async () => {
  for (const response of [{ data: null, error: null }, { data: null, error: { code: '42501', message: 'private SQL details' } }]) {
    const f = fixture(response)
    assert.equal(typeof f.api.saveIntakeLimit, 'function')
    const result = await f.api.saveIntakeLimit(current, { hourly_total: 100, hourly_contact: 5 })
    assert.ok(result.error)
    assert.doesNotMatch(result.error, /private SQL/)
  }
  const f = fixture({ data: [current], error: null })
  assert.equal(typeof f.api.loadIntakeLimits, 'function')
  assert.ok((await f.api.loadIntakeLimits()).error, 'Incomplete setup must not invent missing limits')
})
