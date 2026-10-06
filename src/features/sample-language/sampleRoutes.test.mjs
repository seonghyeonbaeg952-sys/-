import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

// Server rendering verifies component output, not visual fit or browser motion.
const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-sample-route-test', logLevel: 'silent', server: { middlewareMode: true } })
const previousWindow = globalThis.window
after(async () => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; await vite.close() })
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { createEditorLanguagePresentation } = await vite.ssrLoadModule('/src/components/site-editor/siteEditorLanguagePresentation.ts')
const { getEditorDevice } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
const model = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')

const routes = [
  ['/', 'pages/sample/HomeV4SamplePage.tsx', 'HomeV4ProductionPage'],
  ['/spirit', 'pages/public/SpiritPage.tsx', 'SpiritPage'],
  ['/about?section=all', 'pages/public/AboutPage.tsx', 'AboutPage'],
  ['/about?section=overview', 'pages/public/AboutPage.tsx', 'AboutPage'],
  ['/about?section=conductor', 'pages/public/AboutPage.tsx', 'AboutPage'],
  ['/about?section=accompanist', 'pages/public/AboutPage.tsx', 'AboutPage'],
  ['/about?section=members', 'pages/public/AboutPage.tsx', 'AboutPage'],
  ['/about?section=history', 'pages/public/AboutPage.tsx', 'AboutPage'],
  ['/concerts?filter=upcoming', 'pages/public/ConcertsPage.tsx', 'ConcertsPage'],
  ['/notices', 'pages/public/NoticesPage.tsx', 'NoticesPage'],
  ['/gallery?tab=photos', 'pages/public/GalleryPage.tsx', 'GalleryPage'],
  ['/join', 'pages/public/JoinPage.tsx', 'JoinPage'],
  ['/contact?section=support', 'pages/public/ContactPage.tsx', 'ContactPage'],
]
const components = new Map()
for (const [, file, name] of routes) if (!components.has(name)) components.set(name, (await vite.ssrLoadModule(`/src/${file}`))[name])

function render(path, Component, width, language, sample = true) {
  const url = new URL(`${sample ? '/sample' : ''}${path}`, 'http://127.0.0.1:5175')
  if (sample) url.searchParams.set('lang', language)
  globalThis.window = {
    location: url, innerWidth: width, innerHeight: 900, scrollY: 0,
    addEventListener() {}, removeEventListener() {},
    matchMedia: query => ({ matches: !query.includes('prefers-reduced-motion')
      && (!query.includes('min-width') || width >= Number(query.match(/min-width:\s*(\d+)/)?.[1] ?? 0))
      && (!query.includes('max-width') || width <= Number(query.match(/max-width:\s*(\d+)/)?.[1] ?? Infinity)) }),
  }
  window.parent = window
  const enabled = sample || language === 'en'
  const context = { enabled, isSample: sample, language, setLanguage() {}, translate: enabled && language === 'en' ? translateEnglish : value => value,
    translateData: value => enabled && language === 'en' ? model.translateDisplayData(value, translateEnglish) : value,
    translateHome: value => value, href: value => model.publicLanguageHref(value, language, sample) }
  // These assertions cover ready page markup/media, not the transport lifecycle.
  // The actual shared production presentation is used; first-read loading,
  // failure and retry are tested separately in the provider/browser flow.
  const device = getEditorDevice(width)
  const presentation = createEditorLanguagePresentation({}, {}, context, device)
  const editor = { copy: presentation.copy, documents: {}, sourceDocuments: {}, device, isPreview: false }
  return renderToStaticMarkup(createElement(MemoryRouter, { basename: sample ? '/sample' : '/', initialEntries: [`${url.pathname}${url.search}${url.hash}`] },
    createElement(SampleLanguageContext, { value: presentation.languageContext }, createElement(SiteEditorContext, { value: editor }, createElement(Component)))))
}

function objectSignatures(html) {
  return [...html.matchAll(/<(img|svg|path|canvas)\b([^>]*)>/g)].map(([, tag, attrs]) => [tag,
    [...attrs.matchAll(/\b(src|srcSet|viewBox|d|width|height)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
  ])
}

for (const width of [390, 768, 1440]) {
  for (const [path, , name] of routes) test(`${width}px SSR ${path}: both languages render without replacing images, vector objects or canvases`, () => {
    const Component = components.get(name)
    const korean = render(path, Component, width, 'ko')
    const english = render(path, Component, width, 'en')
    assert.ok(korean.length > 300)
    assert.ok(english.length > 300)
    assert.notEqual(korean, english)
    assert.deepEqual(objectSignatures(english), objectSignatures(korean))
    assert.doesNotMatch(english, /\/sample\/sample\//)
    assert.doesNotMatch(english, /(?:>undefined<|>NaN<|>\[object Object\]<)/)
  })
}

test('original home and sample Korean keep the same photographic and decorative objects', () => {
  const Component = components.get('HomeV4ProductionPage')
  assert.deepEqual(objectSignatures(render('/', Component, 1440, 'ko')), objectSignatures(render('/', Component, 1440, 'ko', false)))
})

test('original English About route translates navigation without moving images to the sample', () => {
  const Component = components.get('AboutPage')
  const korean = render('/about?section=history', Component, 1440, 'ko', false)
  const english = render('/about?section=history', Component, 1440, 'en', false)
  assert.match(english, />History<\/span>|>History<\/a>/)
  assert.doesNotMatch(english, /\/sample\/about/)
  assert.deepEqual(objectSignatures(english), objectSignatures(korean))
})

for (const width of [390, 1440]) {
  for (const language of ['ko', 'en']) test(`${width}px ${language} About all keeps choir information without a duplicate location section`, () => {
    const html = render('/about?section=all', components.get('AboutPage'), width, language, false)
    assert.match(html, /href="\/about\?section=conductor/)
    assert.match(html, /href="\/about\?section=members/)
    assert.match(html, /href="\/about\?section=history/)
    assert.equal(/href="https:\/\/(?:map\.naver\.com|map\.kakao\.com)\//.test(html), false, 'About all must not show external directions links')
    assert.equal(/<h[23][^>]*>(?:오시는 길|Location)<\/h[23]>/.test(html), false, 'About all must not show a location heading')
  })
}
