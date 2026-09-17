import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { NoticesPage } = await vite.ssrLoadModule('/src/pages/public/NoticesPage.tsx')
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { resolveEditorCopy } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
function render(document = empty(), device = 'desktop') {
  const documents = { notices: document }
  const value = { documents, device, isPreview: false, copy: (page, id, fallback) => resolveEditorCopy(documents, page, id, fallback, device) }
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/notices'] },
    createElement(SiteEditorContext, { value }, createElement(NoticesPage))))
}

test('NoticesPage renders only the selected title characters with the saved size and font', () => {
  const doc = empty()
  doc.textStyles = { shared: { 'notices.title': { text: '공지사항', runs: [{ start: 0, end: 2, style: { fontFamily: 'hahmlet', fontSize: 32 } }] } } }
  const html = render(doc)
  assert.match(html, /<h1 class="notices-page__title"><smyc-text[^>]+><smyc-copy[^>]+>공지<\/smyc-copy>사항<\/smyc-text><\/h1>/)
  assert.match(html, /font-size:32px/)
  assert.match(html, /Hahmlet/)
  assert.match(html, /placeholder="공지 제목 또는 내용 검색"/)
})

test('formatted page descriptions keep the existing explicit line break and unstyled remainder', () => {
  const doc = empty()
  doc.copy['notices.description'] = '새 소식\n함께 확인해요'
  doc.textStyles = { shared: { 'notices.description': { text: '새 소식\n함께 확인해요', runs: [{ start: 0, end: 2, style: { fontSize: 28 } }] } } }
  const html = render(doc)
  assert.match(html, /notices-page__description"><smyc-text[^>]+><smyc-copy[^>]+>새 <\/smyc-copy>소식<br\/>함께 확인해요<\/smyc-text><\/p>/)
})

test('default and stale or other-device styles preserve the same NoticesPage markup', () => {
  const baseline = render()
  const stale = empty()
  stale.textStyles = { shared: { 'notices.title': { text: '옛 제목', runs: [{ start: 0, end: 2, style: { fontSize: 44 } }] } } }
  assert.equal(render(stale), baseline)
  const mobile = empty()
  mobile.textStyles = { mobile: { 'notices.title': { text: '공지사항', runs: [{ start: 0, end: 2, style: { fontSize: 44 } }] } } }
  assert.equal(render(mobile), baseline)
})
