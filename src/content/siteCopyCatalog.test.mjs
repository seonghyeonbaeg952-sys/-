import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-site-copy-catalog-test', logLevel: 'silent', root: process.cwd(), server: { middlewareMode: true } })
const catalog = await vite.ssrLoadModule('/src/content/siteCopyCatalog.ts').catch(() => ({}))
const home = await vite.ssrLoadModule('/src/lib/homeDeviceContent.ts')
after(() => vite.close())
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })

test('home adapter retains consumer key/device and validation metadata for every existing field', () => {
  assert.ok(Array.isArray(catalog.siteCopyDefinitions))
  for (const source of home.homeAllEditorFields) {
    const field = catalog.siteCopyDefinitions.find(item => item.key === source.key && item.page === 'home')
    assert.ok(field, source.key)
    for (const key of ['key', 'sourceKey', 'inputType', 'min', 'max', 'maxLength', 'defaultValue']) assert.equal(field[key], source[key], `${source.key}: ${key}`)
    assert.equal(field.sourceDevice, source.device)
  }
})

test('home overrides affect only the selected device and never mutate existing CMS values', () => {
  assert.equal(typeof catalog.applyHomeEditorOverrides, 'function')
  const raw = { 'home.current.about.title': '기존 PC', 'home.mobile.current.about.title': '기존 모바일', 'home.tablet.current.about.title': '기존 태블릿' }
  const documents = { home: { ...empty(), deviceCopy: { mobile: { 'home.mobile.current.about.title': '새 모바일\n문구' } } } }
  assert.deepEqual(catalog.applyHomeEditorOverrides(raw, {}, 'mobile'), raw)
  assert.equal(catalog.applyHomeEditorOverrides(raw, documents, 'mobile')['home.mobile.current.about.title'], '새 모바일\n문구')
  assert.deepEqual(catalog.applyHomeEditorOverrides(raw, documents, 'desktop'), raw)
  assert.equal(raw['home.mobile.current.about.title'], '기존 모바일')
})

test('legacy resolved defaults preserve existing device source values for the editor', () => {
  assert.equal(typeof catalog.getSiteCopyDefaults, 'function')
  const defaults = catalog.getSiteCopyDefaults({ 'home.current.about.title': '현재 제목', 'home.mobile.current.about.title': '현재 모바일' })
  assert.equal(defaults['home.current.about.title'], '현재 제목')
  assert.equal(defaults['home.mobile.current.about.title'], '현재 모바일')
})

test('home rendered override preserves an explicit blank and whitespace instead of restoring legacy fallback', () => {
  assert.equal(typeof catalog.resolveHomeEditorContent, 'function')
  const documents = { home: { ...empty(), deviceCopy: { mobile: {
    'home.mobile.current.about.title': '',
    'home.mobile.responsive.join.mobileDescription': '  앞\n\n뒤  ',
  } } } }
  const content = catalog.resolveHomeEditorContent({}, documents, 'mobile')
  assert.equal(content.about.title, '')
  assert.equal(content.joinLetter.responsiveMobileDescription, '  앞\n\n뒤  ')
  assert.deepEqual(catalog.resolveHomeEditorContent({}, {}, 'mobile'), home.resolveHomeContentForDevice({}, 'mobile'))
})
