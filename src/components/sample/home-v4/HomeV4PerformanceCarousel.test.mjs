import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  appType: 'custom',
  cacheDir: 'node_modules/.vite-home-concert-records-test',
  logLevel: 'silent',
  server: { middlewareMode: true },
})
after(() => vite.close())
const { HomeV4PerformanceCarousel } = await vite.ssrLoadModule(
  '/src/components/sample/home-v4/HomeV4PerformanceCarousel.tsx',
)

function concert(id, overrides = {}) {
  return {
    id, title: `CMS 공연 ${id}`, category: 'regular', date: '2099-10-01',
    time: '19:00', location: 'CMS 공연장', poster_url: '', description: '',
    program: [], performers: [], ticket_url: '', apply_url: '',
    status: 'scheduled', is_visible: true,
    created_at: '2026-09-26T00:00:00Z', updated_at: '2026-09-26T00:00:00Z',
    ...overrides,
  }
}

function render(concerts) {
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(HomeV4PerformanceCarousel, {
      concerts, title: 'CMS 공연 섹션', description: 'CMS 섹션 소개',
      detailButtonLabel: 'CMS 상세 보기', concertButtonLabel: 'CMS 전체 일정',
      emptyTitle: 'CMS 공개 공연 없음', emptyDescription: '공연을 등록하면 안내합니다.',
      emptyButtonLabel: '공연 목록 확인',
    }),
  ))
}

function choices(html) {
  return [...html.matchAll(/aria-label="\d+번 공연 ([^"]+) 보기"/g)]
    .map(match => match[1])
}

test('one CMS concert renders exactly one choice and one programme without fabricated companions', () => {
  const html = render([concert('A')])
  assert.deepEqual(choices(html), ['CMS 공연 A'])
  assert.equal((html.match(/data-template-position="/g) ?? []).length, 1)
  assert.match(html, /1\s*\/\s*1/)
  for (const label of ['이전 공연 템플릿', '다음 공연 템플릿']) {
    const button = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0]
    assert.ok(button?.includes('disabled=""'), `${label} must be disabled for one concert`)
  }
})

test('two CMS concerts render exactly those choices without filling a third slot', () => {
  const html = render([concert('A'), concert('B')])
  assert.deepEqual(choices(html), ['CMS 공연 A', 'CMS 공연 B'])
  assert.equal((html.match(/data-template-position="/g) ?? []).length, 2)
  assert.match(html, /1\s*\/\s*2/)
})

test('no CMS concert renders the editable empty state and no event controls or detail links', () => {
  const html = render([])
  for (const text of ['CMS 공연 섹션', 'CMS 공개 공연 없음', '공연을 등록하면 안내합니다.', '공연 목록 확인']) {
    assert.ok(html.includes(text), `missing empty-state copy: ${text}`)
  }
  assert.deepEqual(choices(html), [])
  assert.doesNotMatch(html, /data-template-position=|이전 공연 템플릿|다음 공연 템플릿|href="[^"]*concerts\//)
})

test('hidden records do not render and the existing three-concert limit uses only CMS records', () => {
  const html = render([
    concert('hidden', { is_visible: false }),
    concert('A'), concert('B'), concert('C'), concert('D'),
  ])
  assert.deepEqual(choices(html), ['CMS 공연 A', 'CMS 공연 B', 'CMS 공연 C'])
  assert.doesNotMatch(html, /CMS 공연 hidden|CMS 공연 D/)
})
