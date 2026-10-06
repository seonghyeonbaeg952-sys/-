import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./cms.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function harness(error) {
  const writes = [], exports = {}
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

for (const [constraint, label] of [['members_part_check', '파트'], ['members_group_type_check', '그룹']]) {
  test(`단원 ${label} 저장 제한 오류는 원문 SQL 대신 복구 안내를 표시한다`, async () => {
    const h = harness({ code: '23514', message: `new row for relation "members" violates check constraint "${constraint}"`, details: 'PRIVATE MEMBER DATA' })
    const payload = { part: 'accompanist', group_type: 'hidden', name_display_type: 'hidden' }
    for (const result of [await h.createRow('members', payload), await h.updateRow('members', 'fixture', payload)]) {
      assert.equal(result.data, null)
      assert.ok(result.error.includes(`선택한 ${label}`))
      assert.match(result.error, /다시 저장/)
      assert.doesNotMatch(result.error, /members|constraint|PRIVATE/)
    }
    assert.equal(h.writes.length, 2, 'a constraint failure must not silently retry or change the chosen part')
    for (const write of h.writes) {
      assert.equal(write.table, 'members')
      assert.equal(write.payload.part, 'accompanist')
      assert.equal(write.payload.group_type, 'hidden')
      assert.equal(write.payload.name_display_type, 'hidden')
    }
  })
}
