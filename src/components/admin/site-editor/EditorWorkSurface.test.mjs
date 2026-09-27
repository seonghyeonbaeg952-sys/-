import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())

test('the preview and its help remain one flow independent of the placement panel height', async () => {
  const { EditorWorkSurface } = await vite.ssrLoadModule('/src/components/admin/site-editor/EditorWorkSurface.tsx')
  const children = [React.createElement('p', { key: 'help' }, '도움말'), React.createElement('iframe', { key: 'preview', title: '미리보기' })]
  const panel = React.createElement('section', { className: 'placement-toolbar' }, '배치 도구')
  for (const placing of [false, true]) {
    const tree = EditorWorkSurface({ placing, panel: placing ? panel : null, children })
    assert.equal(tree.props.children.length, 2)
    const stack = tree.props.children[1]
    assert.equal(stack.props.className, 'site-editor__canvas-stack')
    assert.equal(stack.props.children, children)
    assert.equal(tree.props.children[0], placing ? panel : null)
    assert.equal(tree.props.className.includes('site-editor__editing-surface--placing'), placing)
  }
})

test('the placement sidebar occupies one grid row, never stretches multiple help rows', async () => {
  const css = await readFile(new URL('./editor-placement-toolbar.css', import.meta.url), 'utf8')
  const rule = css.match(/\.site-editor__editing-surface--placing > \.placement-toolbar\s*\{([^}]+)\}/)?.[1]
  assert.match(rule ?? '', /grid-row:\s*1\s*;/)
  assert.doesNotMatch(rule ?? '', /span/)
  assert.match(css, /\.site-editor__canvas-stack\s*\{[^}]*min-width:\s*0/)
  const preview = await readFile(new URL('./EditorPreview.tsx', import.meta.url), 'utf8')
  assert.match(preview, /<EditorWorkSurface/)
})
