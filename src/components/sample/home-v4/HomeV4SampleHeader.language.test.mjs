import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-sample-header-language-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { sampleLanguageHref } = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
const { HomeV4SampleHeader } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4SampleHeader.tsx')
const { HomeV4SampleMegaMenu } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4SampleMegaMenu.tsx')
const { HomeV4SampleMobileMenu } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4SampleMobileMenu.tsx')
const { Footer } = await vite.ssrLoadModule('/src/components/layout/Footer.tsx')
const { publicNavigation } = await vite.ssrLoadModule('/src/constants/navigation.ts')

function render(Component, props = {}, { enabled = true, language = 'en' } = {}) {
  const originalWindow = globalThis.window
  globalThis.window = { scrollY: 0 }
  const translate = (source, key) => enabled && language === 'en' ? translateEnglish(source, key) : source
  try {
    return renderToStaticMarkup(React.createElement(MemoryRouter, {
      basename: enabled ? '/sample' : undefined, initialEntries: [enabled ? '/sample/about?lang=en' : '/about'],
    }, React.createElement(SampleLanguageContext, { value: {
      enabled, isSample: enabled, language, setLanguage() {}, translate, translateData: value => value, translateHome: value => value,
      href: href => enabled ? sampleLanguageHref(href, language) : href,
    } }, React.createElement(SiteEditorContext, { value: {
      copy: (_page, key, source) => translate(source, key), documents: {}, device: 'desktop', isPreview: false,
    } }, React.createElement(Component, props)))))
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
}

const hrefs = html => [...html.matchAll(/href="([^"]*)"/g)].map(match => match[1].replaceAll('&amp;', '&'))

test('original header keeps original destinations and has no language controls', () => {
  const html = render(HomeV4SampleHeader, { mode: 'production' }, { enabled: false })
  assert.ok(hrefs(html).includes('/'))
  assert.ok(hrefs(html).includes('/join?section=contact#application'))
  assert.doesNotMatch(html, /sample-language-switch|lang=en/)
})

test('sample header offers named language buttons and keeps its native links inside the sample', () => {
  const html = render(HomeV4SampleHeader, { mode: 'production' })
  assert.match(html, /aria-label="한국어" aria-pressed="false"/)
  assert.match(html, /aria-label="English" aria-pressed="true"/)
  assert.ok(hrefs(html).includes('/sample/?lang=en'))
  assert.ok(hrefs(html).includes('/sample/join?section=contact&lang=en#application'))
})

test('every mega-menu and mobile menu link keeps its query, fragment and language', () => {
  const menu = publicNavigation.find(item => item.href === '/spirit')
  const mega = render(HomeV4SampleMegaMenu, { id: 'desktop', item: { ...menu, label: 'Our Spirit' }, onMouseEnter() {}, onMouseLeave() {}, onNavigate() {}, routePrefix: '' })
  const mobile = render(HomeV4SampleMobileMenu, { id: 'mobile', onNavigate() {}, routePrefix: '' })
  assert.match(mega, /aria-label="Our Spirit menu"/)
  for (const href of [...hrefs(mega), ...hrefs(mobile)]) {
    assert.ok(href.startsWith('/sample/'), href)
    assert.equal(new URL(href, 'https://sample.invalid').searchParams.get('lang'), 'en')
    assert.ok(!href.includes('/sample/sample'), href)
  }
  assert.ok(hrefs(mega).includes('/sample/spirit?lang=en#spirit-faith'))
  assert.ok(hrefs(mobile).includes('/sample/join?section=contact&lang=en#application'))
})

test('sample footer localises router links once and leaves admin outside the sample', () => {
  const html = render(Footer)
  const internal = hrefs(html).filter(href => href.startsWith('/'))
  assert.ok(internal.includes('/admin/login'))
  for (const href of internal.filter(href => href !== '/admin/login')) {
    assert.ok(href.startsWith('/sample'), href)
    assert.ok(!href.includes('/sample/sample'), href)
    assert.equal(new URL(href, 'https://sample.invalid').searchParams.get('lang'), 'en')
  }
})
