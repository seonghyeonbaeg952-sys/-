import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

let model = {}
try {
  const source = await readFile(new URL('./sitePhotoModel.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  model = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
} catch (error) { if (error.code !== 'ENOENT') throw error }
const has = name => assert.equal(typeof model[name], 'function', `Missing photo behavior: ${name}`)
const photo = overrides => ({ src: 'https://example.com/choir.webp', altKo: '함께 노래하는 합창단', altEn: 'The choir singing together', positionX: 50, positionY: 50, ...overrides })

test('photo settings accept local assets and HTTPS, but reject active, credentialed and CSS-breaking URLs', () => {
  has('validateSitePhoto')
  assert.equal(model.validateSitePhoto(photo()), null)
  assert.equal(model.validateSitePhoto(photo({ src: '/images/about/choir.webp' })), null)
  for (const src of ['javascript:alert(1)', 'data:image/svg+xml,<svg/>', '//evil.test/x.png', 'https://u:p@example.com/a.jpg', 'https://example.com/a.jpg")', '/images/../secret.png', 'http://example.com/a.jpg']) {
    assert.ok(model.validateSitePhoto(photo({ src })), src)
  }
})

test('photo validation rejects invalid focal coordinates and malformed metadata instead of silently coercing them', () => {
  has('validateSitePhoto')
  for (const value of [photo({ positionX: -1 }), photo({ positionY: 101 }), photo({ positionX: NaN }), photo({ positionY: '50' }), photo({ altKo: 'x'.repeat(501) }), photo({ unexpected: true })]) {
    assert.ok(model.validateSitePhoto(value))
  }
  assert.equal(model.validateSitePhoto(null), null)
})

test('the public resolver reads published values only and selects the correct alt language', () => {
  has('resolveSitePhoto')
  const records = { 'about-europe': { published: photo({ positionX: 25 }), draft: photo({ src: 'https://example.com/draft.jpg' }) } }
  assert.deepEqual(model.resolveSitePhoto(records, 'about-europe', '/images/default.webp', '기존 설명', 'en'), {
    src: 'https://example.com/choir.webp', alt: 'The choir singing together', objectPosition: '25% 50%', overridden: true,
  })
  assert.equal(model.resolveSitePhoto({ 'about-europe': { published: null, draft: photo() } }, 'about-europe', '/images/default.webp', '기존 설명', 'ko').src, '/images/default.webp')
})

test('restoring the original photo and invalid stored values safely retain the caller fallback', () => {
  has('resolveSitePhoto')
  for (const published of [null, photo({ src: 'javascript:bad' })]) {
    assert.deepEqual(model.resolveSitePhoto({ cover: { published } }, 'cover', '/images/original.webp', '원본 설명', 'ko'), {
      src: '/images/original.webp', alt: '원본 설명', objectPosition: undefined, overridden: false,
    })
  }
  assert.equal(model.resolveSitePhoto({ cover: { published: photo({ altEn: '' }) } }, 'cover', '/images/a.webp', 'Original English', 'en').alt, 'Original English')
})

test('photo replacement emits only the selected existing media field, leaving text, visibility and translations untouched', () => {
  has('buildContentPhotoPayload')
  assert.deepEqual(model.buildContentPhotoPayload({ table: 'concerts', field: 'poster_url' }, 'https://example.com/new.png'), { poster_url: 'https://example.com/new.png' })
  assert.deepEqual(model.buildContentPhotoPayload({ table: 'hero_slides', field: 'image_url', altField: 'image_alt' }, 'https://example.com/new.png', '새 사진'), { image_url: 'https://example.com/new.png', image_alt: '새 사진' })
  assert.throws(() => model.buildContentPhotoPayload({ table: 'members', field: 'photo_url' }, 'https://example.com/a.png'))
  assert.throws(() => model.buildContentPhotoPayload({ table: 'conductor', field: 'name' }, 'https://example.com/a.png'))
})

test('replacing a conductor activity photo preserves the other photographs and their captions', () => {
  has('buildContentPhotoPayload')
  const previous = 'https://example.com/a.jpg | 첫 사진 | 첫 설명\nhttps://example.com/b.jpg | 둘째 사진 | 둘째 설명'
  assert.deepEqual(model.buildContentPhotoPayload({ table: 'conductor', field: 'activity_images', index: 1, previous }, 'https://example.com/replaced.webp', '교체 사진'), {
    activity_images: 'https://example.com/a.jpg | 첫 사진 | 첫 설명\nhttps://example.com/replaced.webp | 교체 사진 | 둘째 설명',
  })
})

test('a saved photo remains clean after Postgres JSONB reorders its properties', () => {
  has('sameSitePhoto')
  const databaseOrder = { altEn: 'The choir singing together', altKo: '함께 노래하는 합창단', src: 'https://example.com/choir.webp', positionY: 50, positionX: 50 }
  assert.equal(model.sameSitePhoto(photo(), databaseOrder), true)
  assert.equal(model.sameSitePhoto(photo(), { ...databaseOrder, positionX: 30 }), false)
  assert.equal(model.sameSitePhoto(null, null), true)
  assert.equal(model.sameSitePhoto(null, photo()), false)
})
