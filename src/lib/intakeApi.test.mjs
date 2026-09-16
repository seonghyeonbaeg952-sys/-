import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const calls = []
let response = { data: true, error: null }
let preview = false
globalThis.__intake_fixture = {
  client: () => ({ data: { rpc: async (...args) => { calls.push(args); if (response instanceof Error) throw response; return response } }, error: null }),
  preview: () => preview,
}
const auth = moduleUrl('export const getSupabaseClientSafe = () => globalThis.__intake_fixture.client()')
const guard = moduleUrl('export const isSiteEditorPreview = () => globalThis.__intake_fixture.preview(); export const PREVIEW_SUBMISSION_MESSAGE = "preview blocked"')
const model = moduleUrl(compile(await readFile(new URL('./intakeModel.ts', import.meta.url), 'utf8')))
const source = compile(await readFile(new URL('./intakeApi.ts', import.meta.url), 'utf8'))
  .replace(/(['"])\.\/auth\1/g, JSON.stringify(auth)).replace(/(['"])\.\/siteEditorPreview\1/g, JSON.stringify(guard)).replace(/(['"])\.\/intakeModel\1/g, JSON.stringify(model))
const api = await import(moduleUrl(source))
after(() => { delete globalThis.__intake_fixture })
const id = '22222222-2222-4222-8222-222222222222'
const settingsId = '00000000-0000-0000-0000-000000000401'
const contact = { name: '김테스트', email: 'fixture@example.test', phone: null, type: 'general', title: null, message: ' 원문\n둘째 줄 ', privacy_agreed: true }
const pledge = { name: '김테스트', email: 'fixture@example.test', phone: '010-1234-5678', address: null, amount: 10000, custom_amount: null, birth_date: null, gender: null, member_type: 'individual', depositor: null, pledge_date: null, signer_name: null, signature_image_url: null, privacy_agreed: true }
const reset = value => { calls.length = 0; response = value; preview = false }

test('contact RPC sends exact original payload and the same opaque ID on retry, without private/admin fields', async () => {
  reset({ data: true, error: null })
  assert.deepEqual(await api.submitContactIntake({ ...contact, website: '' }, id), { data: true, error: null })
  await api.submitContactIntake(contact, id)
  assert.deepEqual(calls, Array(2).fill(['submit_contact_message', { p_submission_id: id, p_payload: contact }]))
})

test('pledge RPC includes the selected settings ID and does not rewrite original donor values', async () => {
  reset({ data: true, error: null })
  assert.deepEqual(await api.submitSupportIntake(pledge, id, settingsId), { data: true, error: null })
  assert.deepEqual(calls, [['submit_support_pledge', { p_submission_id: id, p_support_settings_id: settingsId, p_payload: pledge }]])
})

test('invalid input, metadata IDs and preview never reach a write; honeypot stays side-effect free', async () => {
  reset({ data: true, error: null })
  for (const [input, submission] of [[{ ...contact, privacy_agreed: false }, id], [{ ...contact, status: 'answered' }, id], [contact, 'bad']]) assert.equal((await api.submitContactIntake(input, submission)).data, null)
  assert.equal((await api.submitSupportIntake(pledge, id, 'bad')).data, null)
  await api.submitContactIntake({ ...contact, website: 'trap' }, id)
  preview = true
  assert.equal((await api.submitContactIntake({}, '')).error, 'preview blocked')
  assert.equal(calls.length, 0)
})

test('SQL errors, missing migrations, false responses and thrown transports never become success or expose backend details', async () => {
  for (const value of [{ data: false, error: null }, { data: null, error: null }, { data: null, error: { code: 'PGRST202', message: 'private backend detail' } }, new Error('private backend detail')]) {
    reset(value)
    const result = await api.submitContactIntake(contact, id)
    assert.equal(result.data, null); assert.ok(result.error); assert.ok(!result.error.includes('private backend detail'))
  }
  reset({ data: null, error: { code: 'P0001', message: '접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.' } })
  assert.equal((await api.submitSupportIntake(pledge, id, settingsId)).error, '접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.')
})
