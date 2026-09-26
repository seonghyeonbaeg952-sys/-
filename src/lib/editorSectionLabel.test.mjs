import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('./editorSectionLabel.ts', import.meta.url), 'utf8').catch(() => 'export {}')
const api = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText).toString('base64')}`)

test('section choices keep the visible space between heading lines', () => {
  assert.equal(api.getEditorSectionLabel({ innerText: '함께 빚어가는 화음,\n다음 세대의 노래', textContent: '함께 빚어가는 화음,다음 세대의 노래' }, null), '함께 빚어가는 화음, 다음 세대의 노래')
  assert.equal(api.getEditorSectionLabel({ innerText: 'SEOUL\nMOTET\nYOUTH\nCHOIR', textContent: 'SEOULMOTETYOUTHCHOIR' }, null), 'SEOUL MOTET YOUTH CHOIR')
  assert.equal(api.getEditorSectionLabel({ innerText: '함께 배우고,함께 무대에 서는\n다음 목소리를 기다립니다', textContent: '함께 배우고,함께 무대에 서는다음 목소리를 기다립니다' }, null), '함께 배우고, 함께 무대에 서는 다음 목소리를 기다립니다')
})

test('a section without a visible heading has a readable fallback', () => {
  assert.equal(api.getEditorSectionLabel(null, '후원 안내'), '후원 안내')
  assert.equal(api.getEditorSectionLabel(null, null), '구역')
})
