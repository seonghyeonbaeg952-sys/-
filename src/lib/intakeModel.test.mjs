import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('./intakeModel.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const model = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
const contact = { name: '김테스트', email: 'fixture@example.test', phone: null, type: 'general', title: null, message: ' 원문\n  둘째 줄 ', privacy_agreed: true }
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0v8AAAAASUVORK5CYII='
const pledge = { name: '김테스트', email: 'fixture@example.test', phone: '010-1234-5678', address: '주소\n원문', amount: 10000, custom_amount: null, birth_date: null, gender: null, member_type: 'individual', depositor: null, pledge_date: '2026-09-17', signer_name: '서명 원문', signature_image_url: png, privacy_agreed: true }

test('contact validation preserves exact original text and accepts all existing contact kinds', () => {
  const original = structuredClone(contact)
  for (const type of ['general', 'join', 'concert_request', 'support', 'other']) assert.equal(model.validateContactIntake({ ...contact, type }), null)
  assert.deepEqual(contact, original)
})

test('required fields, consent, strict payload keys, types and UTF-8 limits are enforced', () => {
  for (const value of [null, [], { ...contact, name: '' }, { ...contact, message: '  ' }, { ...contact, privacy_agreed: false }, { ...contact, privacy_agreed: 'true' }, { ...contact, email: 'bad' }, { ...contact, status: 'answered' }, { ...contact, admin_note: 'x' }, { ...contact, type: 'admin' }, { ...contact, name: '가'.repeat(134) }, { ...contact, message: '가'.repeat(7000) }, { ...contact, phone: {} }, Object.assign(Object.create({ admin_note: 'x' }), contact)]) assert.ok(model.validateContactIntake(value), JSON.stringify(value)?.slice(0, 100))
  assert.equal(model.validateContactIntake({ ...contact, name: '가'.repeat(100), message: '가'.repeat(5000) }), null)
})

test('pledges preserve optional fields and bitmap, reject malformed amounts, enums, dates and signatures', () => {
  assert.equal(model.validateSupportIntake(pledge), null)
  assert.equal(model.validateSupportIntake({ ...pledge, signature_image_url: null, signer_name: null }), null)
  for (const change of [{ amount: 0 }, { amount: 1.5 }, { amount: 2147483648 }, { custom_amount: 5000 }, { amount: '10000' }, { gender: 'other' }, { member_type: 'unknown' }, { birth_date: '2026-02-30' }, { pledge_date: 'infinity' }, { signature_image_url: 'https://example.test/sign.png' }, { signature_image_url: 'data:image/svg+xml;base64,PHN2Zz4=' }, { signature_image_url: 'data:image/png;base64,ZmFrZQ==' }, { signature_image_url: png + 'AAAA' }, { signature_image_url: 'data:image/png;base64,' + 'A'.repeat(200001) }, { status: 'accepted' }, { phone: '1' }]) assert.ok(model.validateSupportIntake({ ...pledge, ...change }), JSON.stringify(change).slice(0, 80))
  assert.equal(model.validateSupportIntake({ ...pledge, custom_amount: 10000 }), null)
})

test('standard submission UUIDs differ from historical PostgreSQL guide UUIDs', () => {
  assert.equal(model.isSubmissionId('11111111-1111-4111-8111-111111111111'), true)
  assert.equal(model.isSubmissionId('00000000-0000-0000-0000-000000000401'), false)
  assert.equal(model.isSettingsId('00000000-0000-0000-0000-000000000401'), true)
})

test('an in-memory tracker reuses exact retries, separates changed payloads and resets only on a new submission', () => {
  let next = 0
  const tracker = model.createIntakeSubmissionTracker(() => `11111111-1111-4111-8111-${String(++next).padStart(12, '0')}`)
  const first = tracker.idFor(contact)
  assert.equal(tracker.idFor({ ...contact }), first)
  assert.equal(tracker.idFor(Object.fromEntries(Object.entries(contact).reverse())), first)
  assert.notEqual(tracker.idFor({ ...contact, message: '변경' }), first)
  assert.equal(tracker.idFor(contact), first)
  tracker.reset()
  assert.notEqual(tracker.idFor(contact), first)
  assert.throws(() => model.createIntakeSubmissionTracker(() => 'not-a-uuid').idFor(contact))
})
