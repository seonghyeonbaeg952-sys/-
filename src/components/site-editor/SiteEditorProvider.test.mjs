import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { createProviderHarness } from './siteEditorProviderHarness.test-utils.mjs'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-editor-provider-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorProvider } = await vite.ssrLoadModule('/src/components/site-editor/SiteEditorProvider.tsx')
const { SiteCopy } = await vite.ssrLoadModule('/src/components/site-editor/SiteCopy.tsx')
const { useSiteEditor } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
const { SampleLanguageSwitch } = await vite.ssrLoadModule('/src/features/sample-language/SampleLanguageSwitch.tsx')

const englishContext = {
  enabled: true, isSample: false, language: 'en', setLanguage: () => {},
  translate: value => value, translateData: value => value,
  translateHome: value => value, href: value => value,
}

test('the route bootstrap loader follows an explicit English URL without translating admin loading', async () => {
  const { RouteFallback } = await vite.ssrLoadModule('/src/App.tsx')
  const previous = globalThis.window
  try {
    globalThis.window = { location: { pathname: '/spirit', search: '?lang=en' } }
    const english = renderToStaticMarkup(React.createElement(RouteFallback))
    assert.ok(english.includes('Preparing the page'))
    assert.ok(!english.includes('페이지를 준비하고 있습니다'))
    globalThis.window = { location: { pathname: '/admin/editor', search: '?lang=en' } }
    const admin = renderToStaticMarkup(React.createElement(RouteFallback))
    assert.ok(admin.includes('관리자 화면을 불러오고 있습니다'))
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('first English paint waits for published copy instead of showing an obsolete default heading', () => {
  const child = React.createElement('main', null, React.createElement('h1', null, 'Obsolete default heading'))
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/spirit?lang=en'] },
    React.createElement(SampleLanguageContext, { value: englishContext }, React.createElement(SiteEditorProvider, null, child))))
  assert.ok(html.includes('role="status"'))
  assert.ok(html.includes('aria-busy="true"'))
  assert.ok(!html.includes('Obsolete default heading'))
})

test('Korean first mount waits for the source publication instead of painting its obsolete fallback', async () => {
  let finish
  const child = React.createElement('h1', null, React.createElement(SiteCopy, { page: 'spirit', id: 'spirit.spiritHero.text2', fallback: '이전 기본 제목' }))
  const h = await createProviderHarness(vite, { children: child, sourceApi: () => new Promise(resolve => { finish = resolve }) })
  try {
    assert.match(h.markup(), /aria-busy="true"/)
    assert.doesNotMatch(h.markup(), /이전 기본 제목/)
    finish({ data: [{ page_key: 'spirit', document: { schemaVersion: 1, copy: { 'spirit.spiritHero.text2': '최신 게시 제목' }, deviceCopy: {}, appearance: {} } }], error: null })
    await h.settle()
    assert.match(h.markup(), /최신 게시 제목/)
    assert.doesNotMatch(h.markup(), /aria-busy="true"|이전 기본 제목/)
  } finally { finish({ data: [], error: null }); await h.settle(); h.destroy() }
})

test('failed Korean reads expose a Korean retry notice and recover without requesting English resources', async () => {
  let successful = false
  const child = React.createElement(MemoryRouter, null, React.createElement('main', null,
    React.createElement(SiteCopy, { page: 'spirit', id: 'spirit.spiritHero.text2', fallback: '사용 가능한 원문' }), React.createElement(SampleLanguageSwitch)))
  const h = await createProviderHarness(vite, { children: child, sourceApi: async () => successful
    ? { data: [{ page_key: 'spirit', document: { schemaVersion: 1, copy: { 'spirit.spiritHero.text2': '복구된 게시 제목' }, deviceCopy: {}, appearance: {} } }], error: null }
    : { data: null, error: 'offline' }, englishApi: async () => { assert.fail('Korean read must not request English publication') } })
  try {
    await h.settle()
    assert.match(h.markup(), /사용 가능한 원문/)
    assert.match(h.markup(), /일부 게시 문구를 불러오지 못했습니다/)
    assert.doesNotMatch(h.markup(), /Some English content/)
    successful = true
    h.languageContext.retryContent()
    h.render()
    assert.equal(h.languageContext.contentRetrying, true)
    assert.doesNotMatch(h.markup(), /aria-busy="true"/)
    await h.settle()
    assert.equal(h.languageContext.contentRetrying, false)
    assert.equal(h.languageContext.contentError, false)
    assert.deepEqual(h.invalidations, { source: 1, english: 0, records: 0 })
    assert.match(h.markup(), /복구된 게시 제목/)
    assert.doesNotMatch(h.markup(), /일부 게시 문구를 불러오지 못했습니다/)
  } finally { h.destroy() }
})

test('a later source refresh failure keeps the already published Korean copy mounted', async () => {
  let failed = false
  const fixture = { schemaVersion: 1, copy: { 'spirit.spiritHero.text2': '유지할 게시 제목' }, deviceCopy: {}, appearance: {} }
  const h = await createProviderHarness(vite, { children: React.createElement(SiteCopy, { page: 'spirit', id: 'spirit.spiritHero.text2', fallback: '이전 기본 제목' }),
    sourceApi: async () => failed ? { data: null, error: 'offline' } : { data: [{ page_key: 'spirit', document: structuredClone(fixture) }], error: null } })
  try {
    await h.settle()
    const firstDocuments = h.editorContext.documents
    h.focus(); await h.settle()
    assert.equal(h.editorContext.documents, firstDocuments)
    failed = true; h.focus(); await h.settle()
    assert.match(h.markup(), /유지할 게시 제목/)
    assert.doesNotMatch(h.markup(), /이전 기본 제목|aria-busy="true"/)
    assert.equal(h.languageContext.contentError, true)
  } finally { h.destroy() }
})

for (const language of ['ko', 'en']) {
  test(`${language} publication ignores an older response that arrives after a newer refresh`, async () => {
    const reads = []
    const delayed = () => new Promise(resolve => { reads.push(resolve) })
    const child = React.createElement(SiteCopy, { page: 'spirit', id: 'spirit.spiritHero.text2', fallback: '기본 문구' })
    const h = await createProviderHarness(vite, {
      language, children: child,
      sourceApi: language === 'ko' ? delayed : async () => ({ data: [], error: null }),
      englishApi: language === 'en' ? delayed : async () => ({ data: [], error: null }),
    })
    const publication = text => ({ data: [{ page_key: 'spirit', document: {
      schemaVersion: 1, copy: { 'spirit.spiritHero.text2': text }, deviceCopy: {}, appearance: {},
    } }], error: null })
    try {
      h.focus()
      assert.equal(reads.length, 2)
      reads[1](publication('Newest published heading'))
      await h.settle()
      assert.match(h.markup(), /Newest published heading/)
      reads[0](publication('Older published heading'))
      await h.settle()
      assert.match(h.markup(), /Newest published heading/)
      assert.doesNotMatch(h.markup(), /Older published heading/)
    } finally { reads.forEach(resolve => resolve(publication('Cleanup'))); await h.settle(); h.destroy() }
  })
}

test('switching languages waits for the separate English publication without hiding the loaded Korean page on return', async () => {
  let finishEnglish
  const englishPublication = new Promise(resolve => { finishEnglish = resolve })
  const fixture = text => ({ schemaVersion: 1, copy: { 'spirit.spiritHero.text2': text }, deviceCopy: {}, appearance: {} })
  const h = await createProviderHarness(vite, {
    children: React.createElement(SiteCopy, { page: 'spirit', id: 'spirit.spiritHero.text2', fallback: '이전 기본 제목' }),
    sourceApi: async () => ({ data: [{ page_key: 'spirit', document: fixture('최신 한국어 제목') }], error: null }),
    englishApi: () => englishPublication,
  })
  try {
    await h.settle()
    assert.match(h.markup(), /최신 한국어 제목/)
    h.setLanguage('en')
    assert.match(h.markup(), /aria-busy="true"/)
    assert.doesNotMatch(h.markup(), /최신 한국어 제목|이전 기본 제목/)
    h.setLanguage('ko')
    assert.match(h.markup(), /최신 한국어 제목/)
    assert.doesNotMatch(h.markup(), /aria-busy="true"/)
    finishEnglish({ data: [{ page_key: 'spirit', document: fixture('Published English heading') }], error: null })
    await h.settle()
    h.setLanguage('en'); await h.settle()
    assert.match(h.markup(), /Published English heading/)
    assert.doesNotMatch(h.markup(), /최신 한국어 제목|이전 기본 제목|aria-busy="true"/)
  } finally { finishEnglish?.({ data: [], error: null }); await h.settle(); h.destroy() }
})

test('Korean CMS preview still accepts its connected draft before public documents have loaded', () => {
  const previous = globalThis.window
  try {
    globalThis.window = { innerWidth: 1440, innerHeight: 900, parent: {}, matchMedia: () => ({ matches: false }) }
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/spirit?lang=ko&site-editor-preview=12345678-1234-4234-8234-123456789012'] },
      React.createElement(SiteEditorProvider, null, React.createElement('main', null, '연결된 한국어 초안'))))
    assert.match(html, /연결된 한국어 초안|초안 미리보기/)
    assert.doesNotMatch(html, /게시 문구를 불러오고 있습니다|aria-busy="true"/)
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('English CMS preview can accept its draft immediately without waiting for public publication', () => {
  const previous = globalThis.window
  try {
    globalThis.window = { innerWidth: 1440, innerHeight: 900, parent: {}, matchMedia: () => ({ matches: false }) }
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/spirit?lang=en&site-editor-preview=12345678-1234-4234-8234-123456789012'] },
      React.createElement(SampleLanguageContext, { value: { ...englishContext, contentLoading: true } },
        React.createElement(SiteEditorProvider, null, React.createElement('main', null, 'Connected English draft')))))
    assert.ok(html.includes('Connected English draft'))
    assert.ok(!html.includes('Loading the English page'))
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('published copy and placement use the same phone/tablet composition after landscape rotation', async () => {
  function Device() { return React.createElement('output', null, useSiteEditor().device) }
  for (const [width, height, coarsePointer, expected] of [
      [390, 844, true, 'mobile'], [844, 390, true, 'mobile'],
      [768, 1024, true, 'tablet'], [1180, 820, true, 'tablet'],
      [1440, 900, false, 'desktop'],
  ]) {
    const h = await createProviderHarness(vite, { width, height, coarsePointer, children: React.createElement(Device) })
    try { await h.settle(); assert.equal(h.markup(), `<output>${expected}</output>`, `${width}×${height}`) }
    finally { h.destroy() }
  }
})

test('CMS previews keep the explicit width-based editing device even with tablet touch input', () => {
  const previous = globalThis.window
  function Device() { return React.createElement('output', null, useSiteEditor().device) }
  try {
    for (const [width, height, expected] of [[390, 844, 'mobile'], [768, 1024, 'tablet'], [1440, 900, 'desktop']]) {
      globalThis.window = { innerWidth: width, innerHeight: height, parent: {}, matchMedia: () => ({ matches: true }) }
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/spirit?site-editor-preview=12345678-1234-4234-8234-123456789012'] }, React.createElement(SiteEditorProvider, null, React.createElement(Device))))
      assert.ok(html.includes(`<output>${expected}</output>`), `${width}×${height}`)
    }
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('a settled empty publication preserves the original public DOM without a wrapper, style or inert state', async () => {
  const child = React.createElement('main', { id: 'original' }, React.createElement('h1', null, '기존 홈페이지'), React.createElement('button', { type: 'button' }, '기존 동작'))
  const original = renderToStaticMarkup(child)
  const h = await createProviderHarness(vite, { path: '/join', children: child })
  try { await h.settle(); assert.equal(h.markup(), original) } finally { h.destroy() }
})

test('public copy defaults keep literal whitespace and inline markup without adding DOM elements', async () => {
  const child = React.createElement('p', null, '앞 ', React.createElement(SiteCopy, { page: 'common', id: 'common.test', fallback: '원문' }), ' 뒤')
  const h = await createProviderHarness(vite, { path: '/', children: child })
  try { await h.settle(); assert.equal(h.markup(), '<p>앞 원문 뒤</p>') } finally { h.destroy() }
})

test('administrator routes remain independent of all public editor presentation', () => {
  const child = React.createElement('main', null, '관리자')
  assert.equal(renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/admin'] }, React.createElement(SiteEditorProvider, null, child))), '<main>관리자</main>')
})

test('unchanged copy preserves original literal newlines rather than introducing new line-break elements', () => {
  const child = React.createElement(SiteCopy, { page: 'common', id: 'common.test', fallback: '기존\n원문' })
  assert.equal(renderToStaticMarkup(child), '기존\n원문')
})
