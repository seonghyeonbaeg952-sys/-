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
test('source-owned text keys also have stable per-page box identities', () => {
  assert.deepEqual(getTextLayoutDefinition('notices.title'), { id: 'notices.title', page: 'notices', label: '문구', group: 'notices.copy' })
  assert.equal(getTextLayoutDefinition('notices.__proto__.title'), undefined)
})
test('manual width enables wrapping without a parent-width cap; an untouched title has no wrap marker', () => {
  const html = render({ layout: { width: 150 } })
  assert.match(html, /width:150%/)
  assert.match(html, /data-site-manual-width/)
  assert.doesNotMatch(html, /max-width:100%/)
  assert.doesNotMatch(render({ layout: { offsetX: 5 } }), /data-site-manual-width/)
})

test('explicit line height renders on the native box without changing fonts, transforms or other devices', () => {
  const html = render({ layout: { offsetX: 5, lineHeight: 1.6 } })
  assert.match(html, /line-height:1.6/)
  assert.match(html, /--site-copy-line-height:1.6/)
  assert.match(html, /data-site-manual-line-height/)
  assert.match(html, /height:auto/)
  assert.match(html, /transform:scale\(1\);color:red/)
  assert.doesNotMatch(render({ layout: { offsetX: 5 } }), /line-height|data-site-manual-line-height/)
  assert.equal(render({ layout: { lineHeight: 1.6 }, device: 'mobile' }), render())
})

test('NOW/NEXT dots are labelled position-only native targets rather than editable text', () => {
  for (const [name, label] of [['now', 'NOW 옆 점'], ['next', 'NEXT 옆 점']]) {
    const definition = getTextLayoutDefinition(`spirit.lineage.${name}.dot`)
    assert.equal(definition?.positionOnly, true)
    assert.equal(definition.label, label)
    assert.equal(definition.page, 'spirit')
  }
})

function renderDot(device = 'desktop', preview = false) {
  const id = 'spirit.lineage.now.dot'
  const documents = { spirit: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {}, textLayouts: {
    desktop: { [id]: { offsetX: 12, offsetY: -8, width: 80, textAlign: 'center', lineHeight: 2 } },
  } } }
  return renderToStaticMarkup(React.createElement(SiteEditorContext, { value: { documents, device, isPreview: preview } },
    React.createElement(EditableLayout, { id }, React.createElement('span', { 'aria-hidden': true, className: 'dot', style: { transform: 'scale(1)' } }))))
}

test('dot offsets preserve shape and motion; typography values cannot resize a decorative target', () => {
  const html = renderDot('desktop', true)
  assert.match(html, /data-site-layout="spirit.lineage.now.dot"/)
  assert.match(html, /translate:12px -8px/)
  assert.match(html, /transform:scale\(1\)/)
  assert.doesNotMatch(html, /width:|text-align:|line-height:|data-site-manual-/)
  assert.doesNotMatch(html, /data-canvas-copy-key/)
  assert.equal(renderDot('mobile'), '<span aria-hidden="true" class="dot" style="transform:scale(1)"></span>')
})
