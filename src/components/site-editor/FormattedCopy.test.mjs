import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { SiteCopy } = await vite.ssrLoadModule('/src/components/site-editor/SiteCopy.tsx')

function render(document, fallback = '서울모테트 합창단') {
  const value = { documents: { common: document }, device: 'desktop', isPreview: false, copy: (_p, key, original) => document.copy[key] ?? original }
  return renderToStaticMarkup(React.createElement(SiteEditorContext, { value }, React.createElement('h2', null, React.createElement(SiteCopy, { page: 'common', id: 'test', fallback }))))
}
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })

test('a style applied to two selected characters leaves all other text unwrapped and unchanged', () => {
  const doc = empty()
  doc.textStyles = { shared: { test: { text: '서울모테트 합창단', runs: [{ start: 0, end: 2, style: { fontFamily: 'hahmlet', fontSize: 32 } }] } } }
  const html = render(doc)
  assert.match(html, /<smyc-text[^>]+><smyc-copy[^>]+>서울<\/smyc-copy>모테트 합창단<\/smyc-text><\/h2>/)
  assert.match(html, /32px/)
  assert.match(html, /Hahmlet/)
})

test('old text annotations cannot style a replaced phrase, and default newline DOM is unchanged', () => {
  const doc = empty()
  doc.textStyles = { shared: { test: { text: '옛 문구', runs: [{ start: 0, end: 2, style: { fontSize: 32 } }] } } }
  assert.equal(render(doc, '기존\n원문'), '<h2>기존\n원문</h2>')
})

test('device selection cannot leak formatting into another device', () => {
  const doc = empty()
  doc.textStyles = { mobile: { test: { text: '서울모테트 합창단', runs: [{ start: 0, end: 2, style: { fontSize: 32 } }] } } }
  assert.equal(render(doc), '<h2>서울모테트 합창단</h2>')
})

test('selected character color, weight, italic and decoration render without formatting the remainder', () => {
  const doc = empty()
  doc.textStyles = { shared: { test: { text: '서울모테트 합창단', runs: [{ start: 0, end: 2, style: { color: '#68233a', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' } }] } } }
  const html = render(doc)
  assert.match(html, /color:#68233a/)
  assert.match(html, /font-weight:700/)
  assert.match(html, /font-style:italic/)
  assert.match(html, /text-decoration:underline/)
  assert.match(html, />서울<\/smyc-copy>모테트 합창단/)
})
