import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { classifyHomeViewport } = await vite.ssrLoadModule('/src/components/home/useHomeResponsiveViewport.ts')

test('a landscape tablet keeps the tablet composition even above 1024px', () => {
  assert.equal(classifyHomeViewport({ width: 1180, height: 820, coarsePointer: false }), 'tablet')
  assert.equal(classifyHomeViewport({ width: 1366, height: 1024, coarsePointer: true }), 'tablet')
  assert.equal(classifyHomeViewport({ width: 1460, height: 1024, coarsePointer: true }), 'tablet')
  assert.equal(classifyHomeViewport({ width: 1460, height: 1024, coarsePointer: false }), 'tablet')
  assert.equal(classifyHomeViewport({ width: 1600, height: 1024, coarsePointer: true }), 'tablet')
})

test('a landscape phone keeps the mobile composition despite its wide viewport', () => {
  assert.equal(classifyHomeViewport({ width: 844, height: 390, coarsePointer: true }), 'mobile')
  assert.equal(classifyHomeViewport({ width: 932, height: 430, coarsePointer: false }), 'mobile')
})

test('portrait phone and ordinary desktop retain their modes', () => {
  assert.equal(classifyHomeViewport({ width: 390, height: 844, coarsePointer: true }), 'mobile')
  assert.equal(classifyHomeViewport({ width: 1440, height: 900, coarsePointer: false }), 'desktop')
})
