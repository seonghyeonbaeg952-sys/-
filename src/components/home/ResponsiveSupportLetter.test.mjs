import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', cacheDir: 'node_modules/.vite-support-fidelity-test', configFile: false, plugins: [react()], logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SupportLetterFold } = await vite.ssrLoadModule('/src/components/home/SupportLetterFold.tsx')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')
const content = {
  ...HOME_CONTENT_DEFAULTS_V2.supportLetter,
  responsiveTitle: 'CMS 반응형 후원 제목', responsiveMobileDescription: 'CMS 모바일 설명', responsiveTabletDescription: 'CMS 태블릿 설명',
  responsiveMobilePledgeDescription: 'CMS 모바일 문의 안내', responsiveTabletPledgeDescription: 'CMS 태블릿 문의 안내',
  responsiveTabletEyebrow: 'CMS 태블릿 라벨', responsiveUse1: 'CMS 첫 번째 용도', responsiveUse2: 'CMS 두 번째 용도', responsiveUse3: 'CMS 세 번째 용도',
  primaryCtaLabel: 'CMS 후원 신청', secondaryCtaLabel: 'DESKTOP_SECONDARY', description: 'DESKTOP_DESCRIPTION',
  pledgeTitle: 'CMS 문의 제목', pledgeEyebrow: 'CMS 문의 라벨', eyebrowEn: 'CMS 모바일 라벨',
}
function renderAtWidth(width, approvedResponsive = true) {
  const originalWindow = globalThis.window
  globalThis.window = { location: { pathname: '/' }, matchMedia(query) { return { matches: width >= Number(query.match(/min-width: (\d+)/)?.[1] ?? Infinity) } } }
  try { return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SupportLetterFold, { content, approvedResponsive, settings: { phone: 'DESKTOP_PHONE', address: 'DESKTOP_ADDRESS' } }))) }
  finally { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow }
}
test('mobile support has one actual support form action, editable copy, and uses outside its letter', () => {
  const html = renderAtWidth(390)
  assert.match(html, /id="home-responsive-support"/)
  for (const text of ['CMS 반응형 후원 제목', 'CMS 모바일 설명', 'CMS 모바일 문의 안내', 'CMS 후원 신청', 'CMS 문의 제목', 'CMS 문의 라벨', 'CMS 모바일 라벨', 'CMS 첫 번째 용도', 'CMS 두 번째 용도', 'CMS 세 번째 용도']) assert.ok(html.includes(text), text)
  assert.equal((html.match(/<a\b/g) ?? []).length, 1)
  assert.match(html, /href="\/contact\?section=support#form"/)
  assert.ok(html.indexOf('</article>') < html.indexOf('home-responsive-support__uses'))
  assert.doesNotMatch(html, /CMS 태블릿|DESKTOP_|배움의 기초|정직한 음악/)
})
test('tablet support puts three editable uses inside the letter and excludes mobile-only copy', () => {
  for (const width of [768, 834, 1023]) {
    const html = renderAtWidth(width)
    assert.match(html, /id="home-responsive-support"/)
    for (const text of ['CMS 태블릿 설명', 'CMS 태블릿 문의 안내', 'CMS 태블릿 라벨', 'CMS 첫 번째 용도', 'CMS 두 번째 용도', 'CMS 세 번째 용도']) assert.ok(html.includes(text), text)
    assert.equal((html.match(/<a\b/g) ?? []).length, 1)
    assert.ok(html.indexOf('home-responsive-support__uses') < html.indexOf('</article>'))
    assert.doesNotMatch(html, /CMS 모바일|DESKTOP_/)
  }
})
test('desktop support and non-approved presentations retain original markup and settings', () => {
  for (const width of [1024, 1440]) {
    const html = renderAtWidth(width)
    assert.equal(html, renderAtWidth(width, false))
    assert.match(html, /DESKTOP_PHONE|DESKTOP_ADDRESS/)
    assert.doesNotMatch(html, /home-responsive-support|CMS 반응형 후원 제목/)
  }
  assert.doesNotMatch(renderAtWidth(390, false), /home-responsive-support/)
})
