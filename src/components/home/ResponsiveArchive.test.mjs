import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', configFile: false, cacheDir: 'node_modules/.vite-responsive-archive-test', plugins: [react()], logLevel: 'silent', server: { middlewareMode: true } })
const { ResponsiveArchive } = await vite.ssrLoadModule('/src/components/home/ResponsiveArchive.tsx')
after(() => vite.close())
const photo = overrides => ({ id: 'photo', title: '공개 공연 기록', image_alt: '합창 공연', image_url: '/public-photo.jpg', is_visible: true, display_order: 1, category: 'concert', created_at: '', updated_at: '', ...overrides })
const render = props => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ResponsiveArchive, { images: [], posters: [], videos: [], eyebrow: 'ARCHIVE', title: 'CMS 기록 제목', categoryLabel: '사진 · 영상 · 포스터', description: 'CMS 기록 설명', buttonLabel: '기록 보기', emptyTitle: '공개 자료가 없습니다', emptyDescription: '새 기록을 기다려 주세요', ...props })))

test('archive chooses only a public ordered photo, uses CMS caption and existing gallery tabs', () => {
  const html = render({ images: [photo({ image_url: '/hidden.jpg', is_visible: false }), photo({ id: 'later', image_url: '/later.jpg', display_order: 5 }), photo({})] })
  assert.match(html, /public-photo.jpg/)
  assert.doesNotMatch(html, /hidden.jpg|later.jpg/)
  assert.match(html, /공개 공연 기록/)
  assert.match(html, /CMS 기록 제목/)
  for (const tab of ['photos', 'posters', 'videos']) assert.match(html, new RegExp(`/gallery\\?tab=${tab}`))
})

test('empty archive uses CMS empty copy without fabricated image', () => {
  const html = render({ images: [photo({ is_visible: false })] })
  assert.match(html, /공개 자료가 없습니다/)
  assert.match(html, /새 기록을 기다려 주세요/)
  assert.doesNotMatch(html, /<img/)
})

test('responsive archive keeps the selected heading and media without adding desktop-only description', () => {
  const html = render({ images: [photo({})] })
  assert.doesNotMatch(html, /CMS 기록 설명/)
  assert.match(html, /CMS 기록 제목/)
  assert.match(html, /public-photo.jpg/)
})
