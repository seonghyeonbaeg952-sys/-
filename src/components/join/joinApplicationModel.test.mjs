import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
let model
try { model = await vite.ssrLoadModule('/src/components/join/joinApplicationModel.ts') } catch { /* RED: module not created yet */ }
const values = { ...model.createInitialJoinApplicationValues(), applicant_name: '테스트', birth_date: '2010-01-01', school: '테스트학교', school_level: 'high', grade: '2학년', gender: 'not_specified', applicant_phone: '010-1234-5678', guardian_phone: '02-123-4567', desired_parts: ['alto', 'soprano', 'alto'], motivation: '합창에 참여하고 싶습니다.', privacy_agreed: true }
const now = new Date('2026-09-08T00:00:00Z')
test('school, grade and gender use separate required fields; optional files never block submission', () => {
  const errors = model.validateJoinApplicationValues(model.createInitialJoinApplicationValues(), now)
  assert.deepEqual(Object.keys(errors).sort(), ['applicant_name','birth_date','school','school_level','grade','gender','applicant_phone','guardian_phone','desired_parts','motivation','privacy_agreed'].sort())
  assert.deepEqual(model.validateJoinApplicationValues(values, now), {})
})
test('malformed/future birthdays, unsupported parts, malformed phone numbers and oversize copy are rejected', () => {
  for (const birth_date of ['2026-02-29', '2099-01-01', '10.1.1']) assert.ok(model.validateJoinApplicationValues({ ...values, birth_date }, now).birth_date)
  assert.ok(model.validateJoinApplicationValues({ ...values, desired_parts: ['admin'] }, now).desired_parts)
  assert.ok(model.validateJoinApplicationValues({ ...values, guardian_phone: 'abc123456789' }, now).guardian_phone)
  assert.ok(model.validateJoinApplicationValues({ ...values, motivation: 'a'.repeat(5001) }, now).motivation)
})
test('the RPC payload includes separate answers, deduplicated parts and stable submission identity', () => {
  const payload = model.buildJoinApplicationPayload(values, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002')
  assert.deepEqual(payload.p_desired_parts, ['soprano','alto'])
  assert.equal(payload.p_applicant_phone, '01012345678')
  assert.equal(payload.p_guardian_phone, '021234567')
  assert.equal(payload.p_privacy_agreed, true)
  assert.equal(payload.p_submission_id, '00000000-0000-4000-8000-000000000002')
  assert.equal(payload.p_school, '테스트학교')
  assert.equal(payload.p_grade, '2학년')
  assert.equal(payload.p_gender, 'not_specified')
  assert.equal(payload.p_department, null)
  assert.equal(Object.hasOwn(payload, 'photo_file'), false)
})
test('department belongs only to a university and is optional', () => {
  const build = values => model.buildJoinApplicationPayload(values, 'guide', 'request')
  assert.equal(build({ ...values, department: '음악학과' }).p_department, null)
  assert.equal(build({ ...values, school_level: 'university', department: ' 음악학과 ' }).p_department, '음악학과')
  assert.deepEqual(model.validateJoinApplicationValues({ ...values, school_level: 'university' }, now), {})
  assert.ok(model.validateJoinApplicationValues({ ...values, school_level: 'university', department: 'a'.repeat(121) }, now).department)
})
test('file validation gives per-field guidance for format, empty, and oversized selections', () => {
  assert.equal(model.getJoinApplicationFileError(new File(['data'], '사진.JPG', { type: 'image/jpeg' }), 'photo'), undefined)
  assert.equal(model.getJoinApplicationFileError(new File(['data'], '추천서.pdf'), 'recommendation'), undefined)
  assert.match(model.getJoinApplicationFileError(new File(['data'], '사진.png', { type: 'text/html' }), 'photo'), /JPG 또는 PNG/)
  assert.match(model.getJoinApplicationFileError(new File([], '추천서.pdf'), 'recommendation'), /3MB/)
  assert.match(model.getJoinApplicationFileError(new File([new Uint8Array(2 * 1024 * 1024 + 1)], '사진.png'), 'photo'), /2MB/)
})
