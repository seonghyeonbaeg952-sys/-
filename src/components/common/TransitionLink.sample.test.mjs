import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-sample-link-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { TransitionLink } = await vite.ssrLoadModule('/src/components/common/TransitionLink.tsx')
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
const { sampleLanguageHref } = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')

function renderHref(to, { enabled = true, language = 'en', entry = '/sample/about?section=history&lang=en#record', relative } = {}) {
  const value = {
    enabled, isSample: enabled, language, setLanguage() {}, translate: source => source,
    translateData: value => value, translateHome: value => value,
    href: href => enabled ? sampleLanguageHref(href, language) : href,
  }
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, {
    basename: enabled ? '/sample' : undefined, initialEntries: [entry],
  }, React.createElement(SampleLanguageContext, { value }, React.createElement(TransitionLink, { to, relative }, 'Follow link'))))
  return html.match(/href="([^"]*)"/)?.[1].replaceAll('&amp;', '&')
}

test('original-route link destinations remain unchanged', () => {
  assert.equal(renderHref('/join?section=contact#application', { enabled: false, entry: '/about?section=history' }), '/join?section=contact#application')
})

test('sample links keep their section and hash and set the selected language', () => {
  assert.equal(renderHref('/join?section=contact#application'), '/sample/join?section=contact&lang=en#application')
  assert.equal(renderHref('/gallery?tab=videos&lang=en', { language: 'ko' }), '/sample/gallery?tab=videos&lang=ko')
})

test('already-prefixed sample destinations never duplicate the router basename', () => {
  assert.equal(renderHref('/sample/gallery?tab=posters'), '/sample/gallery?tab=posters&lang=en')
  assert.equal(renderHref('/sample'), '/sample?lang=en')
  assert.equal(renderHref('/sample/'), '/sample?lang=en')
})

test('query-only and object destinations resolve within the sample router', () => {
  assert.equal(renderHref('?section=members'), '/sample/about?section=members&lang=en')
  assert.equal(renderHref({ pathname: '/concerts', search: '?filter=past', hash: '#archive' }), '/sample/concerts?filter=past&lang=en#archive')
})

test('hash-only links preserve the current filters and chosen language', () => {
  assert.equal(renderHref('#next'), '/sample/about?section=history&lang=en#next')
  assert.equal(renderHref({ hash: '#next' }, { language: 'ko' }), '/sample/about?section=history&lang=ko#next')
})

test('external, protocol-relative and contact destinations are not localised', () => {
  for (const target of ['https://example.org/music?lang=fr#notes', '//example.org/music', 'mailto:choir@example.org', 'tel:025797295']) {
    assert.equal(renderHref(target), target)
  }
})
