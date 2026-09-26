import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('./canvasLayout.ts', import.meta.url), 'utf8').catch(() => 'export {}')
const api = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64')}`)
test('a one-line title grows its editor horizontally while a wrapped paragraph keeps its readable column', () => {
  assert.equal(api.shouldAutoExpandCanvasLine('합창단 소개', 38, 40), true)
  assert.equal(api.shouldAutoExpandCanvasLine('합창단 소개\n상세 안내', 38, 40), false)
  assert.equal(api.shouldAutoExpandCanvasLine('긴 문단', 88, 40), false)
})
test('editing keeps the full line box width, not the tight selected-glyph width', () => {
  assert.equal(typeof api.getCanvasOverlayBox, 'function')
  assert.deepEqual(api.getCanvasOverlayBox({ left: 84, top: 182, width: 640, paddingLeft: 0, paddingRight: 0, paddingTop: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }, { left: 84, top: 174.8, right: 327.45 }, true), { left: 84, top: 182, width: 640, calibrate: false })
})
test('a slice uses remaining inline room while padding and borders stay outside the editable text', () => {
  assert.deepEqual(api.getCanvasOverlayBox({ left: 10, top: 20, width: 300, paddingLeft: 12, paddingRight: 12, paddingTop: 8, borderLeft: 1, borderRight: 1, borderTop: 1 }, { left: 100, top: 30, right: 150 }, false), { left: 100, top: 30, width: 197, calibrate: true })
})

const parent = { left: 10, top: 20, width: 500, paddingLeft: 10, paddingRight: 10, paddingTop: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }
test('inline editing grows and shrinks around its existing centre without moving its text anchor', () => {
  const glyph = { left: 210, top: 30, right: 310 }
  assert.deepEqual(api.getCanvasOverlayBox(parent, glyph, false, { naturalWidth: 240, alignment: 'center' }), { left: 140, top: 30, width: 240, calibrate: true })
  assert.deepEqual(api.getCanvasOverlayBox(parent, glyph, false, { naturalWidth: 60, alignment: 'center' }), { left: 230, top: 30, width: 60, calibrate: true })
  assert.deepEqual(api.getCanvasOverlayBox(parent, glyph, false, { naturalWidth: 900, alignment: 'center' }), { left: 20, top: 30, width: 480, calibrate: true })
})

test('inline right and left alignment keep the original edge while respecting the container and minimum width', () => {
  const glyph = { left: 210, top: 30, right: 310 }
  assert.equal(api.getCanvasOverlayBox(parent, glyph, false, { naturalWidth: 200, alignment: 'right' }).left, 110)
  assert.deepEqual(api.getCanvasOverlayBox(parent, glyph, false, { naturalWidth: 800, alignment: 'left' }), { left: 210, top: 30, width: 290, calibrate: true })
  assert.equal(api.getCanvasOverlayBox(parent, glyph, false, { naturalWidth: 0, alignment: 'center' }).width, 44)
})

test('active bounds include live glyph overflow and shrink back rather than retaining the hidden original box', () => {
  assert.equal(typeof api.getCanvasLiveBounds, 'function')
  assert.deepEqual(api.getCanvasLiveBounds({ left: 100, top: 200, width: 240, height: 24 }, { left: 98, top: 194, width: 246, height: 90 }, 24), { left: 98, top: 194, width: 246, height: 90 })
  assert.deepEqual(api.getCanvasLiveBounds({ left: 100, top: 200, width: 60, height: 24 }, { left: 100, top: 200, width: 58, height: 20 }, 24), { left: 100, top: 200, width: 60, height: 24 })
  assert.deepEqual(api.getCanvasLiveBounds({ left: 100, top: 200, width: 44, height: 0 }, null, 24), { left: 100, top: 200, width: 44, height: 24 })
})

test('a scaled heading reserves the full edited height in its own layout coordinates', () => {
  const metrics = api.getCanvasScaleMetrics({ width: 419.4, height: 136.8 }, { width: 466, height: 152 })
  assert.ok(Math.abs(metrics.x - 0.9) < 1e-9)
  assert.ok(Math.abs(metrics.y - 0.9) < 1e-9)
  assert.ok(Math.abs(api.toCanvasLayoutPixels(384, metrics.y) - 426.6666666666667) < 1e-9)
  assert.ok(Math.abs(api.toCanvasLayoutPixels(419.4, metrics.x) - 466) < 1e-9)
})

test('an unscaled heading keeps visible and reserved dimensions identical', () => {
  const metrics = api.getCanvasScaleMetrics({ width: 466, height: 152 }, { width: 466, height: 152 })
  assert.deepEqual(metrics, { x: 1, y: 1 })
  assert.equal(api.toCanvasLayoutPixels(384, metrics.y), 384)
})
