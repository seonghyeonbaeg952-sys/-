import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test, after } from 'node:test'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const model = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')
const contentModel = await vite.ssrLoadModule('/src/features/sample-language/sampleContentModel.ts')
const code = ts.transpileModule(await readFile(new URL('./SampleLanguageProvider.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText

function harness({ path = '/gallery', search = '', remembered = 'ko', publicRemembered = 'ko', isSample = true, preview = false, contentApi = async () => ({ data: [], error: null }) } = {}) {
  const slots = [], effects = [], navigations = [], writes = [], publicWrites = []
  let cursor = 0, output, saved = remembered, savedPublic = publicRemembered, location = { pathname: path, search, hash: '#archive' }
  const root = { lang: 'ko', attributes: new Map(), getAttribute(key) { return this.attributes.get(key) ?? null }, setAttribute(key, value) { this.attributes.set(key, value) }, removeAttribute(key) { this.attributes.delete(key) } }
  const effect = (fn, deps) => {
    const i = cursor++
    if (!slots[i] || deps.some((value, index) => !Object.is(value, slots[i].deps[index]))) {
      const previous = slots[i]
      slots[i] = { deps }
      effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn() })
    }
  }
  const navigate = (url, options) => {
    navigations.push({ url, options: { ...options } })
    const next = new URL(url, 'https://test.invalid')
    location = { pathname: next.pathname, search: next.search, hash: next.hash }
  }
  const dependencies = {
    react: { useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] }, useCallback: fn => fn, useMemo: fn => fn(), useEffect: effect, useLayoutEffect: effect, useSyncExternalStore: (_subscribe, get) => get() },
    'react-router': { useLocation: () => location, useNavigate: () => navigate },
    './useSampleLanguage': { SampleLanguageContext: 'sample-context' },
    './englishRegistry': { translateEnglish: value => `EN:${value}` },
    './sampleLanguageModel': model,
    './sampleLanguagePreference': { getSampleLanguagePreference: () => saved, subscribeSampleLanguage: () => () => {}, rememberSampleLanguage: next => { saved = next; writes.push(next) }, getPublicLanguagePreference: () => savedPublic, subscribePublicLanguage: () => () => {}, rememberPublicLanguage: next => { savedPublic = next; publicWrites.push(next) } },
    '../../lib/siteEditorPreview': { getActiveSiteEditorPreviewNonce: () => preview ? 'valid-initial-preview-nonce' : null },
    './sample-language.css': {},
    './sample-english-layout.css': {},
    './sampleContentModel': contentModel,
    './sampleContentApi': { loadPublishedEnglishContent: contentApi },
    'react/jsx-runtime': require('react/jsx-runtime'),
  }
  const exported = {}, win = {}
  win.addEventListener = () => {}; win.removeEventListener = () => {}; win.setInterval = () => 1; win.clearInterval = () => {}
  win.parent = preview ? {} : win
  const run = vm.runInThisContext(`(function(exports, require, window, document, URLSearchParams) { ${code}\n})`)
  run(exported, name => { assert.ok(dependencies[name], name); return dependencies[name] }, win, { documentElement: root, addEventListener() {}, removeEventListener() {}, hidden: false }, URLSearchParams)
  const child = { stable: true }
  const render = () => { cursor = 0; output = exported.SampleLanguageProvider({ children: child, isSample }); effects.splice(0).forEach(fn => fn()); return output.props.value }
  render()
  return { render, root, navigations, writes, publicWrites, get output() { return output }, get saved() { return saved }, get publicSaved() { return savedPublic }, setSearch(value) { location = { ...location, search: value } }, destroy() { slots.forEach(slot => slot?.cleanup?.()) } }
}

test('original English selection uses an explicit URL and keeps original links and live-form mode', () => {
  const h = harness({ isSample: false, search: '?lang=en' })
  const value = h.render()
  assert.equal(value.language, 'en')
  assert.equal(value.isSample, false)
  assert.equal(value.href('/join'), '/join?lang=en')
  assert.equal(h.publicSaved, 'ko')
  assert.equal(h.saved, 'ko')
  h.render().setLanguage('ko')
  assert.equal(h.navigations[0].url, '/gallery?lang=ko#archive')
  h.destroy()
})

