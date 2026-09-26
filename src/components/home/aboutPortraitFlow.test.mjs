import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('./aboutPortraitFlow.ts', import.meta.url), 'utf8').catch(() => 'export {}')
const api = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64')}`)

test('the approved two-line desktop composition stays at its original coordinates', () => {
  assert.deepEqual(api.getAboutPortraitFlow(214, 58), { copyShift: 0, bodyShift: 0, sectionExtra: 0 })
})

test('a taller title moves the summary, photograph and section boundary together', () => {
  const flow = api.getAboutPortraitFlow(442, 58)
  assert.equal(flow.copyShift, 228)
  assert.equal(flow.bodyShift, 228)
  assert.ok(Math.abs(flow.sectionExtra - 205.2) < 1e-9)
})

test('a longer summary adds room below itself without changing title placement', () => {
  assert.deepEqual(api.getAboutPortraitFlow(214, 116), { copyShift: 0, bodyShift: 58, sectionExtra: 52.2 })
})
