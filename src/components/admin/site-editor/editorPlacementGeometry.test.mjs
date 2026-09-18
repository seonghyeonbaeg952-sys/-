import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { constrainLayoutInput, alignLayoutToBlock } = await vite.ssrLoadModule('/src/components/admin/site-editor/editorPlacementGeometry.ts')
const block = { id: 'notices.intro.title', group: 'notices.intro', label: '제목', value: { offsetX: 1000 }, renderedOffsets: { x: 140, y: 0 }, rect: { left: 240, top: 100, width: 200, height: 80 }, bounds: { left: 0, top: 0, width: 440, height: 800 } }
test('alignment starts at the actually rendered offset after boundary clamping, not the larger stored value', () => {
  const peer = { ...block, id: 'notices.intro.description', rect: { left: 120, top: 200, width: 200, height: 60 } }
  assert.equal(alignLayoutToBlock(block, peer, 'x').offsetX, 20)
  assert.equal(alignLayoutToBlock(block, peer, 'y').offsetY, 90)
})
test('numeric movement derives its original anchor from rendered geometry and clamps without drift', () => {
  assert.deepEqual(constrainLayoutInput(block, { offsetX: 20 }).value, { offsetX: 20 })
  assert.equal(constrainLayoutInput(block, { offsetX: 1000 }).value.offsetX, 140)
  assert.equal(constrainLayoutInput(block, { offsetX: -1000 }).value.offsetX, -100)
  assert.equal(constrainLayoutInput(block, { offsetY: -1000 }).value.offsetY, -100)
})
test('reset stays a removal and reference alignment cannot cross groups or self-align', () => {
  assert.deepEqual(constrainLayoutInput(block, undefined), { value: undefined, limited: false })
  assert.equal(alignLayoutToBlock(block, block, 'x'), null)
  assert.equal(alignLayoutToBlock(block, { ...block, id: 'other', group: 'elsewhere' }, 'x'), null)
})
