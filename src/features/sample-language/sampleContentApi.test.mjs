import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
const fixtureKey = '__englishContentApiFixture'
const calls = []
const id = '11111111-1111-4111-8111-111111111111'
const row = (version = 1) => ({ resource: 'notices', record_id: id, draft: { title: 'English' }, published: null, version, updated_at: '2026-09-28T01:00:00Z', published_at: null })
let response = { data: null, error: null }, throws = false
const chain = { select(value) { calls.push(['select', value]); return this }, eq(...args) { calls.push(['eq', ...args]); return this }, in(...args) { calls.push(['in', ...args]); return Promise.resolve(response) }, maybeSingle() { if (throws) throw new Error('offline'); return Promise.resolve(response) } }
globalThis[fixtureKey] = { data: { from(table) { calls.push(['from', table]); return chain }, rpc(name, parameters, options) { calls.push(['rpc', name, parameters, options]); if (throws) throw new Error('offline'); return Promise.resolve(response) } }, error: null }
async function load(file, dependencies = {}) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInThisContext(`(function(exports, require) { ${code}\n})`)(exports, name => { assert.ok(name in dependencies, name); return dependencies[name] })
  return exports
}
after(() => { delete globalThis[fixtureKey] })
const youtube = await load('../../utils/youtube.ts')
const model = await load('./sampleContentModel.ts', { '../../utils/youtube': youtube })
const api = await load('./sampleContentApi.ts', { '../../lib/auth': { getSupabaseClientSafe: () => globalThis[fixtureKey] }, './sampleContentModel': model })
function reset(next = { data: null, error: null }) { calls.length = 0; response = next; throws = false }

test('first draft load reads only the separate English table and returns an editable empty version', async () => {
  reset()
  const result = await api.loadEnglishContent('notices', id)
  assert.equal(result.error, null); assert.equal(result.data.version, 0); assert.deepEqual(result.data.draft, {})
  assert.deepEqual(calls.filter(call => call[0] === 'from'), [['from', 'sample_english_content']])
  assert.deepEqual(calls.filter(call => call[0] === 'eq'), [['eq', 'resource', 'notices'], ['eq', 'record_id', id]])
})
test('save and publish are separate RPCs with explicit expected versions; input object stays intact', async () => {
  const fields = { title: 'English' }, before = structuredClone(fields)
  reset({ data: row(1), error: null })
  assert.equal((await api.saveEnglishContentDraft('notices', id, fields, 0)).data.version, 1)
  assert.deepEqual(calls[0], ['rpc', 'save_sample_english_content_draft', { p_resource: 'notices', p_record_id: id, p_expected_version: 0, p_fields: fields }, undefined])
  assert.deepEqual(fields, before)
  reset({ data: { ...row(2), published: fields, published_at: '2026-09-28T01:01:00Z' }, error: null })
  assert.equal((await api.publishEnglishContent('notices', id, 1)).data.published.title, 'English')
  assert.deepEqual(calls[0][2], { p_resource: 'notices', p_record_id: id, p_expected_version: 1 })
  assert.equal(calls[0][1], 'publish_sample_english_content')
})
test('invalid resource, UUID, private field and unsafe image URL cause no server request', async () => {
  for (const [resource, key, fields] of [['contacts', id, { title: 'private' }], ['gallery', 'bad-id', {}], ['notices', id, { is_visible: 'true' }], ['gallery', id, { image_url: 'javascript:alert(1)' }]]) {
    reset(); assert.ok((await api.saveEnglishContentDraft(resource, key, fields, 0)).error); assert.equal(calls.length, 0)
  }
})
test('stale versions, permission denial, schema failure and offline requests have actionable messages', async () => {
  for (const [code, expected] of [['40001', /다른 관리자/], ['42501', /관리자 권한/], ['PGRST202', /서버 설치/], ['22023', /입력 범위/]]) {
    reset({ data: null, error: { code } }); const result = await api.saveEnglishContentDraft('notices', id, { title: 'Keep this input' }, 3)
    assert.equal(result.data, null); assert.match(result.error, expected)
  }
  reset(); throws = true; assert.match((await api.loadEnglishContent('notices', id)).error, /연결/)
})
test('mismatched row identity or unexpected returned version is not accepted as a successful save', async () => {
  for (const data of [{ ...row(1), record_id: '22222222-2222-4222-8222-222222222222' }, row(4), { ...row(1), draft: { id: 'tamper' } }]) {
    reset({ data, error: null }); assert.ok((await api.saveEnglishContentDraft('notices', id, { title: 'English' }, 0)).error)
  }
})
test('public reading uses the published projection; CMS status is one metadata-only batch', async () => {
  reset({ data: [{ resource: 'notices', record_id: id, published: { title: 'English' }, published_at: '2026-09-28T01:00:00Z' }], error: null })
  assert.equal((await api.loadPublishedEnglishContent()).data[0].published.title, 'English')
  assert.deepEqual(calls[0], ['rpc', 'get_public_sample_english_content', {}, { get: true }])
  reset({ data: [{ record_id: id, published_at: null }], error: null })
  assert.equal((await api.loadEnglishContentStates('notices', [id])).data[id], 'draft')
  assert.deepEqual(calls.find(call => call[0] === 'select'), ['select', 'record_id,published_at'])
  reset(); assert.deepEqual((await api.loadEnglishContentStates('notices', [])).data, {}); assert.equal(calls.length, 0)
})
