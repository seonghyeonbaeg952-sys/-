import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { AdminRecordForm } = await vite.ssrLoadModule('/src/components/admin/AdminRecordForm.tsx')
const { AdminTable } = await vite.ssrLoadModule('/src/components/admin/AdminTable.tsx')

test('structured receipt metadata stays out of scalar inputs and is not rendered as a React child', () => {
  const row = { id: 'fixture', title: '제목', terms_snapshot: { message: 'private snapshot sentinel' } }
  const html = renderToStaticMarkup(createElement(AdminRecordForm, {
    fields: [{ name: 'title', label: '제목', type: 'text' }], initialData: row, onSubmit: async () => true,
  }))
  assert.doesNotMatch(html, /private snapshot sentinel|\[object Object\]/)
  const table = renderToStaticMarkup(createElement(AdminTable, { columns: [{ header: '원문', value: 'terms_snapshot' }], rows: [row] }))
  assert.match(table, /상세에서 확인/)
  assert.doesNotMatch(table, /private snapshot sentinel|\[object Object\]/)
})

test('date-time CMS fields show formatted Seoul input without changing ordinary field values', () => {
  const markup = renderToStaticMarkup(createElement(AdminRecordForm, {
    fields: [
      { name: 'recruitment_starts_at', label: '모집 시작', type: 'datetime-local', formatValue: () => '2026-09-01T09:00' },
      { name: 'title', label: '제목', type: 'text' },
    ],
    initialData: { id: 'example', recruitment_starts_at: '2026-09-01T00:00:00Z', title: '원래 제목' },
    onSubmit: async () => true,
  }))
  assert.match(markup, /value="2026-09-01T09:00"/)
  assert.match(markup, /value="원래 제목"/)
})

test('stored signatures never load an arbitrary remote image and valid original PNGs remain visible', () => {
  const render = signature_image_url => renderToStaticMarkup(createElement(AdminRecordForm, {
    fields: [{ name: 'signature_image_url', label: '서명', type: 'signature', readOnly: true }],
    initialData: { id: 'fixture', signature_image_url }, onSubmit: async () => true,
  }))
  const remote = render('https://example.invalid/tracker.png')
  assert.doesNotMatch(remote, /tracker\.png|<img/)
  assert.match(remote, /서명 형식을 확인/)
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0v8AAAAASUVORK5CYII='
  assert.ok(render(png).includes(png))
})
