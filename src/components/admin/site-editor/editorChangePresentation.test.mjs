import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const compileUrl = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`
const stylesUrl = compileUrl(await readFile(new URL('../../../lib/siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const layoutsUrl = compileUrl((await readFile(new URL('../../../lib/siteEditorLayout.ts', import.meta.url), 'utf8')).replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)))
const code = ts.transpileModule(await readFile(new URL('./editorUiOptions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll("'../../../lib/siteEditorLayout'", JSON.stringify(layoutsUrl))
const options = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
test('publish and conflict summaries describe selected text and readable formatting, not internal JSON', () => {
  assert.equal(typeof options.formatEditorChangeValue, 'function')
  const text = options.formatEditorChangeValue('textStyle', JSON.stringify({ text: '서울 합창단', runs: [{ start: 0, end: 2, style: { fontFamily: 'hahmlet', fontSize: 32 } }] }))
  assert.match(text, /서울/)
  assert.match(text, /함렛/)
  assert.match(text, /32px/)
  assert.ok(!text.includes('fontFamily'))
  assert.equal(options.formatEditorChangeValue('copy', ''), '(빈 문구)')
  assert.equal(options.formatEditorChangeValue('textStyle', JSON.stringify({ text: '문구', runs: [] })), '글자별 서식 해제')
})

test('publish review names color and emphasis changes even when font and size do not change', () => {
  const text = options.formatEditorChangeValue('textStyle', JSON.stringify({ text: '합창단', runs: [{ start: 0, end: 2, style: { color: '#68233a', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' } }] }))
  assert.match(text, /#68233a/i)
  assert.match(text, /700/)
  assert.match(text, /기울임/)
  assert.match(text, /밑줄/)
})

test('publish review names block line spacing alongside geometry and alignment', () => {
  assert.equal(options.formatEditorChangeValue('textLayout', JSON.stringify({ lineHeight: 1.6 })), '줄간격 1.6배')
  const text = options.formatEditorChangeValue('textLayout', JSON.stringify({ offsetX: 12, width: 85, textAlign: 'center', lineHeight: 2 }))
  assert.match(text, /가로 이동 12px/)
  assert.match(text, /너비 85%/)
  assert.match(text, /가운데 정렬/)
  assert.match(text, /줄간격 2배/)
  assert.equal(options.formatEditorChangeValue('textLayout', JSON.stringify({})), '기존 상자 배치 사용')
})
