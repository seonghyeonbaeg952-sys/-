import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

async function moduleUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  for (const [specifier, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`'${specifier}'`, `'${url}'`).replaceAll(`"${specifier}"`, `"${url}"`)
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}

const youtubeUrl = await moduleUrl('../../utils/youtube.ts')
const model = await import(await moduleUrl('./galleryViewModel.ts', { '../../utils/youtube': youtubeUrl }))
const row = (id, changes = {}) => ({
  id, title: 'CMS 제목', category: 'concert', description: '', image_url: '/public-photo.jpg',
  image_alt: 'CMS 제목', display_order: 0, is_visible: true,
  created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-01T00:00:00Z', ...changes,
})

test('public gallery keeps CMS order and excludes hidden media and hidden-only categories', () => {
  const data = {
    images: Object.freeze([row('second', { display_order: 2 }), row('first'), row('hidden', { is_visible: false, category: 'practice' })]),
    videos: [row('video'), row('hidden-video', { is_visible: false })],
    posters: [row('poster'), row('hidden-poster', { is_visible: false })],
  }
  const view = model.getGalleryView(data, 'all')
  assert.deepEqual(view.images.map(n => n.id), ['second', 'first'])
  assert.deepEqual(view.categories, [{ value: 'concert', label: '공연' }])
  assert.deepEqual(view.videos.map(n => n.id), ['video'])
  assert.deepEqual(view.posters.map(n => n.id), ['poster'])
  assert.equal(data.images.length, 3)
})

test('a category restricts the sequence; unknown and empty categories never fabricate content', () => {
  const data = { images: [row('c'), row('p', { category: 'practice' })], videos: [], posters: [] }
  assert.deepEqual(model.getGalleryView(data, 'practice').images.map(n => n.id), ['p'])
  assert.deepEqual(model.getGalleryView(data, 'missing').images, [])
  assert.deepEqual(model.getGalleryView({ images: [], videos: [], posters: [] }, 'all').images, [])
  assert.equal(model.getGalleryCategoryLabel('constructor'), 'constructor')
  assert.equal(model.getGalleryCategoryLabel(''), '아카이브')
})

test('invalid tabs fall back safely and deep links retain the category and selected ID', () => {
  assert.deepEqual(model.readGalleryLocation(new URLSearchParams('tab=posters&category=practice&media=p-1')),
    { tab: 'posters', category: 'practice', mediaId: 'p-1' })
  assert.deepEqual(model.readGalleryLocation(new URLSearchParams('tab=unknown&category=%20')),
    { tab: 'photos', category: 'all', mediaId: null })
})

test('tab/filter changes close the viewer without losing unrelated URL state or the photo category', () => {
  const input = new URLSearchParams('tab=photos&category=practice&media=a&utm_source=choir')
  const changed = model.updateGallerySearch(input, { tab: 'videos', mediaId: null })
  assert.equal(changed.toString(), 'tab=videos&category=practice&utm_source=choir')
  assert.equal(model.updateGallerySearch(changed, { tab: 'photos' }).get('category'), 'practice')
  assert.equal(model.updateGallerySearch(input, { category: 'all', mediaId: null }).toString(), 'tab=photos&utm_source=choir')
  assert.equal(input.get('media'), 'a')
})

test('opening and stepping a viewer does not change its category', () => {
  const input = new URLSearchParams('tab=photos&category=practice')
  assert.equal(model.updateGallerySearch(input, { mediaId: 'a/b' }).toString(), 'tab=photos&category=practice&media=a%2Fb')
})

test('previous/next follows item IDs after reorder, wraps, and never substitutes a stale ID', () => {
  const items = [row('c'), row('a'), row('b')]
  assert.equal(model.getAdjacentMediaId(items, 'a', 'next'), 'b')
  assert.equal(model.getAdjacentMediaId(items, 'c', 'previous'), 'b')
  assert.equal(model.getAdjacentMediaId(items, 'b', 'next'), 'c')
  assert.equal(model.getAdjacentMediaId(items, 'deleted', 'next'), null)
  assert.equal(model.getAdjacentMediaId([], 'a', 'next'), null)
  assert.equal(model.getAdjacentMediaId([row('a')], 'a', 'next'), null)
})

test('valid YouTube sources use fixed HTTPS origins and preserve a valid start time', () => {
  assert.deepEqual(model.getGalleryVideoLinks('https://www.youtube.com/watch?v=0_FLA_oV9_I&t=553s'), {
    embed: 'https://www.youtube-nocookie.com/embed/0_FLA_oV9_I?start=553',
    external: 'https://www.youtube.com/watch?v=0_FLA_oV9_I&t=553s',
  })
  assert.equal(model.getGalleryVideoLinks('0_FLA_oV9_I').embed, 'https://www.youtube-nocookie.com/embed/0_FLA_oV9_I')
  assert.equal(model.getGalleryVideoLinks('https://youtu.be/0_FLA_oV9_I?t=1m2s').embed, 'https://www.youtube-nocookie.com/embed/0_FLA_oV9_I?start=62')
})

test('untrusted hosts, protocols, credentials, malformed IDs and empty videos do not create links', () => {
  for (const value of ['', 'https://evil.example/watch?v=0_FLA_oV9_I', 'javascript://youtube.com/watch?v=0_FLA_oV9_I',
    'https://user:pass@youtube.com/watch?v=0_FLA_oV9_I', 'https://youtu.be/short',
    'https://www.youtube.com/watch?v=bad%22%3E%3Cscript%3E']) {
    assert.equal(model.getGalleryVideoLinks(value), null, value)
  }
  assert.equal(model.getGalleryVideoLinks('https://youtu.be/0_FLA_oV9_I?t=-15').embed, 'https://www.youtube-nocookie.com/embed/0_FLA_oV9_I')
})
