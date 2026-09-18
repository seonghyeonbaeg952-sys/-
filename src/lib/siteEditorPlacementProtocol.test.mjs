import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const api = await vite.ssrLoadModule('/src/lib/siteEditorPlacementProtocol.ts').catch(() => ({}))
const nonce = '11111111-1111-4111-8111-111111111111'
const envelope = { channel: 'smyc-placement', version: 1, nonce, previewPage: 'notices', sequence: 1 }
const rect = { left: 40, top: 100, width: 400, height: 80 }
const block = { id: 'notices.hero.title', label: '제목', group: 'hero', value: {}, rect, bounds: { left: 0, top: 60, width: 800, height: 600 } }
const grant = { editId: 'edit-1', id: block.id, device: 'desktop', baseDraftSequence: 2, before: {} }
const valid = [
  ['frame-to-parent', { type: 'placement-ready' }],
  ['frame-to-parent', { type: 'placement-register', appliedDraftSequence: 2, blocks: [block] }],
  ['frame-to-parent', { type: 'placement-register', appliedDraftSequence: 2, blocks: [{ ...block, renderedOffsets: { x: 100, y: -80.5 } }] }],
  ['frame-to-parent', { type: 'placement-selection', id: block.id, editId: null }],
  ['frame-to-parent', { type: 'placement-begin', requestId: 'request-1', id: block.id, appliedDraftSequence: 2 }],
  ['frame-to-parent', { type: 'placement-abort', requestId: 'request-1' }],
  ['frame-to-parent', { type: 'placement-commit', editId: 'edit-1', operationId: 'op-1', baseDraftSequence: 2, outcome: 'apply', value: { offsetX: 10, offsetY: -20, width: 50, textAlign: 'center' } }],
  ['frame-to-parent', { type: 'placement-commit', editId: 'edit-1', operationId: 'op-1', outcome: 'cancel' }],
  ['frame-to-parent', { type: 'placement-mode-result', operationId: 'op-1', accepted: false, reason: 'busy' }],
  ['frame-to-parent', { type: 'placement-draft-status', editId: 'edit-1', draftSequence: 3, status: 'deferred' }],
  ['parent-to-frame', { type: 'placement-mode', operationId: 'op-1', mode: 'place', device: 'desktop' }],
  ['parent-to-frame', { type: 'placement-select', id: block.id }],
  ['parent-to-frame', { type: 'placement-aborted', requestId: 'request-1' }],
  ['parent-to-frame', { type: 'placement-grant', requestId: 'request-1', accepted: true, grant }],
  ['parent-to-frame', { type: 'placement-grant', requestId: 'request-1', accepted: false, reason: 'stale' }],
  ['parent-to-frame', { type: 'placement-result', editId: 'edit-1', operationId: 'op-1', status: 'committed', resumeDraftSequence: 3 }],
  ['parent-to-frame', { type: 'placement-result', editId: 'edit-1', operationId: 'op-1', status: 'rejected', reason: 'stale' }],
]
test('every placement message is strictly parsed and accepted only from its exact authenticated direction', () => {
  assert.equal(typeof api.acceptPlacementMessage, 'function')
  const source = {}, expected = { source, origin: 'https://example.invalid', nonce, previewPage: 'notices', lastSequence: 0 }
  for (const [direction, payload] of valid) {
    const data = { ...envelope, ...payload }, event = { source, origin: expected.origin, data }
    assert.deepEqual(api.parsePlacementMessage(data), data)
    assert.ok(api.acceptPlacementMessage(event, { ...expected, direction }))
    for (const bad of [{ source: {} }, { origin: 'https://other.invalid' }, { lastSequence: 1 }, { nonce: '22222222-2222-4222-8222-222222222222' }, { previewPage: 'home' }, { direction: direction === 'frame-to-parent' ? 'parent-to-frame' : 'frame-to-parent' }]) {
      assert.equal(api.acceptPlacementMessage(event, { ...expected, direction, ...bad }), null)
    }
  }
})
test('extra keys, unsafe prototypes, unknown styles, invalid dimensions and forged persistent instance IDs are rejected', () => {
  assert.equal(typeof api.parsePlacementMessage, 'function')
  for (const payload of [
    { type: 'placement-register', appliedDraftSequence: 2, blocks: [{ ...block, instanceId: 'copy-123' }] },
    { type: 'placement-register', appliedDraftSequence: 2, blocks: [{ ...block, value: { transform: 'rotate(1deg)' } }] },
    { type: 'placement-register', appliedDraftSequence: 2, blocks: [{ ...block, rect: { ...rect, width: -1 } }] },
    { type: 'placement-register', appliedDraftSequence: 2, blocks: [block, block] },
    { type: 'placement-grant', requestId: 'r1', accepted: true, grant: { ...grant, before: { offsetX: 2001 } } },
    { type: 'placement-mode', operationId: 'op', mode: 'place', device: 'shared' },
    { type: 'placement-commit', editId: 'e', operationId: 'o', outcome: 'cancel', value: {} },
    { type: 'placement-ready', extra: true },
    { type: 'placement-grant', requestId: 'r1', accepted: false, reason: new String('busy') },
  ]) assert.equal(api.parsePlacementMessage({ ...envelope, ...payload }), null)
  assert.equal(api.parsePlacementMessage(Object.assign(Object.create({ unsafe: true }), envelope, { type: 'placement-ready' })), null)
  const getter = { ...envelope, type: 'placement-ready' }
  Object.defineProperty(getter, 'sequence', { enumerable: true, get() { throw new Error('must not run') } })
  assert.equal(api.parsePlacementMessage(getter), null)
})
test('display-only rendered offsets reject nonfinite and out-of-range coordinates', () => {
  for (const renderedOffsets of [{ x: Infinity, y: 0 }, { x: 0, y: NaN }, { x: 2001, y: 0 }, { x: 0, y: -2001 }]) {
    assert.equal(api.parsePlacementMessage({ ...envelope, type: 'placement-register', appliedDraftSequence: 2, blocks: [{ ...block, renderedOffsets }] }), null)
  }
})
test('display-only rendered offsets require exactly two numeric coordinates without extra fields', () => {
  for (const renderedOffsets of [{ x: 10 }, { x: '10', y: 20 }, { x: 10, y: 20, trusted: true }]) {
    assert.equal(api.parsePlacementMessage({ ...envelope, type: 'placement-register', appliedDraftSequence: 2, blocks: [{ ...block, renderedOffsets }] }), null)
  }
})
