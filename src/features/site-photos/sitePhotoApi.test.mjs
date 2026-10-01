import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import ts from 'typescript'
const moduleUrl = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const compile = code => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const modelUrl = moduleUrl(compile(await readFile(new URL('./sitePhotoModel.ts', import.meta.url), 'utf8')))
const catalogUrl = moduleUrl(compile(await readFile(new URL('./sitePhotoCatalog.ts', import.meta.url), 'utf8')))
const fixture = '__site_photo_api_test__'
let response = { data: null, error: null }
const calls = []
globalThis[fixture] = { rpc(...args) { calls.push(args); return Promise.resolve(response) } }
const authUrl = moduleUrl(`export const getSupabaseClientSafe = () => ({ data: globalThis.${fixture}, error: null })`)
let api = {}
try {
  let code = compile(await readFile(new URL('./sitePhotoApi.ts', import.meta.url), 'utf8'))
  code = code.replaceAll("'../../lib/auth'", JSON.stringify(authUrl)).replaceAll("'./sitePhotoModel'", JSON.stringify(modelUrl)).replaceAll("'./sitePhotoCatalog'", JSON.stringify(catalogUrl))
  api = await import(moduleUrl(code))
} catch (error) { if (error.code !== 'ENOENT') throw error }
after(() => { delete globalThis[fixture] })
const value = { src: 'https://example.com/a.webp', altKo: '합창단', altEn: 'Choir', positionX: 30, positionY: 50 }
const row = { asset_key: 'about-europe', draft: value, published: null, version: 1, updated_at: '2026-09-30T00:00:00Z', published_at: null }
const reset = data => { calls.length = 0; response = data; api.invalidateSitePhotoCache?.() }
const has = name => assert.equal(typeof api[name], 'function', `Missing photo API: ${name}`)

test('draft save snapshots the image metadata and uses the optimistic version without touching text documents', async () => {
  has('saveSitePhotoDraft')
  reset({ data: row, error: null })
  const input = structuredClone(value)
  const saving = api.saveSitePhotoDraft('about-europe', input, 0)
  input.altKo = 'later edit'
  assert.deepEqual(await saving, { data: row, error: null })
  assert.deepEqual(calls, [['save_site_photo_draft', { p_asset_key: 'about-europe', p_photo: value, p_expected_version: 0 }]])
})

test('publication only publishes the previously saved version and accepts null as restoration to the original', async () => {
  has('publishSitePhoto')
  reset({ data: { ...row, draft: null, version: 2, published_at: '2026-09-30T00:00:00Z' }, error: null })
  assert.equal((await api.publishSitePhoto('about-europe', 1)).error, null)
  assert.deepEqual(calls, [['publish_site_photo', { p_asset_key: 'about-europe', p_expected_version: 1 }]])
})

test('the public API projects out draft and identity fields even if the transport includes them', async () => {
  has('loadPublicSitePhotos')
  reset({ data: [{ asset_key: 'about-europe', published: value, published_at: '2026-09-30T00:00:00Z', draft: { src: 'private-draft' }, updated_by: 'private-identity' }], error: null })
  assert.deepEqual(await api.loadPublicSitePhotos(), { data: { 'about-europe': { published: value } }, error: null })
  assert.deepEqual(calls, [['get_public_site_photos', {}, { get: true }]])
})

test('invalid metadata, unregistered slots and invalid versions never reach the server', async () => {
  has('saveSitePhotoDraft')
  reset({ data: row, error: null })
  for (const args of [['about-europe', { ...value, src: 'javascript:bad' }, 0], ['__proto__', value, 0], ['unknown', value, 0], ['about-europe', value, -1], ['about-europe', value, 0.5]]) {
    assert.ok((await api.saveSitePhotoDraft(...args)).error)
  }
  assert.equal(calls.length, 0)
})

test('stale writes and malformed successful responses are errors, never false save confirmations', async () => {
  has('saveSitePhotoDraft')
  reset({ data: null, error: { code: '40001' } })
  assert.match((await api.saveSitePhotoDraft('about-europe', value, 0)).error, /다른 관리자|먼저 변경/)
  reset({ data: { ...row, version: 9 }, error: null })
  assert.ok((await api.saveSitePhotoDraft('about-europe', value, 0)).error)
})
