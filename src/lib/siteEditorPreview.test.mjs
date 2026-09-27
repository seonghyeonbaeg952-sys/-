import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`
const stylesUrl = moduleUrl(await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const layoutUrl = moduleUrl((await readFile(new URL('./siteEditorLayout.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const modelUrl = moduleUrl((await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorLayout'", JSON.stringify(layoutUrl)))
const source = await readFile(new URL('./siteEditorPreview.ts', import.meta.url), 'utf8')
const preview = await import(moduleUrl(source.replace("'./siteEditorModel'", JSON.stringify(modelUrl))))
const nonce = 'ec50cd93-7e23-4428-a4d6-9688109cd605'
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const draft = () => ({ type: 'smyc-editor:draft', version: 1, nonce, page: 'home', sequence: 2, documents: { home: empty() } })

test('cross-page preview intents are public, same-origin routes without carrying preview credentials', () => {
  assert.equal(typeof preview.getPreviewPageIntent, 'function')
  const base = `https://choir.example/?site-editor-preview=${nonce}`
  assert.deepEqual(preview.getPreviewPageIntent('/join?section=contact#application', base), { page: 'join', path: '/join?section=contact#application' })
  assert.deepEqual(preview.getPreviewPageIntent(`/spirit?site-editor-preview=${nonce}`, base), { page: 'spirit', path: '/spirit' })
  assert.deepEqual(preview.getPreviewPageIntent('/sample/concerts?filter=upcoming', base), { page: 'concerts', path: '/concerts?filter=upcoming' })
  assert.deepEqual(preview.getPreviewPageIntent('/sample/concerts/real-id', base), { page: 'concert-detail', path: '/concerts/real-id' })
  assert.equal(preview.getPreviewPageIntent('/sample/admin', base), null)
  for (const path of ['/admin/editor', '//other.example/join', 'javascript:alert(1)', '/unknown']) assert.equal(preview.getPreviewPageIntent(path, base), null)
})

test('navigation requests bind origin, iframe, nonce, source page and a validated destination', () => {
  const request = { type: 'smyc-editor:navigate', version: 1, nonce, page: 'home', sequence: 2,
    requestId: '11111111-1111-4111-8111-111111111111', target: { page: 'join', path: '/join?section=contact#application' } }
  assert.deepEqual(preview.parseSiteEditorMessage(request), request)
  for (const target of [{page:'join',path:'/admin/editor'}, {page:'join',path:'//other.example/join'}, {page:'home',path:'/join'}, {page:'join',path:'/join?site-editor-preview=bad'}]) assert.equal(preview.parseSiteEditorMessage({...request,target}), null)
  const source = {}
  assert.equal(preview.acceptSiteEditorMessage({origin:'https://other.example',source,data:request}, {origin:'https://choir.example',source,nonce,page:'home'}), null)
})

test('preview resolves allowed routes and actual about sections without allowing administrator routes', () => {
  assert.equal(typeof preview.getSiteEditorPage, 'function')
  for (const [path, search, expected] of [['/', '', 'home'], ['/about', '?section=members', 'members'], ['/about', '?section=spirit', 'about'], ['/concerts/real-id', '', 'concert-detail'], ['/notices/real-id', '', 'notice-detail'], ['/contact', '?section=support', 'contact'], ['/admin/login', '', null], ['/unknown', '', null]]) {
    assert.equal(preview.getSiteEditorPage(path, search), expected)
  }
})

test('a valid nonce only disables submission in an embedded public preview', () => {
  assert.equal(typeof preview.isSiteEditorPreview, 'function')
  const context = { pathname: '/join', search: `?site-editor-preview=${nonce}`, isEmbedded: true }
  assert.equal(preview.isSiteEditorPreview(context), true)
  assert.equal(preview.isSiteEditorPreview({ ...context, isEmbedded: false }), false)
  assert.equal(preview.isSiteEditorPreview({ ...context, pathname: '/admin' }), false)
  for (const search of ['', '?site-editor-preview=1', '?site-editor-preview=javascript:bad']) assert.equal(preview.isSiteEditorPreview({ ...context, search }), false)
})

