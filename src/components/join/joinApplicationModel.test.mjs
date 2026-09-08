import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
let model
try { model = await vite.ssrLoadModule('/src/components/join/joinApplicationModel.ts') } catch { /* RED: module not created yet */ }
const values = { applicant_name: '테스트', birth_date: '2010-01-01', school: '테스트학교 2학년', applicant_phone: '010-1234-5678', guardian_phone: '02-123-4567', desired_parts: ['alto', 'soprano', 'alto'], motivation: '합창에 참여하고 싶습니다.', privacy_agreed: true, website: '' }
const now = new Date('2026-09-08T00:00:00Z')
test('all seven application fields and explicit consent are required', () => {
  const errors = model.validateJoinApplicationValues(model.createInitialJoinApplicationValues(), now)
  assert.deepEqual(Object.keys(errors).sort(), ['applicant_name','birth_date','school','applicant_phone','guardian_phone','desired_parts','motivation','privacy_agreed'].sort())
  assert.deepEqual(model.validateJoinApplicationValues(values, now), {})
})
test('malformed/future birthdays, unsupported parts, malformed phone numbers and oversize copy are rejected', () => {
  for (const birth_date of ['2026-02-29', '2099-01-01', '10.1.1']) assert.ok(model.validateJoinApplicationValues({ ...values, birth_date }, now).birth_date)
  assert.ok(model.validateJoinApplicationValues({ ...values, desired_parts: ['admin'] }, now).desired_parts)
  assert.ok(model.validateJoinApplicationValues({ ...values, guardian_phone: 'abc123456789' }, now).guardian_phone)
  assert.ok(model.validateJoinApplicationValues({ ...values, motivation: 'a'.repeat(5001) }, now).motivation)
})
test('the RPC payload carries only explicit v2 answers, deduplicated parts and stable submission identity', () => {
  const payload = model.buildJoinApplicationPayload(values, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')
  assert.deepEqual(payload.p_desired_parts, ['soprano','alto'])
  assert.equal(payload.p_applicant_phone, '01012345678')
  assert.equal(payload.p_guardian_phone, '021234567')
  assert.equal(payload.p_privacy_agreed, true)
  assert.equal(payload.p_submission_id, '00000000-0000-4000-8000-000000000002')
  assert.deepEqual(Object.keys(payload).sort(), ['p_join_info_id','p_submission_id','p_applicant_name','p_birth_date','p_applicant_phone','p_guardian_phone','p_school','p_desired_parts','p_motivation','p_privacy_agreed'].sort())
})
