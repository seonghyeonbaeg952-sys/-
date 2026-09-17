import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./cms.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function harness(error) {
  const exports = {}, writes = []
  const client = { from(table) {
    const query = {
      insert(payload) { writes.push({ table, operation: 'insert', payload }); return this },
      update(payload) { writes.push({ table, operation: 'update', payload }); return this },
      select() { return this }, eq() { return this },
      single: async () => ({ data: null, error }),
    }
    return query
  } }
  vm.runInNewContext(source, { exports, require: path => {
    assert.equal(path, './auth')
    return { getSupabaseClientSafe: () => ({ data: client, error: null }) }
  } })
  return { ...exports, writes }
}

test('popup date constraint failures from either save operation give a Korean correction without retrying or changing data', async () => {
  const h = harness({ code: '23514', message: 'new row for relation "popup_notices" violates check constraint "popup_notices_date_range_check"', details: 'Failing row contains private contents.', hint: null })
  const payload = { title: '공연 안내', starts_on: '2026-09-18', ends_on: '2026-09-17' }
  for (const result of [await h.createRow('popup_notices', payload), await h.updateRow('popup_notices', 'popup-id', payload)]) {
    assert.equal(result.data, null)
    assert.match(result.error, /종료일.*시작일/)
    assert.doesNotMatch(result.error, /popup_notices|constraint|private/)
  }
  assert.equal(h.writes.length, 2)
  assert.deepEqual(h.writes.map(write => write.payload), [payload, payload])
})

test('unrelated CMS constraints keep their original diagnostic instead of claiming a popup date problem', async () => {
  const message = 'new row violates check constraint "other_date_range_check"'
  const h = harness({ code: '23514', message })
  assert.equal((await h.createRow('notices', { title: '공지' })).error, message)
})
