import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { applyPlacementChange } = await vite.ssrLoadModule('/src/components/admin/site-editor/editorPlacementController.ts')
const { createEditorSession } = await vite.ssrLoadModule('/src/components/admin/site-editor/editorSessionModel.ts')
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const session = () => createEditorSession({ page_key: 'notices', draft: empty(), published: null, version: 1, updated_at: '', published_at: null })
test('placement updates only the trusted block/device and preserves original copy', () => {
  const source = session(); source.document.copy['notices.title'] = '소식'
  const result = applyPlacementChange(source, 'notices', 'desktop', 'notices.intro.title', {}, { offsetX: 20, textAlign: 'center' })
  assert.equal(result.ok, true)
  assert.deepEqual(result.document.textLayouts.desktop['notices.intro.title'], { offsetX: 20, textAlign: 'center' })
  assert.equal(result.document.copy['notices.title'], '소식')
  assert.equal(source.document.textLayouts, undefined)
})
test('unknown/cross-page IDs and non-finite values fail closed', () => {
  for (const [page, id, next] of [['notices', 'home.about.title', {}], ['notices', '__proto__', {}], ['notices', 'notices.intro.title', { offsetY: Infinity }]]) {
    assert.equal(applyPlacementChange(session(), page, 'desktop', id, {}, next).ok, false)
  }
})
test('a stale gesture cannot overwrite a newer placement or conflict', () => {
  const first = applyPlacementChange(session(), 'notices', 'desktop', 'notices.intro.title', {}, { offsetX: 20 })
  assert.equal(applyPlacementChange(first.session, 'notices', 'desktop', 'notices.intro.title', {}, { offsetX: 30 }).ok, false)
  const reset = applyPlacementChange(first.session, 'notices', 'desktop', 'notices.intro.title', { offsetX: 20 }, undefined)
  assert.equal(reset.ok, true)
  assert.equal(reset.document.textLayouts, undefined)
})
