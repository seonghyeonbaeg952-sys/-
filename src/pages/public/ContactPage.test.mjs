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

test('legacy support inquiry bookmarks still open the inquiry form', () => {
  const source = readFileSync(new URL('./ContactPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /searchParams\.get\('section'\) === 'support' && route\.hash === '#form'/)
  assert.match(source, /<Navigate replace to="\/contact\?section=inquiry&type=support#form"/)
})

test('contact anchors are restored after public data loads and hidden forms do not claim the anchor', () => {
  const page = readFileSync(new URL('./ContactPage.tsx', import.meta.url), 'utf8')
  const form = readFileSync(new URL('../../components/contact/ContactInquiryForm.tsx', import.meta.url), 'utf8')
  assert.match(page, /if \(!ready \|\| !route\.hash\) return/)
  assert.match(page, /scrollIntoView/)
  assert.match(page, /\[ready, route\.hash, activeSection\]/)
  assert.match(form, /id=\{hidden \? undefined : 'form'\}/)
})
