import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { JoinOpenScoreCTA } = await vite.ssrLoadModule('/src/components/home/JoinOpenScoreCTA.tsx')
const { HomeHeroSlideshow } = await vite.ssrLoadModule('/src/components/home/HomeHeroSlideshow.tsx')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')
const render = (Component, props, replacements = {}) => renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(SiteEditorContext, {
  value: { copy: (_page, key, fallback) => replacements[key] ?? fallback, documents: {}, device: 'desktop', isPreview: false },
}, React.createElement(Component, props))))

test('join steps use independent source keys without changing their order', () => {
  const html = render(JoinOpenScoreCTA, { presentation: 'figma-open-score' }, {
    'home.content.join.steps.1.title': '개별 연락 수정', 'home.content.join.steps.1.body': '연습 일정 안내 수정',
  })
  assert.ok(html.includes('개별 연락 수정'))
  assert.ok(html.includes('연습 일정 안내 수정'))
  assert.ok(html.includes('지원서 작성'))
  assert.ok(html.includes('음악 확인·상담'))
  assert.ok(html.indexOf('지원서 작성') < html.indexOf('개별 연락 수정'))
})

test('hero secondary CTA text can change without modifying its destination or English title', () => {
  const html = render(HomeHeroSlideshow, { slides: [], description: '원래 소개' }, { 'home.content.hero.secondaryLabel': '공연·소식', 'home.heroSupplement.fallbackDescription': '새 소개 문구' })
  assert.ok(html.includes('공연·소식'))
  assert.match(html, /href="\/concerts"/)
  assert.ok(html.replace(/<[^>]*>/g, '').includes('YOUTH'))
  assert.ok(html.includes('새 소개 문구'))
})

test('an explicitly edited tablet description retains the part after a comma', () => {
  const previous = globalThis.window
  globalThis.window = { location: { pathname: '/' }, matchMedia: query => ({ matches: query.includes('768') && !query.includes('1024') }) }
  try {
    const content = { ...HOME_CONTENT_DEFAULTS_V2.joinLetter, description: '첫 문장, 마지막 안내 문장입니다.', compactDescription: '' }
    const document = { schemaVersion: 1, copy: { 'home.tablet.current.join.description': content.description }, deviceCopy: {}, appearance: {} }
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(SiteEditorContext, { value: {
      copy: (_p,_k,fallback) => fallback, documents: { home: document }, device: 'tablet', isPreview: false,
    } }, React.createElement(JoinOpenScoreCTA, { presentation: 'figma-open-score', content }))))
    assert.ok(html.includes('마지막 안내 문장입니다.'))
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('explicitly edited home steps replace stale compact CMS procedure text on mobile', () => {
  const previous = globalThis.window
  globalThis.window = { location: { pathname: '/' }, matchMedia: () => ({ matches: false }) }
  try {
    const copy = { 'home.content.join.steps.0.title': '지원서 작성', 'home.content.join.steps.1.title': '개별 연락 수정', 'home.content.join.steps.2.title': '음악·음역 확인', 'home.content.join.steps.3.title': '첫 연습 참여' }
    const document = { schemaVersion: 1, copy, deviceCopy: {}, appearance: {} }
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(SiteEditorContext, { value: {
      copy: (_p,key,fallback) => copy[key] ?? fallback, documents: { home: document }, device: 'mobile', isPreview: false,
    } }, React.createElement(JoinOpenScoreCTA, { presentation: 'figma-open-score', joinInfo: { is_visible:true, audition_process:'기존 일정 개별 안내' } }))))
    assert.ok(html.includes('개별 연락 수정'))
    assert.ok(html.includes('04'))
    assert.ok(!html.includes('기존 일정 개별 안내'))
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})
