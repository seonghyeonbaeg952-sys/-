import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return []
  return [ ...(predicate(tree) ? [tree] : []), ...[tree.props?.children].flat(Infinity).flatMap(child => find(child, predicate)) ]
}

test('closing the inspector leaves its input mounted and exposes a labelled reopen action', async () => {
  const { EditorWorkSurface } = await vite.ssrLoadModule('/src/components/admin/site-editor/EditorWorkSurface.tsx')
  const panel = React.createElement('input', { defaultValue: '未適用の入力' })
  let toggles = 0
  const tree = EditorWorkSurface({ placing: true, panel, children: React.createElement('iframe', { title: '作業画面' }),
    panelOpen: false, panelId: 'test-inspector', onPanelToggle: () => { toggles++ } })
  const button = find(tree, node => node.type === 'button' && node.props['aria-controls'] === 'test-inspector')[0]
  assert.ok(button, 'The collapsed inspector needs an accessible reopen control')
  assert.equal(button.props['aria-expanded'], false)
  const body = find(tree, node => node.props?.id === 'test-inspector')[0]
  assert.equal(body.props.hidden, true)
  assert.equal(body.props.children, panel, 'A visibility change must not unmount a numeric draft')
  button.props.onClick()
  assert.equal(toggles, 1)
})

test('an active input locks inspector folding in both the control and its callback', async () => {
  const { EditorWorkSurface } = await vite.ssrLoadModule('/src/components/admin/site-editor/EditorWorkSurface.tsx')
  let toggles = 0
  const tree = EditorWorkSurface({ placing: true, panel: '未適用の入力', children: '画面', panelOpen: true,
    panelId: 'locked-inspector', panelLocked: true, onPanelToggle: () => { toggles++ } })
  const button = find(tree, node => node.type === 'button' && node.props['aria-controls'] === 'locked-inspector')[0]
  assert.ok(button)
  assert.equal(button.props.disabled, true)
  button.props.onClick()
  assert.equal(toggles, 0, 'Unapplied input must remain visible even when a callback is invoked directly')
})

test('the preview and its help remain one flow independent of the placement panel height', async () => {
  const { EditorWorkSurface } = await vite.ssrLoadModule('/src/components/admin/site-editor/EditorWorkSurface.tsx')
  const children = [React.createElement('p', { key: 'help' }, '도움말'), React.createElement('iframe', { key: 'preview', title: '미리보기' })]
  const panel = React.createElement('section', { className: 'placement-toolbar' }, '배치 도구')
  for (const placing of [false, true]) {
    const tree = EditorWorkSurface({ placing, panel: placing ? panel : null, children })
    assert.equal(tree.props.children.length, 2)
    const stack = tree.props.children[0]
    assert.equal(stack.props.className, 'site-editor__canvas-stack')
    assert.equal(stack.props.children, children)
    assert.equal(find(tree, node => node.type === 'aside').length, placing ? 1 : 0)
    if (placing) assert.equal(find(tree, node => node.props?.id === 'site-editor-inspector')[0].props.children, panel)
    assert.equal(tree.props.className.includes('site-editor__editing-surface--placing'), placing)
  }
})

test('the placement sidebar occupies one grid row, never stretches multiple help rows', async () => {
  const css = await readFile(new URL('./editor-placement-toolbar.css', import.meta.url), 'utf8')
  const rule = css.match(/\.site-editor__editing-surface--placing > \.site-editor__inspector\s*\{([^}]+)\}/)?.[1]
  assert.match(rule ?? '', /grid-row:\s*1\s*;/)
  assert.doesNotMatch(rule ?? '', /span/)
  assert.match(css, /\.site-editor__canvas-stack\s*\{[^}]*min-width:\s*0/)
  const preview = await readFile(new URL('./EditorPreview.tsx', import.meta.url), 'utf8')
  assert.match(preview, /<EditorWorkSurface/)
})
