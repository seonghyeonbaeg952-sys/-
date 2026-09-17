import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const stylesUrl = moduleUrl(compile(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8')))
const modelUrl = moduleUrl(compile(await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const transportKey = '__motet_site_editor_api_fixture__'
const calls = []
let response = { data: null, error: null }
let unavailable = false
const result = async () => { if (response instanceof Error) throw response; return await response }
globalThis[transportKey] = {
  getClient() {
    if (unavailable) return { data: null, error: 'private configuration detail' }
    return { data: {
      async rpc(...args) { calls.push({ kind: 'rpc', args }); return result() },
      from(table) {
        const operation = { kind: 'query', table, select: null, filters: [], order: null }
        const query = {
          select(columns) { operation.select = columns; return query },
          eq(column, value) { operation.filters.push([column, value]); return query },
          order(column, options) { operation.order = [column, options]; return query },
          async maybeSingle() { calls.push(operation); return result() },
          then(resolve, reject) { calls.push(operation); return result().then(resolve, reject) },
        }
        return query
      },
    }, error: null }
  },
}
const authUrl = moduleUrl(`export const getSupabaseClientSafe = () => globalThis.${transportKey}.getClient()`)
let api = {}
try {
  let source = compile(await readFile(new URL('./siteEditorApi.ts', import.meta.url), 'utf8'))
  source = source.replace(/(['"])\.\/auth\1/g, JSON.stringify(authUrl)).replace(/(['"])\.\/siteEditorModel\1/g, JSON.stringify(modelUrl))
  api = await import(moduleUrl(source))
} catch (error) { if (error.code !== 'ENOENT') throw error }
after(() => { delete globalThis[transportKey] })
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const row = (overrides = {}) => ({ page_key: 'contact', draft: empty(), published: null, version: 1,
  updated_at: '2026-09-17T00:00:00Z', published_at: null, ...overrides })
const published = () => ({ page_key: 'contact', document: { ...empty(), copy: { 'contact.title': '게시본' } }, published_at: '2026-09-17T00:00:00Z' })
const revisionId = '11111111-1111-4111-8111-111111111111'
const reset = next => { api.invalidateEditorCache?.(); calls.length = 0; response = next; unavailable = false }
const has = name => assert.equal(typeof api[name], 'function', `${name} must implement the editor API contract`)

test('missing administrator page reads become a fresh virtual version zero draft', async () => {
  has('loadEditorPage')
  reset({ data: null, error: null })
  assert.deepEqual(await api.loadEditorPage('contact'), { data: row({ version: 0, updated_at: '' }), error: null })
  assert.deepEqual(calls, [{ kind: 'query', table: 'site_editor_pages', select: 'page_key,draft,published,version,updated_at,published_at', filters: [['page_key', 'contact']], order: null }])
})

test('existing drafts allow no published document and project out server identity fields', async () => {
  has('loadEditorPage')
  const record = row({ updated_by: 'private-identity', published_by: 'private-identity' })
  for (const data of [record, [record]]) {
    reset({ data, error: null })
    assert.deepEqual(await api.loadEditorPage('contact'), { data: row(), error: null })
  }
})

test('save emits only the fixed RPC parameters and returns the validated next version', async () => {
  has('saveEditorDraft')
  const document = { ...empty(), copy: { 'contact.title': '  공백\n보존  ' } }
  const snapshot = structuredClone(document)
  reset({ data: [row({ draft: snapshot, version: 3 })], error: null })
  const saving = api.saveEditorDraft('contact', document, 2)
  document.copy['contact.title'] = 'later typing'
  assert.deepEqual(await saving, { data: row({ draft: snapshot, version: 3 }), error: null })
  assert.deepEqual(calls, [{ kind: 'rpc', args: ['save_site_editor_draft', { p_page_key: 'contact', p_document: snapshot, p_expected_version: 2 }] }])
})

test('publish sends the version without sending unsaved local document state', async () => {
  has('publishEditorPage')
  reset({ data: row({ version: 5, published: empty(), published_at: '2026-09-17T00:00:00Z' }), error: null })
  assert.equal((await api.publishEditorPage('contact', 4)).error, null)
  assert.deepEqual(calls, [{ kind: 'rpc', args: ['publish_site_editor_page', { p_page_key: 'contact', p_expected_version: 4 }] }])
})

test('restore uses the revision RPC and does not treat restoration as publication', async () => {
  has('restoreEditorRevision')
  reset({ data: row({ version: 8 }), error: null })
  assert.deepEqual(await api.restoreEditorRevision(revisionId, 7), { data: row({ version: 8 }), error: null })
  assert.deepEqual(calls, [{ kind: 'rpc', args: ['restore_site_editor_revision', { p_revision_id: revisionId, p_expected_version: 7 }] }])
})

test('revision reads are page-filtered, newest first and exclude publishing identities', async () => {
  has('loadEditorRevisions')
  const revision = { id: revisionId, page_key: 'contact', document: empty(), published_at: '2026-09-17T00:00:00Z' }
  reset({ data: [{ ...revision, published_by: 'private-identity' }], error: null })
  assert.deepEqual(await api.loadEditorRevisions('contact'), { data: [revision], error: null })
  assert.deepEqual(calls, [{ kind: 'query', table: 'site_editor_revisions', select: 'id,page_key,document,published_at', filters: [['page_key', 'contact']], order: ['published_at', { ascending: false }] }])
  reset({ data: [], error: null })
  assert.deepEqual(await api.loadEditorRevisions('contact'), { data: [], error: null })
})

test('invalid pages, versions, revision IDs and documents never reach the transport', async () => {
  has('saveEditorDraft'); has('publishEditorPage'); has('restoreEditorRevision'); has('loadEditorRevisions')
  reset({ data: row(), error: null })
  const invalid = [() => api.loadEditorPage('admin'), () => api.loadEditorRevisions('__proto__'),
    () => api.saveEditorDraft('contact', { ...empty(), copy: { title: '<img src=x>' } }, 0),
    () => api.publishEditorPage('contact', NaN), () => api.publishEditorPage('contact', -1),
    () => api.saveEditorDraft('contact', empty(), Number.MAX_SAFE_INTEGER + 1),
    () => api.restoreEditorRevision('invalid', 0), () => api.restoreEditorRevision(revisionId, 0.5)]
  for (const call of invalid) { const value = await call(); assert.equal(value.data, null); assert.ok(value.error) }
  assert.equal(calls.length, 0)
})

test('mutation false, null, empty, multiple or structurally invalid responses never report success', async () => {
  has('saveEditorDraft')
  for (const data of [false, true, null, [], [row(), row()], {}, row({ page_key: 'join' }), row({ version: 0 }),
    row({ updated_at: 'invalid' }), row({ draft: { ...empty(), unknown: true } }), row({ published: false })]) {
    reset({ data, error: null })
    const value = await api.saveEditorDraft('contact', empty(), 0)
    assert.equal(value.data, null); assert.ok(value.error)
  }
})

test('missing install, permission and conflict errors remain distinguishable without internal details', async () => {
  has('saveEditorDraft')
  for (const [code, expected] of [['PGRST202', /설치|준비/], ['42P01', /설치|준비/], ['42501', /권한|로그인/], ['40001', /다른 관리자|충돌/], ['23505', /다른 관리자|충돌/]]) {
    reset({ data: row(), error: { code, message: 'private SQL table detail' } })
    const value = await api.saveEditorDraft('contact', empty(), 0)
    assert.equal(value.data, null); assert.match(value.error, expected); assert.doesNotMatch(value.error, /private/)
  }
})

test('unavailable client and thrown requests are handled across every API entry point', async () => {
  has('loadPublicEditorPages')
  const operations = [() => api.loadEditorPage('contact'), () => api.loadEditorRevisions('contact'),
    () => api.saveEditorDraft('contact', empty(), 0), () => api.publishEditorPage('contact', 1),
    () => api.restoreEditorRevision(revisionId, 1), () => api.loadPublicEditorPages()]
  for (const operation of operations) {
    reset(new Error('private network detail'))
    const value = await operation(); assert.equal(value.data, null); assert.ok(value.error); assert.doesNotMatch(value.error, /private/)
    reset({ data: null, error: null }); unavailable = true
    const missing = await operation(); assert.equal(missing.data, null); assert.ok(missing.error); assert.doesNotMatch(missing.error, /private/)
    assert.equal(calls.length, 0)
  }
})

test('public reads use only the GET publication RPC and never return drafts or administrator identity', async () => {
  has('loadPublicEditorPages')
  const record = published()
  reset({ data: [{ ...record, draft: { secret: 'PRIVATE-DRAFT' }, published_by: 'PRIVATE-IDENTITY' }], error: null })
  assert.deepEqual(await api.loadPublicEditorPages(), { data: [record], error: null })
  assert.deepEqual(calls, [{ kind: 'rpc', args: ['get_public_site_editor_pages', {}, { get: true }] }])
})

test('empty published lists succeed but absent or malformed public data remains an error', async () => {
  has('loadPublicEditorPages')
  reset({ data: [], error: null })
  assert.deepEqual(await api.loadPublicEditorPages(), { data: [], error: null })
  for (const data of [null, false, {}, [published(), published()], [{ ...published(), page_key: 'admin' }], [{ ...published(), document: null }], [{ ...published(), published_at: null }]]) {
    reset({ data, error: null })
    const value = await api.loadPublicEditorPages(); assert.equal(value.data, null); assert.ok(value.error)
  }
})

test('concurrent public loads share the GET request without sharing mutable returned documents', async () => {
  has('loadPublicEditorPages'); has('invalidateEditorCache')
  let complete
  reset(new Promise(resolve => { complete = resolve }))
  const first = api.loadPublicEditorPages()
  const second = api.loadPublicEditorPages()
  assert.equal(calls.length, 1)
  complete({ data: [published()], error: null })
  const [a, b] = await Promise.all([first, second])
  a.data[0].document.copy['contact.title'] = 'local mutation'
  assert.equal(b.data[0].document.copy['contact.title'], '게시본')
  assert.equal((await api.loadPublicEditorPages()).data[0].document.copy['contact.title'], '게시본')
  assert.equal(calls.length, 1)
})

test('cache invalidation prevents an older in-flight GET from becoming the current cache', async () => {
  has('loadPublicEditorPages'); has('invalidateEditorCache')
  let completeOld
  reset(new Promise(resolve => { completeOld = resolve }))
  const oldRequest = api.loadPublicEditorPages()
  api.invalidateEditorCache()
  response = { data: [{ ...published(), document: { ...empty(), copy: { 'contact.title': '새 게시본' } } }], error: null }
  await api.loadPublicEditorPages()
  completeOld({ data: [published()], error: null })
  await oldRequest
  assert.equal((await api.loadPublicEditorPages()).data[0].document.copy['contact.title'], '새 게시본')
  assert.equal(calls.length, 2)
})

test('successful publication invalidates the public cache while failed publication does not claim success', async () => {
  has('publishEditorPage'); has('loadPublicEditorPages')
  reset({ data: [published()], error: null }); await api.loadPublicEditorPages()
  response = { data: row({ version: 2, published: empty(), published_at: '2026-09-17T00:00:00Z' }), error: null }
  await api.publishEditorPage('contact', 1)
  response = { data: [], error: null }
  assert.deepEqual(await api.loadPublicEditorPages(), { data: [], error: null })
  assert.equal(calls.filter(call => call.kind === 'rpc' && call.args[0] === 'get_public_site_editor_pages').length, 2)
})

test('public cache expires after thirty seconds and failed reads can be retried immediately', async t => {
  has('loadPublicEditorPages')
  let now = 100000
  t.mock.method(Date, 'now', () => now)
  reset({ data: [published()], error: null })
  await api.loadPublicEditorPages()
  now += 29999
  await api.loadPublicEditorPages()
  assert.equal(calls.length, 1)
  now += 1
  response = { data: null, error: { code: 'PGRST202', message: 'private migration detail' } }
  assert.ok((await api.loadPublicEditorPages()).error)
  response = { data: [], error: null }
  assert.deepEqual(await api.loadPublicEditorPages(), { data: [], error: null })
  assert.equal(calls.length, 3)
})

test('publication emits a refresh event only after a real published record is confirmed', async () => {
  has('publishEditorPage')
  const originalWindow = globalThis.window
  const events = []
  globalThis.window = { dispatchEvent: event => { events.push(event.type); return true } }
  try {
    reset({ data: row({ version: 2 }), error: null }); events.length = 0
    assert.ok((await api.publishEditorPage('contact', 1)).error)
    assert.deepEqual(events, [])
    response = { data: row({ version: 2, published: empty(), published_at: '2026-09-17T00:00:00Z' }), error: null }
    assert.equal((await api.publishEditorPage('contact', 1)).error, null)
    assert.deepEqual(events, ['site-editor-published'])
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
})

test('malformed revision records cannot reach a restore history list', async () => {
  has('loadEditorRevisions')
  for (const data of [null, false, [{}], [{ id: revisionId, page_key: 'join', document: empty(), published_at: '2026-09-17T00:00:00Z' }],
    [{ id: revisionId, page_key: 'contact', document: { ...empty(), appearance: { shared: { fontSize: 0 } } }, published_at: '2026-09-17T00:00:00Z' }]]) {
    reset({ data, error: null })
    const value = await api.loadEditorRevisions('contact')
    assert.equal(value.data, null); assert.ok(value.error)
  }
})
