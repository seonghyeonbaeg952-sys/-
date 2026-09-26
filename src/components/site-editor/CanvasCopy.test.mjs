import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { FormattedCopy } = await vite.ssrLoadModule('/src/components/site-editor/FormattedCopy.tsx')
const value = { copy: (_p, _k, fallback) => fallback, documents: {}, device: 'desktop', isPreview: false }
const render = context => renderToStaticMarkup(React.createElement(SiteEditorContext, { value: context },
  React.createElement('h1', null, React.createElement(FormattedCopy, { page: 'notices', id: 'notices.title', text: '공지사항' }, React.createElement('em', null, '공지사항')))))

test('default public rendering never adds selection wrappers or changes the original child elements', () => {
  assert.equal(render(value), '<h1><em>공지사항</em></h1>')
  assert.equal(render({ ...value, isPreview: true }), '<h1><em>공지사항</em></h1>')
})

test('only an explicitly connected preview registry exposes an inert selectable text target', () => {
  const registry = { register: () => () => {}, subscribe: () => () => {}, getActiveId: () => null }
  const html = render({ ...value, isPreview: true, canvas: registry })
  assert.match(html, /<smyc-edit-target[^>]*data-canvas-target=/)
  assert.match(html, /<em>공지사항<\/em>/)
  assert.doesNotMatch(html, /contenteditable|textarea/)
  assert.equal(render({ ...value, canvas: registry }), '<h1><em>공지사항</em></h1>')
})
test('each source-owned text box can be selected for layout without changing an unedited public page', () => {
  const registry = { register: () => () => {}, subscribe: () => () => {}, getActiveId: () => null }
  const preview = render({ ...value, isPreview: true, canvas: registry })
  assert.match(preview, /data-site-layout="notices.title"/)
  assert.match(preview, /data-site-layout-group="notices.copy"/)
  assert.equal(render(value), '<h1><em>공지사항</em></h1>')
  const changed = render({ ...value, documents: { notices: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {}, textLayouts: { desktop: { 'notices.title': { offsetX: 24, width: 60 } } } } } })
  assert.match(changed, /<smyc-edit-target[^>]*style="[^"]*translate:24px 0px/)
  assert.match(changed, /width:60%/)
})
