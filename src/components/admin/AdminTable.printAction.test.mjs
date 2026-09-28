import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-admin-print-action-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { AdminTable } = await vite.ssrLoadModule('/src/components/admin/AdminTable.tsx')

test('receipt lists name the action as detail and print on desktop and mobile', () => {
  const markup = renderToStaticMarkup(createElement(AdminTable, { columns: [{ header: '이름', value: 'name' }], rows: [{ id: 'receipt-1', name: '지원자' }], showVisibility: false, onEdit() {}, editActionLabel: '상세·인쇄' }))
  assert.equal((markup.match(/상세·인쇄/g) ?? []).length, 2)
  assert.doesNotMatch(markup, />수정</)
})
