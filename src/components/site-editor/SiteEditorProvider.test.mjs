import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-editor-provider-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorProvider } = await vite.ssrLoadModule('/src/components/site-editor/SiteEditorProvider.tsx')
const { SiteCopy } = await vite.ssrLoadModule('/src/components/site-editor/SiteCopy.tsx')
const { useSiteEditor } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')

test('published copy and placement use the same phone/tablet composition after landscape rotation', () => {
  const previous = globalThis.window
  function Device() { return React.createElement('output', null, useSiteEditor().device) }
  try {
    for (const [width, height, coarsePointer, expected] of [
      [390, 844, true, 'mobile'], [844, 390, true, 'mobile'],
      [768, 1024, true, 'tablet'], [1180, 820, true, 'tablet'],
      [1440, 900, false, 'desktop'],
    ]) {
      globalThis.window = { innerWidth: width, innerHeight: height, matchMedia: () => ({ matches: coarsePointer }) }
      globalThis.window.parent = globalThis.window
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/spirit'] }, React.createElement(SiteEditorProvider, null, React.createElement(Device))))
      assert.equal(html, `<output>${expected}</output>`, `${width}×${height}`)
    }
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('CMS previews keep the explicit width-based editing device even with tablet touch input', () => {
  const previous = globalThis.window
  function Device() { return React.createElement('output', null, useSiteEditor().device) }
  try {
    for (const [width, height, expected] of [[390, 844, 'mobile'], [768, 1024, 'tablet'], [1440, 900, 'desktop']]) {
      globalThis.window = { innerWidth: width, innerHeight: height, parent: {}, matchMedia: () => ({ matches: true }) }
      const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/spirit?site-editor-preview=12345678-1234-4234-8234-123456789012'] }, React.createElement(SiteEditorProvider, null, React.createElement(Device))))
      assert.ok(html.includes(`<output>${expected}</output>`), `${width}×${height}`)
    }
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
})

test('unmodified public pages render exactly their existing DOM without a new loader, wrapper, style or inert state', () => {
  const child = React.createElement('main', { id: 'original' }, React.createElement('h1', null, '기존 홈페이지'), React.createElement('button', { type: 'button' }, '기존 동작'))
  const original = renderToStaticMarkup(child)
  const rendered = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/join'] }, React.createElement(SiteEditorProvider, null, child)))
  assert.equal(rendered, original)
})

test('public copy defaults keep literal whitespace and inline markup without adding DOM elements', () => {
  const child = React.createElement('p', null, '앞 ', React.createElement(SiteCopy, { page: 'common', id: 'common.test', fallback: '원문' }), ' 뒤')
  assert.equal(renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(SiteEditorProvider, null, child))), '<p>앞 원문 뒤</p>')
})

test('administrator routes remain independent of all public editor presentation', () => {
  const child = React.createElement('main', null, '관리자')
  assert.equal(renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/admin'] }, React.createElement(SiteEditorProvider, null, child))), '<main>관리자</main>')
})

test('unchanged copy preserves original literal newlines rather than introducing new line-break elements', () => {
  const child = React.createElement(SiteCopy, { page: 'common', id: 'common.test', fallback: '기존\n원문' })
  assert.equal(renderToStaticMarkup(child), '기존\n원문')
})
