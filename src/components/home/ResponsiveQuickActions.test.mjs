import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  cacheDir: 'node_modules/.vite-quick-test',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const { FloatingInfoCards } = await vite.ssrLoadModule(
  '/src/components/home/FloatingInfoCards.tsx',
)
const { normalizeHomeContentV2 } = await vite.ssrLoadModule('/src/lib/homeContent.ts')

after(() => vite.close())

const cms = {
  'home.quickActions.join.title': 'CMS 입단 제목',
  'home.quickActions.join.description': 'CMS 입단 상세 설명',
  'home.quickActions.join.ctaLabel': 'CMS 입단 별도 CTA',
  'home.quickActions.concert.title': 'CMS 공연 제목',
  'home.quickActions.support.title': 'CMS 후원 제목',
}

function render(width, values = cms, pathname = '/') {
  const originalWindow = globalThis.window
  globalThis.window = {
    location: { pathname },
    matchMedia: query => ({ matches: query === '(min-width: 1024px)' && width >= 1024 }),
  }
  try {
    const cards = normalizeHomeContentV2(values).quickActions.items
    return renderToStaticMarkup(createElement(FloatingInfoCards, { cards }))
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
}

for (const width of [390, 834, 1023]) {
  test(`${width}px quick menu keeps only CMS titles, codes and one real link per compact row`, () => {
    const html = render(width)
    for (const title of ['CMS 입단 제목', 'CMS 공연 제목', 'CMS 후원 제목']) {
      assert.ok(html.includes(title), title)
    }
    for (const code of ['JOIN', 'STAGE', 'CONNECT']) assert.ok(html.includes(code), code)
    assert.equal(html.match(/<a\b/g)?.length, 3)
    assert.match(html, /href="\/join"/)
    assert.match(html, /href="\/concerts"/)
    assert.match(html, /href="\/contact\?section=support#form"/)
    assert.doesNotMatch(html, /CMS 입단 상세 설명|CMS 입단 별도 CTA/)
  })
}

test('responsive rows preserve CMS visibility and reordered destinations without adding a placeholder', () => {
  const html = render(390, {
    ...cms,
    'home.quickActions.join.isVisible': 'false',
    'home.quickActions.support.displayOrder': '1',
    'home.quickActions.concert.displayOrder': '2',
  })
  assert.equal(html.match(/<a\b/g)?.length, 2)
  assert.doesNotMatch(html, /CMS 입단 제목|href="\/join"/)
  assert.ok(html.indexOf('CMS 후원 제목') < html.indexOf('CMS 공연 제목'))

  assert.equal(render(834, {
    'home.quickActions.join.isVisible': 'false',
    'home.quickActions.concert.isVisible': 'false',
    'home.quickActions.support.isVisible': 'false',
  }), '')
})

for (const width of [1024, 1440]) {
  test(`${width}px preserves the existing desktop card contents and presentation`, () => {
    const html = render(width)
    assert.ok(html.includes('CMS 입단 제목'))
    assert.ok(html.includes('CMS 입단 상세 설명'))
    assert.ok(html.includes('CMS 입단 별도 CTA'))
    assert.match(html, /home-quick-action-card group/)
    assert.doesNotMatch(html, /home-responsive-quick/)
  })
}

test('compact links preserve the existing sample-route prefix convention', () => {
  const html = render(390, cms, '/sample/home-v4')
  assert.match(html, /href="\/sample\/join"/)
  assert.match(html, /href="\/sample\/concerts"/)
  assert.match(html, /href="\/sample\/contact\?section=support#form"/)
})
