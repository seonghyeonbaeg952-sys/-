import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const data = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
async function load(path, aliases = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  code = code.replace(/^import ['"][^'"]+\.css['"];?\s*$/gm, '')
  for (const [name, replacement] of Object.entries({ react: pathToFileURL(require.resolve('react')).href, 'react-dom': pathToFileURL(require.resolve('react-dom')).href, 'react/jsx-runtime': pathToFileURL(require.resolve('react/jsx-runtime')).href, ...aliases })) code = code.replaceAll(`'${name}'`, `'${replacement}'`).replaceAll(`"${name}"`, `"${replacement}"`)
  return data(code)
}
const model = await load('../../lib/intakeModel.ts')
const mod = await import(await load('./AdminSupportPledgesPage.tsx', {
  '../../components/admin/AdminCrudListPage': data('export function AdminCrudListPage() { return null }'),
  '../../lib/intakeModel': model,
}))
const props = mod.AdminSupportPledgesPage().props
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0v8AAAAASUVORK5CYII='
const row = { id: 'fixture', name: '후원자', phone: '010-0000-0000', email: 'fixture@example.invalid', gender: 'female', birth_date: '1990-01-02', address: '주소 원문\n둘째 줄', member_type: 'individual', amount: 10000, custom_amount: null, depositor: '입금자', pledge_date: '2026-09-17', signer_name: '서명자', signature_image_url: png, privacy_agreed: true, status: 'new', created_at: '2026-09-17T00:00:00Z', terms_snapshot: { title: '원본 제목', subtitle: '원본 부제', message: '  원문\n\n끝 <script>unsafe()</script> ', privacy_notice: '동의한 원문', print_note: '인쇄 안내', footer_note: '하단 원문', bank_account_number: null, internal_note: 'INTERNAL-SENTINEL' } }

test('pledge detail exposes printing and original terms without permitting answer mutation', () => {
  assert.equal(typeof props.renderBeforeForm, 'function', 'CMS must offer a readable receipt and print action')
  const html = renderToStaticMarkup(props.renderBeforeForm(row))
  assert.match(html, /후원약정서 인쇄/)
  assert.match(html, /접수 당시/)
  assert.deepEqual(props.preparePayload({ status: 'done', name: 'tampered', terms_snapshot: {} }), { status: 'done' })
})
test('print preserves the submitted answers, consent, entire original wording and PNG signature', () => {
  assert.equal(typeof mod.SupportPledgePrintDocument, 'function', 'a receipt-only print document is required')
  const html = renderToStaticMarkup(mod.SupportPledgePrintDocument({ row }))
  for (const value of ['후원자', '010-0000-0000', 'fixture@example.invalid', '1990-01-02', '주소 원문\n둘째 줄', '입금자', '2026-09-17', '서명자', '10,000원', '동의함', '원본 제목', '원본 부제', '동의한 원문', '인쇄 안내', '하단 원문', png]) assert.ok(html.includes(value), value)
  assert.ok(html.includes('  원문\n\n끝 &lt;script&gt;unsafe()&lt;/script&gt; '))
  assert.doesNotMatch(html, /<input|<button|<textarea|<script|INTERNAL-SENTINEL/)
})
test('historical missing terms are explicitly unknown, never replaced by current terms; unsafe signature URLs never load', () => {
  assert.equal(typeof mod.SupportPledgePrintDocument, 'function')
  const html = renderToStaticMarkup(mod.SupportPledgePrintDocument({ row: { ...row, terms_snapshot: null, signature_image_url: 'https://example.invalid/tracker.png' } }))
  assert.match(html, /접수 당시 약정 원문이 별도로 저장되지 않은/)
  assert.doesNotMatch(html, /tracker\.png|src=|원본 제목/)
})
