import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-admin-members-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { AdminMembersPage } = await vite.ssrLoadModule('/src/pages/admin/AdminMembersPage.tsx')
const { AdminRecordForm } = await vite.ssrLoadModule('/src/components/admin/AdminRecordForm.tsx')

test('CMS 단원 편집은 미표시·반주자·기존 기타 파트를 다시 열어도 선택을 유지한다', () => {
  const { fields, defaultValues, filters } = AdminMembersPage().props
  for (const [part, label] of [['hidden', '미표시'], ['accompanist', '반주자'], ['other', '기타']]) {
    const html = renderToStaticMarkup(createElement(AdminRecordForm, {
      fields, defaultValues, initialData: { id: 'fixture', part }, onSubmit: async () => true,
    }))
    assert.ok(html.includes(`<option value="${part}" selected="">${label}</option>`), `stored ${part} should remain selected`)
    assert.ok(filters.find(filter => filter.column === 'part').options.some(option => option.value === part))
  }
  assert.equal(defaultValues.name_display_type, 'hidden')
})

test('CMS 그룹 미표시를 다시 열어도 선택과 이름 공개 설정을 유지한다', () => {
  const { fields, defaultValues, filters } = AdminMembersPage().props
  const html = renderToStaticMarkup(createElement(AdminRecordForm, {
    fields, defaultValues, initialData: { id: 'fixture', group_type: 'hidden' }, onSubmit: async () => true,
  }))
  assert.ok(html.includes('<option value="hidden" selected="">미표시</option>'))
  assert.ok(filters.find(filter => filter.column === 'group_type').options.some(option => option.value === 'hidden'))
  assert.equal(defaultValues.name_display_type, 'hidden')
})
