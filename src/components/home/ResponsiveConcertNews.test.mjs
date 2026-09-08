import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  cacheDir: 'node_modules/.vite-concert-spirit-test',
  configFile: false,
  logLevel: 'silent',
  plugins: [react()],
  root: process.cwd(),
  server: { middlewareMode: true },
})

const { PerformanceNewsPreview } = await vite.ssrLoadModule(
  '/src/components/home/PerformanceNewsPreview.tsx',
)

after(async () => {
  await vite.close()
})

function concert(overrides = {}) {
  return {
    apply_url: '', category: 'regular', created_at: '2026-01-01T00:00:00Z',
    date: '2099-09-19', description: '', id: 'next-concert', is_visible: true,
    location: 'CMS 공연장', performers: [], poster_url: '', program: [],
    status: 'scheduled', ticket_url: '', time: '오후 7시 30분', title: 'CMS 공연 제목',
    updated_at: '2026-01-01T00:00:00Z', ...overrides,
  }
}

function notice(overrides = {}) {
  return {
    category: 'notice', content: '', cover_image_url: '',
    created_at: '2026-09-01T00:00:00Z', id: 'current-notice', is_important: false,
    is_visible: true, title: 'CMS 공지 제목', updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  }
}

function renderResponsive(props, width = 390) {
  const previousWindow = globalThis.window
  globalThis.window = {
    location: { pathname: '/' },
    matchMedia: () => ({ matches: width >= 1024 }),
  }
  try {
    return renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(PerformanceNewsPreview, {
        concerts: [], notices: [], presentation: 'figma-template-carousel', ...props,
      }),
    ))
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
}

test('mobile and tablet ticket use the next public concert CMS date, time and real detail route', () => {
  const concerts = [
    concert({ id: 'later-concert', date: '2099-11-01' }),
    concert({ id: 'hidden-concert', date: '2099-08-01', is_visible: false }),
    concert({ id: 'cancelled-concert', date: '2099-08-02', status: 'cancelled' }),
    concert({ id: 'past-concert', date: '2000-01-01' }),
    concert(),
  ]
  for (const width of [390, 834, 1023]) {
    const html = renderResponsive({ concerts, detailButtonLabel: 'CMS 상세 버튼' }, width)
    assert.match(html, /data-performance-presentation="responsive-editorial"/)
    assert.match(html, />09\.19</)
    assert.match(html, /dateTime="2099-09-19"/)
    assert.match(html, /2099/)
    assert.match(html, /토요일/)
    assert.match(html, /CMS 공연장/)
    assert.match(html, /오후 7시 30분/)
    assert.match(html, /href="\/concerts\/next-concert"/)
    assert.match(html, /CMS 상세 버튼/)
    assert.match(html, /href="\/concerts"/)
    for (const id of ['later-concert', 'hidden-concert', 'cancelled-concert', 'past-concert']) {
      assert.doesNotMatch(html, new RegExp(`/concerts/${id}`))
    }
  }
})

test('desktop breakpoint keeps the existing carousel and never mounts responsive tickets', () => {
  for (const width of [1024, 1440]) {
    const html = renderResponsive({ concerts: [concert()] }, width)
    assert.match(html, /data-performance-presentation="figma-template-carousel"/)
    assert.doesNotMatch(html, /data-performance-presentation="responsive-editorial"/)
    assert.doesNotMatch(html, /responsive-concerts__ticket/)
  }
})

test('invalid CMS dates cannot be shown as a different date or invalid time element', () => {
  for (const date of ['2099-02-30', '2099-13-01', 'not a date']) {
    const html = renderResponsive({ concerts: [concert({ date })] })
    assert.match(html, /CMS 공연 제목/)
    assert.doesNotMatch(html, /dateTime=/)
    assert.doesNotMatch(html, /NaN|Invalid Date|03\.02|13\.01|not a date/)
  }
})

test('responsive labels and empty states retain CMS copy and reachable collection links', () => {
  const html = renderResponsive({
    eyebrow: 'CMS 섹션 라벨', title: 'CMS 섹션 제목', description: 'CMS 섹션 설명',
    emptyConcertTitle: 'CMS 공연 빈 제목', emptyConcertText: 'CMS 공연 빈 설명',
    emptyConcertButtonLabel: 'CMS 빈 공연 버튼', emptyNoticeTitle: 'CMS 공지 빈 제목',
    emptyNoticeText: 'CMS 공지 빈 설명', emptyNoticeButtonLabel: 'CMS 빈 공지 버튼',
    concertButtonLabel: 'CMS 전체 공연', noticePanelTitle: 'CMS 공지 영역',
    noticePanelButtonLabel: 'CMS 모든 공지',
  })
  for (const value of [
    'CMS 섹션 라벨', 'CMS 섹션 제목', 'CMS 섹션 설명', 'CMS 공연 빈 제목',
    'CMS 공연 빈 설명', 'CMS 빈 공연 버튼', 'CMS 공지 빈 제목', 'CMS 공지 빈 설명',
    'CMS 빈 공지 버튼', 'CMS 전체 공연', 'CMS 공지 영역', 'CMS 모든 공지',
  ]) assert.ok(html.includes(value), `missing CMS copy: ${value}`)
  assert.match(html, /href="\/concerts"/)
  assert.match(html, /href="\/notices"/)
})

test('responsive notices keep visibility, importance ordering and CMS card label', () => {
  const html = renderResponsive({
    concerts: [concert()], responsiveCardEyebrow: 'CMS 다음 무대',
    notices: [
      notice({ id: 'hidden', title: '노출 금지', is_visible: false }),
      notice({ id: 'recent', title: '최근 공지', created_at: '2026-09-05T00:00:00Z' }),
      notice({ id: 'important', title: '중요 공지', is_important: true }),
    ],
  })
  assert.match(html, /CMS 다음 무대/)
  assert.doesNotMatch(html, /노출 금지|\/notices\/hidden/)
  assert.ok(html.indexOf('/notices/important') < html.indexOf('/notices/recent'))
  assert.match(html, /중요 공지/)
  assert.match(html, /최근 공지/)
})

test('ticket date has a tablet separator and important notices retain their CMS status label', async () => {
  const { ResponsiveConcertNews } = await vite.ssrLoadModule('/src/components/home/ResponsiveConcertNews.tsx')
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ResponsiveConcertNews, {
    concert: concert(), notices: [notice({ is_important: true })], responsiveNoticeImportantLabel: 'CMS 중요 안내',
  })))
  assert.match(html, /responsive-concerts__date-separator/)
  assert.match(html, /CMS 중요 안내/)
  const ordinary = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ResponsiveConcertNews, {
    concert: concert(), notices: [notice()], responsiveNoticeImportantLabel: 'CMS 중요 안내',
  })))
  assert.doesNotMatch(ordinary, /CMS 중요 안내/)
})
