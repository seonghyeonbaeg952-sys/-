import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('legacy application bookmarks use the same new admission form without rendering the old form', () => {
  const source = readFileSync(new URL('./ContactPage.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /JoinInquiryForm/)
  assert.match(source, /searchParams\.get\('section'\) === 'join'/)
  assert.match(source, /<Navigate replace to="\/join\?section=contact#application"/)
  assert.match(source, /<ContactContent\s*\/>/)
})
