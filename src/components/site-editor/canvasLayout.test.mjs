import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('./canvasLayout.ts', import.meta.url), 'utf8').catch(() => 'export {}')
const api = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64')}`)
test('editing keeps the full line box width, not the tight selected-glyph width', () => {
  assert.equal(typeof api.getCanvasOverlayBox, 'function')
  assert.deepEqual(api.getCanvasOverlayBox({ left: 84, top: 182, width: 640, paddingLeft: 0, paddingRight: 0, paddingTop: 0, borderLeft: 0, borderRight: 0, borderTop: 0 }, { left: 84, top: 174.8, right: 327.45 }, true), { left: 84, top: 182, width: 640, calibrate: false })
})
test('a slice uses remaining inline room while padding and borders stay outside the editable text', () => {
  assert.deepEqual(api.getCanvasOverlayBox({ left: 10, top: 20, width: 300, paddingLeft: 12, paddingRight: 12, paddingTop: 8, borderLeft: 1, borderRight: 1, borderTop: 1 }, { left: 100, top: 30, right: 150 }, false), { left: 100, top: 30, width: 197, calibrate: true })
})
