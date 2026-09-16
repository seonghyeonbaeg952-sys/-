import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import ts from 'typescript'

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const key = '__smyc_cms_delete_fixture__'
const calls = []
let count = 1
const query = {
  select(...args) { calls.push(['select', ...args]); return this },
  delete(...args) { calls.push(['delete', ...args]); return this },
  eq(...args) { calls.push(['eq', ...args]); return this },
  maybeSingle() { return { data: { photo_file_path: 'submissions/test-only.png', recommendation_file_path: null }, error: null } },
  then(resolve, reject) { return Promise.resolve({ data: null, error: null, count }).then(resolve, reject) },
}
globalThis[key] = {
  from(table) { calls.push(['from', table]); return query },
  storage: { from(bucket) { calls.push(['bucket', bucket]); return { remove(paths) { calls.push(['remove', paths]); return { error: null } } } } },
}
const auth = moduleUrl(`export const SUPABASE_SETUP_MESSAGE='missing'; export const getSupabaseClientSafe=()=>({data:globalThis.${key},error:null});`)
const source = ts.transpileModule(await readFile(new URL('./cms.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/(['"])\.\/auth\1/g, JSON.stringify(auth))
const api = await import(moduleUrl(source))
after(() => { delete globalThis[key] })

test('application deletion cannot remove private attachments before the database operation', async () => {
  calls.length = 0
  const result = await api.deleteRow('join_applications', 'fixture-id')
  assert.equal(result.data, null)
  assert.match(result.error, /보관/)
  assert.deepEqual(calls, [])
})

test('ordinary deletion reports success only when one requested record was removed', async () => {
  for (const value of [0, null, 2, 1]) {
    calls.length = 0; count = value
    const result = await api.deleteRow('notices', 'fixture-id')
    assert.deepEqual(calls, [['from', 'notices'], ['delete', { count: 'exact' }], ['eq', 'id', 'fixture-id']])
    if (value === 1) assert.deepEqual(result, { data: true, error: null })
    else { assert.equal(result.data, null); assert.ok(result.error) }
  }
})
