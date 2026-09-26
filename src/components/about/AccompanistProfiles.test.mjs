import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  cacheDir: 'node_modules/.vite-accompanist-photo-test',
  logLevel: 'silent',
  server: { middlewareMode: true },
})
after(() => vite.close())

const { AccompanistProfiles } = await vite.ssrLoadModule(
  '/src/components/about/AccompanistProfiles.tsx',
)

function person(id, photoUrl) {
  return {
    id, name: `CMS 반주자 ${id}`, photo_url: photoUrl,
    profile_image_alt: `CMS 사진 ${id}`, description: '', bio: '',
    education_items: null, current_roles: null, message: '',
    is_visible: true, sort_order: 0,
    created_at: '2026-09-26T00:00:00Z', updated_at: '2026-09-26T00:00:00Z',
  }
}

function photos(people) {
  const html = renderToStaticMarkup(createElement(AccompanistProfiles, { people }))
  return [...html.matchAll(/<img\b[^>]*class="[^"]*accompanist-profile__portrait-photo[^"]*"[^>]*>/g)]
    .map(([tag]) => ({
      src: tag.match(/\bsrc="([^"]+)"/)?.[1].replaceAll('&amp;', '&'),
      alt: tag.match(/\balt="([^"]+)"/)?.[1],
      width: tag.match(/\bwidth="([^"]+)"/)?.[1],
      height: tag.match(/\bheight="([^"]+)"/)?.[1],
    }))
}

test('both CMS portraits use high-quality resized delivery without changing the source records or layout', () => {
  const people = [
    person('A', 'https://example.supabase.co/storage/v1/object/public/site-images/accompanist/a.jpg'),
    person('B', 'https://example.supabase.co/storage/v1/object/public/site-images/accompanist/b.jpg'),
  ]
  const originalRecords = structuredClone(people)

  assert.deepEqual(photos(people), [
    {
      src: 'https://example.supabase.co/storage/v1/render/image/public/site-images/accompanist/a.jpg?width=960&quality=100&resize=contain',
      alt: 'CMS 사진 A', width: '640', height: '800',
    },
    {
      src: 'https://example.supabase.co/storage/v1/render/image/public/site-images/accompanist/b.jpg?width=960&quality=100&resize=contain',
      alt: 'CMS 사진 B', width: '640', height: '800',
    },
  ])
  assert.deepEqual(people, originalRecords)
})

test('a replacement CMS image is used and non-Storage URLs remain intact', () => {
  const record = person('A', 'https://portrait.example.test/original.jpg')
  assert.equal(photos([record])[0].src, 'https://portrait.example.test/original.jpg')

  const replacement = { ...record, photo_url: 'https://portrait.example.test/replacement.jpg?revision=2' }
  assert.equal(photos([replacement])[0].src, 'https://portrait.example.test/replacement.jpg?revision=2')
})

test('missing CMS photos keep the profile fallback instead of rendering a broken image', () => {
  assert.deepEqual(photos([person('A', null), person('B', '')]), [])
})