test('opening the original homepage without a language parameter always starts in Korean', () => {
  const h = harness({ path: '/', isSample: false, publicRemembered: 'en' })
  assert.equal(h.render().language, 'ko')
  assert.equal(h.root.lang, 'ko')
  h.destroy()
})

test('switch preserves the page child identity, filters and anchor without scroll reset', () => {
  const h = harness({ search: '?tab=photos' })
  const child = h.output.props.children
  h.render().setLanguage('en')
  assert.deepEqual(h.navigations, [{ url: '/gallery?tab=photos&lang=en#archive', options: { preventScrollReset: true } }])
  assert.equal(h.render().language, 'en')
  assert.equal(h.output.props.children, child)
  assert.equal(h.root.lang, 'en')
  assert.equal(h.saved, 'en')
  h.destroy()
  assert.equal(h.root.lang, 'ko')
  assert.equal(h.root.getAttribute('data-sample-language'), null)
})
test('explicit URLs and back/forward update language without changing a remembered choice on malformed URLs', () => {
  const h = harness({ search: '?lang=en' })
  assert.equal(h.render().language, 'en')
  assert.equal(h.saved, 'en')
  h.setSearch('?lang=ko'); assert.equal(h.render().language, 'ko')
  h.setSearch('?lang=en'); assert.equal(h.render().language, 'en')
  h.setSearch('?lang=invalid'); assert.equal(h.render().language, 'ko')
  assert.equal(h.saved, 'en')
  h.setSearch(''); assert.equal(h.render().language, 'en')
  h.destroy()
})
test('CMS preview follows its explicit language without changing the visitor preference', () => {
  const h = harness({ preview: true, remembered: 'ko', search: '?lang=en' })
  assert.equal(h.render().language, 'en')
  h.render().setLanguage('ko')
  assert.deepEqual(h.navigations, [])
  assert.deepEqual(h.writes, [])
  h.setSearch('?section=contact&lang=en'); assert.equal(h.render().language, 'en')
  h.setSearch('?section=contact&lang=ko'); assert.equal(h.render().language, 'ko')
  h.destroy()

  const korean = harness({ preview: true, isSample: false, search: '?lang=ko', publicRemembered: 'en' })
  assert.equal(korean.render().language, 'ko')
  assert.equal(korean.root.lang, 'ko')
  korean.render().setLanguage('en')
  assert.deepEqual(korean.navigations, [])
  korean.destroy()
})
test('sample administrator routes do not change document language, preference or navigation', () => {
  const h = harness({ path: '/admin/editor', search: '?lang=en' })
  assert.equal(h.render().enabled, false)
  assert.equal(h.render().translate('원본'), '원본')
  h.render().setLanguage('en')
  assert.deepEqual(h.navigations, [])
  assert.deepEqual(h.writes, [])
  assert.equal(h.root.getAttribute('data-sample-language'), null)
  h.destroy()
})

test('failed English content keeps available data and can be retried without changing the language or URL', async () => {
  let success = false, calls = 0
  const id = '11111111-1111-4111-8111-111111111111'
  const h = harness({ search: '?lang=en', contentApi: async () => {
    calls++
    return success ? { data: [{ resource: 'notices', record_id: id, published: { title: 'Published notice' }, published_at: '2026-09-28T00:00:00Z' }], error: null } : { data: null, error: 'offline' }
  } })
  await Promise.resolve(); await Promise.resolve()
  assert.equal(h.render().contentError, true)
  const source = { id, title: 'Available source', is_visible: true }
  assert.equal(h.render().translateData(source, `notice:${id}`).title, 'EN:Available source')
  success = true; h.render().retryContent(); assert.equal(h.render().contentRetrying, true)
  await Promise.resolve(); await Promise.resolve()
  const value = h.render()
  assert.equal(value.contentError, false); assert.equal(value.contentRetrying, false)
  assert.equal(value.translateData(source, `notice:${id}`).title, 'EN:Published notice')
  assert.equal(calls, 2); assert.deepEqual(h.navigations, [])
  h.destroy()
})

test('Korean sample and administrator views never request English record data', async () => {
  for (const options of [{ search: '?lang=ko' }, { path: '/admin/editor', search: '?lang=en' }]) {
    let calls = 0
    const h = harness({ ...options, contentApi: async () => { calls++; return { data: [], error: null } } })
    await Promise.resolve(); await Promise.resolve()
    assert.equal(calls, 0)
    h.destroy()
  }
})
