import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
const url = code => `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
const compile = code => ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const auth = url('export const getSupabaseClientSafe = () => ({ data: null, error: null })')
const model = url(compile(await readFile(new URL('./sitePhotoModel.ts', import.meta.url), 'utf8')))
let content = {}
try {
  const code = compile(await readFile(new URL('./sitePhotoContent.ts', import.meta.url), 'utf8')).replaceAll("'../../lib/auth'", JSON.stringify(auth)).replaceAll("'./sitePhotoModel'", JSON.stringify(model))
  content = await import(url(code))
} catch (error) { if (error.code !== 'ENOENT') throw error }
const has = name => assert.equal(typeof content[name], 'function', `${name} must implement photo management`)
test('content inventory includes unassigned image slots and retains visibility without exposing private submissions', () => {
  has('contentPhotoItems')
  const items = content.contentPhotoItems('concerts', [{ id: 'concert-a', title: '공연', poster_url: null, is_visible: false }])
  assert.equal(items.length, 1)
  assert.equal(items[0].src, '')
  assert.equal(items[0].visible, false)
  assert.equal(items[0].target.field, 'poster_url')
  assert.throws(() => content.contentPhotoItems('join_applications', [{ id: 'private', photo_file_path: 'private.jpg' }]))
})
test('conductor activity photographs retain their original line index for independent replacement', () => {
  has('contentPhotoItems')
  const items = content.contentPhotoItems('conductor', [{ id: 'person-a', name: '지휘자', photo_url: 'https://example.com/profile.jpg', activity_images: '\nhttps://example.com/stage.jpg | 무대 | 설명', is_visible: true }])
  assert.equal(items.length, 2)
  assert.equal(items[1].src, 'https://example.com/stage.jpg')
  assert.equal(items[1].target.index, 1)
  assert.equal(items[1].alt, '무대')
})
test('video photos use YouTube artwork until a custom thumbnail is provided', () => {
  has('contentPhotoItems')
  const [automatic] = content.contentPhotoItems('videos', [{ id: 'video-a', title: '공연 영상', youtube_id: 'abcdefghijk', is_visible: true }])
  assert.equal(automatic.src, 'https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg')
  assert.equal(automatic.target.previous, null)
  const [custom] = content.contentPhotoItems('videos', [{ id: 'video-b', title: '영상', youtube_id: 'abcdefghijk', thumbnail_url: 'https://example.com/custom.webp', is_visible: true }])
  assert.equal(custom.src, 'https://example.com/custom.webp')
})
test('English photo updates preserve all unrelated translated draft fields and can remove only the media override', () => {
  has('mergeEnglishPhoto')
  const before = { title: 'Concert', description: 'Previously translated copy', image_url: 'https://example.com/old.webp' }
  assert.deepEqual(content.mergeEnglishPhoto(before, 'image_url', 'https://example.com/new.webp'), { title: 'Concert', description: 'Previously translated copy', image_url: 'https://example.com/new.webp' })
  assert.deepEqual(content.mergeEnglishPhoto(before, 'image_url', null), { title: 'Concert', description: 'Previously translated copy' })
  assert.equal(before.image_url, 'https://example.com/old.webp')
})
