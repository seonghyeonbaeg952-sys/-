import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const calls = []
const client = {
  rpc: async (...args) => { calls.push(['rpc', ...args]); return { data: true, error: null } },
  from: name => ({ insert: async payload => { calls.push(['insert', name, payload]); return { data: true, error: null } } }),
  storage: { from() { throw new Error('Legacy submissions must not upload files') } },
}
globalThis.__publicIntakeClient = client
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent',
  server: { middlewareMode: true }, plugins: [{ name: 'public-intake-transport', enforce: 'pre',
    resolveId(source, importer) { if (source === './auth' && /\/src\/lib\/(publicData|intakeApi)\.ts$/.test(importer?.replaceAll('\\', '/') ?? '')) return '\0intake-transport' },
    load(id) { if (id === '\0intake-transport') return 'export const SUPABASE_SETUP_MESSAGE="test"; export const getSupabaseClientSafe=()=>({data:globalThis.__publicIntakeClient,error:null});' },
  }] })
const api = await vite.ssrLoadModule('/src/lib/publicData.ts')
after(async () => { delete globalThis.__publicIntakeClient; await vite.close() })
const requestId = '33333333-3333-4333-8333-333333333333'
const guideId = '44444444-4444-4444-8444-444444444444'
const contact = { name: 'Fixture', email: 'qa@example.invalid', phone: null, type: 'general', title: null, message: ' Original\nmessage ', privacy_agreed: true }
const pledge = { name: 'Fixture', email: 'qa@example.invalid', phone: '01000000000', address: null, amount: 10000, custom_amount: null, birth_date: null, gender: null, member_type: 'individual', depositor: null, pledge_date: null, signer_name: null, signature_image_url: null, privacy_agreed: true }

test('public contact consumer crosses only the validated idempotent RPC boundary', async () => {
  calls.length = 0
  assert.deepEqual(await api.createContactMessage(contact, requestId), { data: true, error: null })
  assert.deepEqual(calls, [['rpc', 'submit_contact_message', { p_submission_id: requestId, p_payload: contact }]])
})

test('public pledge consumer supplies the guide identity and cannot directly insert private rows', async () => {
  calls.length = 0
  assert.deepEqual(await api.createSupportPledge(pledge, requestId, guideId), { data: true, error: null })
  assert.deepEqual(calls, [['rpc', 'submit_support_pledge', { p_submission_id: requestId, p_support_settings_id: guideId, p_payload: pledge }]])
})

test('retired admissions entry rejects before field access, file upload or database writes', async () => {
  calls.length = 0
  const result = await api.createJoinApplication({ privacy_agreed: true, website: '' })
  assert.equal(result.data, null)
  assert.match(result.error, /현재 입단지원서/)
  assert.equal(calls.length, 0)
})
