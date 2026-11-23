import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import ts from 'typescript'

const dataModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const modelUrl = dataModule(compile(await readFile(new URL('../components/join/joinApplicationModel.ts', import.meta.url), 'utf8')))
const sampleGuardUrl = dataModule(compile(await readFile(new URL('./sampleSubmissionGuard.ts', import.meta.url), 'utf8')))
const editorStylesUrl = dataModule(compile(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8')))
const layoutUrl = dataModule(compile(await readFile(new URL('./siteEditorLayout.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(editorStylesUrl)))
const editorModelUrl = dataModule(compile(await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(editorStylesUrl)).replaceAll("'./siteEditorLayout'", JSON.stringify(layoutUrl)))
const previewUrl = dataModule(compile(await readFile(new URL('./siteEditorPreview.ts', import.meta.url), 'utf8'))
  .replace(/(['"])\.\/siteEditorModel\1/g, JSON.stringify(editorModelUrl)))
const transportKey = '__smyc_join_api_test_transport__'
const calls = []
let result = { data: true, error: null }
let unavailable = false
globalThis[transportKey] = {
  getClient() {
    return unavailable ? { data: null, error: 'private configuration detail' } : {
      data: { async rpc(...args) { calls.push(args); if (result instanceof Error) throw result; return typeof result === 'function' ? result(...args) : result } },
      error: null,
    }
  },
}
const authUrl = dataModule(`export const getSupabaseClientSafe = () => globalThis.${transportKey}.getClient()`)
let source = compile(await readFile(new URL('./joinApplications.ts', import.meta.url), 'utf8'))
source = source.replace(/(['"])\.\/sampleSubmissionGuard\1/g, JSON.stringify(sampleGuardUrl))
source = source.replace(/(['"])\.\/auth\1/g, JSON.stringify(authUrl))
source = source.replace(/(['"])\.\/siteEditorPreview\1/g, JSON.stringify(previewUrl))
source = source.replace(/(['"])\.\.\/components\/join\/joinApplicationModel\1/g, JSON.stringify(modelUrl))
const api = await import(dataModule(source))
after(() => { delete globalThis[transportKey] })

const joinId = '11111111-1111-4111-8111-111111111111'
const submissionId = '22222222-2222-4222-8222-222222222222'
const values = {
  applicant_name: '  TEST  ', birth_date: '2010-01-01', school: ' TEST SCHOOL ',
  school_level: 'university', grade: ' 2 ', department: ' MUSIC ', gender: 'not_specified',
  photo_file: null, recommendation_file: null,
  applicant_phone: '+82 (10) 1234-5678', guardian_phone: '010-1234-5678',
  desired_parts: ['bass', 'soprano', 'bass'], motivation: ' TEST MOTIVATION ',
  privacy_agreed: true, website: '',
}
const reset = response => { calls.length = 0; result = response; unavailable = false }

test('Korean and English sample applications never reach the intake RPC', async () => {
  reset({ data: true, error: null })
  const previousWindow = globalThis.window
  try {
    for (const search of ['?lang=ko', '?lang=en']) {
      globalThis.window = { location: { pathname: '/sample/join', search } }
      assert.match((await api.submitJoinApplication(values, joinId, submissionId)).error, /입단지원서는 접수되지 않습니다/)
    }
    assert.equal(calls.length, 0)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})

test('readiness uses the published guide v3 GET RPC and returns no extra server fields', async () => {
  reset({ data: [{ form_version: 3, server_now: '2026-09-08T12:00:00Z', recruitment_starts_at: null,
    recruitment_ends_at: '2026-09-30T09:00:00Z', private_sentinel: 'must not expose' }], error: null })
  assert.deepEqual(await api.getJoinApplicationConfig(joinId), {
    data: { form_version: 3, server_now: '2026-09-08T12:00:00Z', recruitment_starts_at: null, recruitment_ends_at: '2026-09-30T09:00:00Z' }, error: null,
  })
  assert.deepEqual(calls, [['get_join_application_config_v3', { p_join_info_id: joinId }, { get: true }]])
})

test('legacy server keeps the form visible but never accepts a submission missing new fields or files', async () => {
  reset(name => name === 'get_join_application_config'
    ? { data: [{ form_version: 2, server_now: '2026-09-08T12:00:00Z' }], error: null }
    : { data: null, error: { code: 'PGRST202', message: 'private SQL detail' } })
  assert.equal((await api.getJoinApplicationConfig(joinId)).data.form_version, 2)
  assert.match((await api.submitJoinApplication(values, joinId, submissionId)).error, /서버 연결을 준비하고/)
  assert.deepEqual(calls.map(([name]) => name), ['get_join_application_config_v3', 'get_join_application_config', 'submit_join_application_v3'])
})

test('missing migration, invisible guide and invalid capability never become a ready form', async () => {
  for (const response of [
    { data: null, error: { code: 'PGRST202', message: 'private SQL detail' } },
    { data: [], error: null },
    { data: [{ form_version: 1, server_now: '2026-09-08T12:00:00Z' }], error: null },
    { data: [{ form_version: 2, server_now: 'invalid' }], error: null },
  ]) {
    reset(response)
    const answer = await api.getJoinApplicationConfig(joinId)
    assert.equal(answer.data, null); assert.ok(answer.error); assert.ok(!answer.error.includes('private SQL detail'))
  }
})

test('submission preserves the opaque request ID and emits normalized individual answers', async () => {
  reset({ data: true, error: null })
  const original = structuredClone(values)
  assert.deepEqual(await api.submitJoinApplication(values, joinId, submissionId), { data: true, error: null })
  assert.deepEqual(calls[0], ['submit_join_application_v3', {
    p_join_info_id: joinId, p_submission_id: submissionId, p_applicant_name: 'TEST',
    p_birth_date: '2010-01-01', p_applicant_phone: '+821012345678', p_guardian_phone: '01012345678',
    p_school: 'TEST SCHOOL', p_school_level: 'university', p_grade: '2', p_department: 'MUSIC', p_gender: 'not_specified',
    p_desired_parts: ['soprano', 'bass'], p_motivation: 'TEST MOTIVATION', p_privacy_agreed: true, p_photo: null, p_recommendation: null,
  }])
  await api.submitJoinApplication(values, joinId, submissionId)
  assert.deepEqual(calls[1], calls[0]); assert.deepEqual(values, original)
})

test('optional files are sent once with content and returned as bounded administrator download Blobs', async () => {
  reset({ data: true, error: null })
  const photo = new File(['fixture'], 'photo.jpg', { type: 'image/jpeg' })
  const recommendation = new File(['%PDF-fixture'], 'recommendation.pdf', { type: 'application/pdf' })
  assert.deepEqual(await api.submitJoinApplication({ ...values, photo_file: photo, recommendation_file: recommendation }, joinId, submissionId), { data: true, error: null })
  assert.deepEqual(calls[0][1].p_photo, { media_type: 'image/jpeg', base64: btoa('fixture') })
  assert.deepEqual(calls[0][1].p_recommendation, { media_type: 'application/pdf', base64: btoa('%PDF-fixture') })
  reset({ data: { media_type: 'application/pdf', base64: btoa('%PDF-fixture') }, error: null })
  const downloaded = await api.getJoinApplicationAttachment(submissionId, 'recommendation')
  assert.equal(downloaded.data.filename, '추천서.pdf')
  assert.equal(await downloaded.data.blob.text(), '%PDF-fixture')
  assert.deepEqual(calls[0], ['get_join_application_attachment_v3', { p_application_id: submissionId, p_kind: 'recommendation' }])
  reset({ data: { media_type: 'text/html', base64: btoa('fixture') }, error: null })
  assert.equal((await api.getJoinApplicationAttachment(submissionId, 'recommendation')).data, null)
})

test('legacy seeded PostgreSQL guide UUIDs remain valid independently of generated submission UUID versions', async () => {
  reset({ data: true, error: null })
  const legacyGuideId = '00000000-0000-0000-0000-000000000401'
  assert.deepEqual(await api.submitJoinApplication(values, legacyGuideId, submissionId), { data: true, error: null })
  assert.equal(calls[0][1].p_join_info_id, legacyGuideId)
})

test('missing mandatory answers, false consent, honeypot and malformed IDs cannot reach the insert RPC', async () => {
  const invalidInputs = [
    { ...values, applicant_name: '' }, { ...values, birth_date: '' }, { ...values, school: '' },
    { ...values, applicant_phone: '' }, { ...values, guardian_phone: '' }, { ...values, desired_parts: [] },
    { ...values, motivation: '' }, { ...values, privacy_agreed: false }, { ...values, website: 'bot' },
  ]
  for (const input of invalidInputs) {
    reset({ data: true, error: null })
    const answer = await api.submitJoinApplication(input, joinId, submissionId)
    assert.equal(answer.data, null); assert.ok(answer.error); assert.equal(calls.length, 0)
  }
  for (const ids of [['invalid', submissionId], [joinId, 'invalid']]) {
    reset({ data: true, error: null })
    assert.equal((await api.submitJoinApplication(values, ...ids)).data, null)
    assert.equal(calls.length, 0)
  }
})

test('only explicit server true is success; denied, ambiguous and thrown responses keep retryable failure', async () => {
  for (const response of [
    { data: false, error: null }, { data: null, error: null }, { data: 'true', error: null },
    { data: true, error: { code: '42501', message: 'private row and policy details' } },
    new Error('private network detail'),
  ]) {
    reset(response)
    const answer = await api.submitJoinApplication(values, joinId, submissionId)
    assert.equal(answer.data, null); assert.ok(answer.error); assert.ok(!answer.error.includes('private'))
  }
})

test('changed-payload idempotency rejection stays visible without falsely confirming success', async () => {
  const message = '같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.'
  reset({ data: null, error: { code: '22023', message } })
  assert.deepEqual(await api.submitJoinApplication(values, joinId, submissionId), { data: null, error: message })
})

test('API validation uses the supplied authoritative clock rather than the device date', async () => {
  const dated = { ...values, birth_date: '2030-01-01' }
  reset({ data: true, error: null })
  assert.deepEqual(await api.submitJoinApplication(dated, joinId, submissionId, new Date('2031-01-01T00:00:00Z')), { data: true, error: null })
  reset({ data: true, error: null })
  assert.equal((await api.submitJoinApplication(dated, joinId, submissionId, new Date('2029-01-01T00:00:00Z'))).data, null)
  assert.equal(calls.length, 0)
})

test('the deployed SQL recruitment gate message remains an explicit failure visible to the user', async () => {
  const message = '현재 지원서를 접수할 수 없습니다. 최신 입단 안내를 확인해 주세요.'
  reset({ data: null, error: { code: '22023', message } })
  assert.deepEqual(await api.submitJoinApplication(values, joinId, submissionId), { data: null, error: message })
})

test('unconfigured client does not send a request or expose configuration details', async () => {
  reset({ data: true, error: null }); unavailable = true
  for (const answer of [await api.getJoinApplicationConfig(joinId), await api.submitJoinApplication(values, joinId, submissionId)]) {
    assert.equal(answer.data, null); assert.ok(answer.error); assert.ok(!answer.error.includes('private'))
  }
  assert.equal(calls.length, 0)
})
