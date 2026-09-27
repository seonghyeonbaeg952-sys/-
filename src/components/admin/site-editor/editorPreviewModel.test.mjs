import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-editor-preview-ui-test', logLevel: 'silent', root: process.cwd(), server: { middlewareMode: true } })
const model = await vite.ssrLoadModule('/src/components/admin/site-editor/editorPreviewModel.ts').catch(() => ({}))
after(() => vite.close())

test('preview accepts only the current frame reply with matching origin, nonce, page and protocol', () => {
  assert.equal(typeof model.readEditorPreviewReply, 'function')
  const source = {}
  const expected = { source, origin: 'https://choir.example', nonce: '11111111-1111-4111-8111-111111111111', page: 'join' }
  const data = { type: 'smyc-editor:ready', version: 1, nonce: expected.nonce, page: 'join' }
  const event = { source, origin: expected.origin, data }
  assert.equal(model.readEditorPreviewReply(event, expected)?.type, 'smyc-editor:ready')
  for (const changed of [
    { ...event, source: {} }, { ...event, origin: 'https://attacker.example' },
    ...[{ nonce: 'old-nonce' }, { page: 'contact' }, { version: 2 }, { type: 'smyc-editor:draft' }, { extra: true }].map(patch => ({ ...event, data: { ...data, ...patch } })),
  ]) assert.equal(model.readEditorPreviewReply(changed, expected), null)
})

test('applied acknowledgements require a positive integer sequence', () => {
  const source = {}
  const expected = { source, origin: 'https://choir.example', nonce: '11111111-1111-4111-8111-111111111111', page: 'join' }
  const data = { type: 'smyc-editor:applied', version: 1, nonce: expected.nonce, page: 'join', sequence: 2 }
  assert.equal(model.readEditorPreviewReply({ source, origin: expected.origin, data }, expected)?.sequence, 2)
  for (const sequence of [undefined, 0, -1, 1.5, '2', Infinity]) assert.equal(model.readEditorPreviewReply({ source, origin: expected.origin, data: { ...data, sequence } }, expected), null)
})

test('the current iframe can request a valid public editor destination', () => {
  const source = {}, nonce = '11111111-1111-4111-8111-111111111111'
  const expected = { source, origin: 'https://choir.example', nonce, page: 'home' }
  const data = { type: 'smyc-editor:navigate', version: 1, nonce, page: 'home', sequence: 4, requestId: nonce, target: { page: 'spirit', path: '/spirit' } }
  assert.deepEqual(model.readEditorPreviewReply({ source, origin: expected.origin, data }, expected), data)
  assert.equal(model.readEditorPreviewReply({ source: {}, origin: expected.origin, data }, expected), null)
})

test('the authenticated frame may report stable add-box sections without exposing DOM access', () => {
  const source = {}
  const expected = { source, origin: 'https://choir.example', nonce: '11111111-1111-4111-8111-111111111111', page: 'home' }
  const data = { type: 'smyc-editor:anchors', version: 1, nonce: expected.nonce, page: 'home', sequence: 3,
    anchors: [{ id: 'main-content', label: '본문 아래' }] }
  assert.deepEqual(model.readEditorPreviewReply({ source, origin: expected.origin, data }, expected), data)
  assert.equal(model.readEditorPreviewReply({ source: {}, origin: expected.origin, data }, expected), null)
})
