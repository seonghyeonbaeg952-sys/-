import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const api = await vite.ssrLoadModule('/src/components/admin/site-editor/editorCanvasHistory.ts').catch(() => ({}))
const doc = title => ({ schemaVersion: 1, copy: { 'notices.title': title }, deviceCopy: {}, appearance: {} })
test('completed canvas edits remain one reversible transaction without publication', () => {
  assert.equal(typeof api.recordCanvasHistory, 'function')
  const history = api.recordCanvasHistory({ past: [], future: [] }, doc('원문'), doc('새 문구'))
  const undo = api.moveCanvasHistory(history, doc('새 문구'), 'undo')
  assert.equal(undo.ok, true)
  assert.deepEqual(undo.document, doc('원문'))
  assert.deepEqual(api.moveCanvasHistory(undo.history, doc('원문'), 'redo').document, doc('새 문구'))
})
test('undo cannot overwrite later edits or a changed server snapshot', () => {
  const history = api.recordCanvasHistory({ past: [], future: [] }, doc('원문'), doc('새 문구'))
  assert.equal(api.moveCanvasHistory(history, doc('다른 관리자'), 'undo').ok, false)
  assert.equal(history.past.length, 1)
})
