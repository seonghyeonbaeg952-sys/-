import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const code = ts.transpileModule(await readFile(new URL('./editorUiOptions.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
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
