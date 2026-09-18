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
