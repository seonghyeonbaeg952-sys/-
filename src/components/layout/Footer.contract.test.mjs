import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const footerSource = await readFile(new URL('./Footer.tsx', import.meta.url), 'utf8')
const footerCss = await readFile(
  new URL('../../styles/footer-utility.css', import.meta.url),
  'utf8',
)

test('simple utility footer keeps the approved functional groups', () => {
  for (const label of [
    'EXPLORE',
    'TAKE PART',
    'CONNECT',
    'CONTACT',
    '관리자 로그인',
    '페이지 맨 위로 이동',
  ]) {
    assert.match(footerSource, new RegExp(label))
  }
})

test('public footer shows configured email as text and omits fax or mail action', () => {
  assert.match(footerSource, /settings\.email/)
  assert.match(footerSource, /이메일/)
  assert.doesNotMatch(footerSource, /settings\.fax|FAX|mailto:/)
})

test('footer links and controls keep minimum touch targets', () => {
  assert.match(footerCss, /\.footer-utility__link[^}]*min-height:\s*44px/s)
  assert.match(footerCss, /\.footer-utility__action[^}]*min-height:\s*52px/s)
  assert.match(footerCss, /\.footer-utility__top-button[^}]*min-height:\s*48px/s)
})

test('legacy decorative footer layers are disabled for utility footer', () => {
  assert.match(
    footerCss,
    /\.site-footer\.site-footer--utility::before,[\s\S]*content:\s*none\s*!important/,
  )
  assert.doesNotMatch(footerSource, /StaffDivider|StaffLines|SponsorLogoCard|score-ribbon/)
})

test('footer begins with the muted orange separator', () => {
  assert.match(
    footerCss,
    /border-top:\s*1px solid var\(--footer-utility-orange\)/,
  )
  assert.match(footerCss, /--footer-utility-orange:\s*#c65d40/)
})
