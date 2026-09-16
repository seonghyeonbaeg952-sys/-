import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const fixtureKey = '__smyc_sponsor_api_fixture__'
const calls = []
let result = { data: [], error: null }
const query = {
  select(value) { calls.push(['select', value]); return this },
  eq(...args) { calls.push(['eq', ...args]); return this },
  order(...args) { calls.push(['order', ...args]); return this },
  limit(value) { calls.push(['limit', value]); return this },
  then(resolve, reject) { return Promise.resolve(result).then(resolve, reject) },
}
globalThis[fixtureKey] = {
  from(...args) { calls.push(['from', ...args]); return query },
  rpc(...args) { calls.push(['rpc', ...args]); return query },
}
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent',
  server: { middlewareMode: true }, plugins: [{ name: 'sponsor-test-transport', enforce: 'pre',
    resolveId(source, importer) { if ((source === './auth' || source.endsWith('/lib/auth.ts')) && importer?.replaceAll('\\', '/').includes('/src/lib/publicData.ts')) return '\0sponsor-test-auth' },
    load(id) { if (id === '\0sponsor-test-auth') return `export const SUPABASE_SETUP_MESSAGE='test'; export const getSupabaseClientSafe=()=>({data:globalThis.${fixtureKey},error:null});` },
  }] })
const api = await vite.ssrLoadModule('/src/lib/publicData.ts')
after(async () => { delete globalThis[fixtureKey]; await vite.close() })

test('sponsors use the fixed GET public projection while preserving display filters and limit', async () => {
  calls.length = 0
  result = { data: [{ id: 'sponsor', name: '공개 이름', display_name: '공개 이름', category: 'other', tier: 'supporter',
    is_visible: true, display_order: 1, show_on_home: true, show_on_support: true, show_on_footer: false,
    internal_notes: 'must not escape normalizer' }], error: null }
  const answer = await api.getPublicSponsors({ homeOnly: true, limit: 2 })
  assert.deepEqual(calls[0], ['rpc', 'get_public_sponsors', {}, { get: true }])
  assert.equal(calls.some(call => call[0] === 'from'), false)
  assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'show_on_home' && call[2] === true))
  assert.ok(calls.some(call => call[0] === 'limit' && call[1] === 2))
  assert.equal(answer.error, null)
  assert.equal(answer.data[0].name, '공개 이름')
  assert.equal(Object.hasOwn(answer.data[0], 'internal_notes'), false)
})

test('missing public sponsor RPC never falls back to raw sponsor table reads', async () => {
  calls.length = 0
  result = { data: null, error: { code: 'PGRST202', message: 'get_public_sponsors is missing' } }
  const answer = await api.getPublicSponsors()
  assert.equal(calls.some(call => call[0] === 'from'), false)
  assert.equal(answer.data, null)
  assert.ok(answer.error)
})
