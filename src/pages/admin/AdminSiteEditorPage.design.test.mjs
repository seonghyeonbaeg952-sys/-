import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const fixtureWorkspace = { session: null, sessions: {}, action: null, loading: true, message: null, error: null, revisions: [], historyLoading: false, historyError: null }
globalThis.__designWorkspace = fixtureWorkspace
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true },
  plugins: [{ name: 'editor-read-state', enforce: 'pre',
    resolveId(source) { if (source.endsWith('/site-editor/useEditorWorkspace')) return '\0editor-read-state' },
    load(id) { if (id === '\0editor-read-state') return 'export const useEditorWorkspace=()=>globalThis.__designWorkspace;' },
  }] })
const { AdminSiteEditorPage } = await vite.ssrLoadModule('/src/pages/admin/AdminSiteEditorPage.tsx')
after(async () => { delete globalThis.__designWorkspace; await vite.close() })

test('editor selects the current page through one compact labelled chooser rather than a second permanent menu', () => {
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/admin/editor?page=about'] }, React.createElement(AdminSiteEditorPage)))
  assert.ok(html.includes('aria-label="편집할 화면: 합창단 소개"'), 'The selected page must have a clearly labelled chooser')
  assert.ok(!html.includes('site-editor__page-list'), 'A second permanent menu crowds the actual editor')
  assert.ok(html.includes('임시저장') && html.includes('게시'), 'Saving and publishing must remain distinct')
  assert.ok(html.includes('aria-pressed="true"'), 'The editing device needs an explicit active state')
})
