import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const dataModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
async function loadModule(file, imports = {}) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  for (const [specifier, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`'${specifier}'`, `'${url}'`).replaceAll(`"${specifier}"`, `"${url}"`)
  }
  return dataModule(outputText)
}
const modelUrl = await loadModule('../../lib/joinRecruitment.ts')
const imports = {
  'react/jsx-runtime': pathToFileURL(require.resolve('react/jsx-runtime')).href,
  '../../lib/joinRecruitment': modelUrl,
}
for (const name of ['AdminCrudListPage', 'AdminPageTitle', 'AdminSingleRecordSection']) {
  imports[`../../components/admin/${name}`] = dataModule(`export function ${name}(){return null}`)
}
const { AdminJoinPage } = await import(await loadModule('./AdminJoinPage.tsx', imports))
const props = AdminJoinPage().props.children.find(child => child.props?.table === 'join_info').props

test('admin recruitment fields use local datetime controls explicitly formatted in Seoul time', () => {
  const start = props.fields.find(field => field.name === 'recruitment_starts_at')
  const end = props.fields.find(field => field.name === 'recruitment_ends_at')
  assert.ok(start && end, 'both period fields must be available')
  assert.equal(start.type, 'datetime-local')
  assert.equal(end.type, 'datetime-local')
  assert.ok(start.label.includes('한국 시간'))
  assert.equal(start.formatValue('2026-09-08T00:30:00Z'), '2026-09-08T09:30')
})

test('admin saves ISO boundaries and rejects reversed periods before the persistence layer', () => {
  assert.equal(typeof props.preparePayload, 'function')
  assert.equal(typeof props.validatePayload, 'function')
  const row = { recruitment_starts_at: null, recruitment_ends_at: null }
  const payload = props.preparePayload({ title: '입단 안내', recruitment_starts_at: '2026-09-08T09:00',
    recruitment_ends_at: '2026-09-08T08:59' }, row)
  assert.equal(payload.recruitment_starts_at, '2026-09-08T00:00:00.000Z')
  assert.equal(payload.recruitment_ends_at, '2026-09-07T23:59:00.000Z')
  assert.equal(payload.title, '입단 안내')
  assert.ok(props.validatePayload(payload, row))
})

test('legacy schema can save ordinary copy but cannot pretend to persist a configured period', () => {
  assert.equal(typeof props.preparePayload, 'function')
  const legacy = { id: 'old-join-info', title: '기존 입단 안내' }
  const blank = props.preparePayload({ title: '수정 입단 안내', recruitment_starts_at: null, recruitment_ends_at: null }, legacy)
  assert.deepEqual(blank, { title: '수정 입단 안내' })
  assert.equal(props.validatePayload(blank, legacy), null)
  const configured = props.preparePayload({ title: '수정 입단 안내', recruitment_starts_at: '2026-09-08T09:00' }, legacy)
  assert.ok(props.validatePayload(configured, legacy).includes('데이터베이스'))
})
