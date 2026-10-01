import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const options = await vite.ssrLoadModule('/src/components/admin/site-editor/editorUiOptions.ts')

test('fit mode enlarges a mobile preview to use the editing canvas without changing its CSS viewport', () => {
  assert.equal(options.getEditorPreviewScale('mobile', 1145, true), 2)
  assert.equal(options.getEditorPreviewScale('mobile', 350, true), 350 / 390)
  assert.equal(options.getEditorPreviewScale('mobile', 1145, false), 1)
  assert.equal(options.getEditorPreviewScale('desktop', 1145, true), 1145 / 1440)
})
