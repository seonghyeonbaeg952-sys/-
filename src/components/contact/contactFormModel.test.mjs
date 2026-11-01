import assert from 'node:assert/strict'
import { test } from 'node:test'

const model = await import('./contactFormModel.ts').catch((error) => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {}
  throw error
})
const valid = { name: ' 김후원 ', email: ' reply@example.com ', phone: '', title: '', message: '첫 문단\n\n둘째 문단', privacy_agreed: true, type: 'support', website: '' }

test('contact navigation preserves old sections and chooses an appropriate inquiry type', () => {
  assert.equal(typeof model.getContactSection, 'function')
  assert.equal(model.getContactSection('support'), 'support')
  assert.equal(model.getContactSection('inquiry'), 'inquiry')
  assert.equal(model.getContactSection('unknown'), 'all')
  assert.equal(model.getInitialInquiryType('performance'), 'concert_request')
  assert.equal(model.getInitialInquiryType('support'), 'support')
})

test('contact validation rejects missing answers, malformed email and absent consent', () => {
  assert.equal(typeof model.validateContactForm, 'function')
  assert.deepEqual(Object.keys(model.validateContactForm({ ...valid, name: ' ', email: 'bad', message: '', privacy_agreed: false })).sort(), ['email', 'message', 'name', 'privacy_agreed'])
  assert.deepEqual(model.validateContactForm(valid), {})
})

test('optional phone and subject stay optional and unsupported inquiry types are rejected', () => {
  assert.equal(typeof model.validateContactForm, 'function')
  assert.deepEqual(model.validateContactForm({ ...valid, phone: '', title: '' }), {})
  assert.ok(model.validateContactForm({ ...valid, type: 'payment' }).type)
})

test('contact payload preserves multiline original copy and uses only existing input fields', () => {
  assert.equal(typeof model.buildContactMessageInput, 'function')
  assert.deepEqual(model.buildContactMessageInput(valid), { name: '김후원', email: 'reply@example.com', phone: null, title: null, message: '첫 문단\n\n둘째 문단', privacy_agreed: true, type: 'support', website: '' })
})

test('Korean support amounts use Arabic numbers and 만원 while preserving exact won values', () => {
  assert.equal(typeof model.formatSupportAmounts, 'function')
  assert.equal(model.formatSupportAmounts([10000, 20000, 30000, 50000]), '1만원 · 2만원 · 3만원 · 5만원')
  assert.equal(model.formatSupportAmounts([100000, 200000, 300000, 500000, 1000000]), '10만원 · 20만원 · 30만원 · 50만원 · 100만원')
  assert.equal(model.formatSupportAmounts([12000, 25000]), '12,000원 · 25,000원')
  assert.equal(model.formatSupportAmounts([0, 10001]), '0원 · 10,001원')
  assert.equal(model.formatSupportAmounts([]), '')
})
