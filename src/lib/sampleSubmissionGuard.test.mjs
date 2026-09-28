import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getSampleSubmissionMessage } from './sampleSubmissionGuard.ts'

test('all sample visitor paths block live intake independently of language', () => {
  for (const path of ['/sample', '/sample/', '/sample/join', '/sample/contact']) {
    for (const kind of ['application', 'enquiry', 'pledge']) {
      assert.match(getSampleSubmissionMessage(kind, path), /샘플 화면입니다/)
    }
  }
})

test('original routes, similar prefixes and admin paths keep their current authority', () => {
  for (const path of ['/', '/join', '/contact', '/samples/join', '/sample-old/contact', '/admin', '/sample/admin', '/sample/admin/contacts']) {
    assert.equal(getSampleSubmissionMessage('application', path), null)
  }
})
