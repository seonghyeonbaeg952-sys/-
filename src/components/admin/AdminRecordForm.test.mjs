import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { AdminRecordForm } = await vite.ssrLoadModule('/src/components/admin/AdminRecordForm.tsx')

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
