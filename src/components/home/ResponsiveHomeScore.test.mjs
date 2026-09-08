import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', cacheDir: 'node_modules/.vite-concert-spirit-test', configFile: false, plugins: [react()], logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
let ResponsiveHomeScore
try {
  ;({ ResponsiveHomeScore } = await vite.ssrLoadModule('/src/components/home/ResponsiveHomeScore.tsx'))
} catch {}
const { ScrollScoreBookReveal } = await vite.ssrLoadModule('/src/components/home/ScrollScoreBookReveal.tsx')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')
const content = {
  ...HOME_CONTENT_DEFAULTS_V2.scoreBook,
  responsiveEyebrow: 'CMS 악보 라벨', responsiveTitle: 'CMS 교육 제목\nCMS 제목 둘째 줄',
  responsiveLeftTitle: 'CMS 왼쪽 교육', responsiveLeftBody: 'CMS 왼쪽 본문',
  responsiveRightTitle: 'CMS 오른쪽 교육', responsiveRightBody: 'CMS 오른쪽 본문',
}
function renderAtWidth(Component, width) {
  const originalWindow = globalThis.window
  globalThis.window = { location: { pathname: '/' }, matchMedia(query) { return { matches: !query.includes('prefers-reduced-motion') && width >= Number(query.match(/min-width: (\d+)/)?.[1] ?? Infinity) } } }
  try { return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component, { content }))) }
  finally { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow }
}
test('mobile omits the redundant score section so concerts lead directly into spirit', () => {
  assert.equal(typeof ResponsiveHomeScore, 'function', 'responsive score presentation must be implemented')
  for (const width of [390, 639, 767]) assert.equal(renderAtWidth(ResponsiveHomeScore, width), '')
})
test('tablet exposes both CMS education columns without desktop score actions', () => {
  assert.equal(typeof ResponsiveHomeScore, 'function', 'responsive score presentation must be implemented')
  for (const width of [768, 834, 1023]) {
    const html = renderAtWidth(ResponsiveHomeScore, width)
    for (const copy of ['CMS 악보 라벨', 'CMS 교육 제목', 'CMS 제목 둘째 줄', 'CMS 왼쪽 교육', 'CMS 왼쪽 본문', 'CMS 오른쪽 교육', 'CMS 오른쪽 본문']) assert.ok(html.includes(copy), copy)
    assert.equal((html.match(/<article\b/g) ?? []).length, 2)
    assert.doesNotMatch(html, /SOPRANO|score-book-reveal|<a\b/)
  }
})
test('desktop score markup is the unchanged original and ignores responsive-only copy', () => {
  assert.equal(typeof ResponsiveHomeScore, 'function', 'responsive score presentation must be implemented')
  for (const width of [1024, 1440]) {
    const html = renderAtWidth(ResponsiveHomeScore, width)
    assert.equal(html, renderAtWidth(ScrollScoreBookReveal, width))
    assert.doesNotMatch(html, /CMS 악보 라벨|CMS 왼쪽 본문/)
  }
})