test('preview rejects unsupported message versions, unknown fields and invalid documents', () => {
  assert.equal(typeof preview.parseSiteEditorMessage, 'function')
  assert.deepEqual(preview.parseSiteEditorMessage(draft()), draft())
  for (const value of [null, [], { ...draft(), version: 2 }, { ...draft(), page: 'admin' }, { ...draft(), nonce: '1' }, { ...draft(), sequence: -1 }, { ...draft(), sequence: 2.1 }, { ...draft(), unexpected: true }, { ...draft(), documents: { admin: empty() } }, { ...draft(), documents: { home: { ...empty(), copy: { title: '<script>x</script>' } } } }]) assert.equal(preview.parseSiteEditorMessage(value), null)
})

test('preview section anchors are bounded, plain and authenticated like draft messages', () => {
  const anchors = { type: 'smyc-editor:anchors', version: 1, nonce, page: 'home', sequence: 2,
    anchors: [{ id: 'main-content', label: '본문 아래' }, { id: 'class-home-about-portrait', label: '합창단 소개' }] }
  assert.deepEqual(preview.parseSiteEditorMessage(anchors), anchors)
  for (const candidate of [
    { ...anchors, anchors: [{ id: '../admin', label: '관리자' }] },
    { ...anchors, anchors: [{ id: 'main-content', label: '<script>' }] },
    { ...anchors, anchors: Array.from({ length: 33 }, (_, index) => ({ id: `section-${index}`, label: '섹션' })) },
    { ...anchors, extra: true },
  ]) assert.equal(preview.parseSiteEditorMessage(candidate), null)
})

test('receiver binds origin, source, nonce, page and monotonically increasing sequence', () => {
  assert.equal(typeof preview.acceptSiteEditorMessage, 'function')
  const source = {}
  const expected = { origin: 'https://choir.example', source, nonce, page: 'home', lastSequence: 1, type: 'smyc-editor:draft' }
  const event = { origin: expected.origin, source, data: draft() }
  assert.deepEqual(preview.acceptSiteEditorMessage(event, expected), draft())
  for (const change of [{ origin: 'https://other.example' }, { source: {} }, { data: { ...draft(), nonce: '106b7760-f95b-4e79-937a-d65741e3b080' } }, { data: { ...draft(), page: 'contact' } }, { data: { ...draft(), sequence: 1 } }]) assert.equal(preview.acceptSiteEditorMessage({ ...event, ...change }, expected), null)
})

test('preview navigation stays on its selected page and preserves nonce for same-page refresh or anchors', () => {
  assert.equal(typeof preview.getPreviewNavigationTarget, 'function')
  const base = `https://choir.example/contact?site-editor-preview=${nonce}`
  assert.equal(preview.getPreviewNavigationTarget('/contact?section=support#form', base, nonce, 'contact'), `/contact?section=support&site-editor-preview=${nonce}#form`)
  for (const href of ['https://other.example/contact', '/admin', '/join', 'mailto:person@example.com', '/file.pdf']) assert.equal(preview.getPreviewNavigationTarget(href, base, nonce, 'contact'), null)
})

test('an embedded preview remains marked after a router redirect rebuilds its query', async () => {
  const previousWindow = globalThis.window
  globalThis.window = { parent: {}, location: { pathname: '/contact', search: `?site-editor-preview=${nonce}` } }
  try {
    const isolated = await import(moduleUrl(source.replace("'./siteEditorModel'", JSON.stringify(modelUrl)) + '\n// isolated preview bootstrap'))
    globalThis.window.location = { pathname: '/join', search: '?section=contact' }
    assert.equal(isolated.isSiteEditorPreview(), true)
    assert.equal(isolated.getActiveSiteEditorPreviewNonce('?section=contact'), nonce)
    globalThis.window.location.pathname = '/admin'
    assert.equal(isolated.isSiteEditorPreview(), false)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
