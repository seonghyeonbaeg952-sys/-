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
