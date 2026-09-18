import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { EditableLayout } = await vite.ssrLoadModule('/src/components/site-editor/EditableLayout.tsx')
const { TEXT_LAYOUT_CATALOG, getTextLayoutDefinition } = await vite.ssrLoadModule('/src/content/textLayoutCatalog.ts')
function render({ layout, device = 'desktop', preview = false, id = 'notices.intro.title' } = {}) {
  const documents = { notices: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {}, ...(layout ? { textLayouts: { desktop: { [id]: layout } } } : {}) } }
  return renderToStaticMarkup(React.createElement(SiteEditorContext, { value: { documents, device, isPreview: preview } },
    React.createElement(EditableLayout, { id }, React.createElement('h1', { className: 'original', style: { transform: 'scale(1)', color: 'red' } }, '원래 제목'))))
}
test('no layout retains the exact original native markup without an editor wrapper', () => {
  assert.equal(render(), '<h1 class="original" style="transform:scale(1);color:red">원래 제목</h1>')
})
test('layout is device-specific and does not overwrite transform or typography', () => {
  const html = render({ layout: { offsetX: 12, offsetY: 8, width: 80, textAlign: 'center' } })
  assert.match(html, /translate:12px 8px/)
  assert.match(html, /width:80%/)
  assert.match(html, /text-align:center/)
  assert.match(html, /transform:scale\(1\);color:red/)
  assert.doesNotMatch(html, /data-site-layout/)
  assert.equal(render({ layout: { offsetX: 12 }, device: 'mobile' }), render())
})
test('only preview registers a stable allowlisted block; unknown IDs are no-ops', () => {
  assert.match(render({ preview: true }), /data-site-layout="notices.intro.title"/)
  assert.equal(render({ preview: true, id: 'unknown' }), render())
  assert.equal(getTextLayoutDefinition('__proto__'), undefined)
})
test('catalog IDs are unique and every group is scoped to the owning page', () => {
  assert.ok(TEXT_LAYOUT_CATALOG.length >= 20)
  assert.equal(new Set(TEXT_LAYOUT_CATALOG.map(item => item.id)).size, TEXT_LAYOUT_CATALOG.length)
  for (const block of TEXT_LAYOUT_CATALOG) {
    assert.ok(block.id.startsWith(`${block.page}.`))
    assert.ok(block.group.startsWith(`${block.page}.`))
  }
})
