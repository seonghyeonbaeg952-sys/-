import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
const { EditorPreview } = await vite.ssrLoadModule('/src/components/admin/site-editor/EditorPreview.tsx')
const { siteCopyDefinitions } = await vite.ssrLoadModule('/src/content/siteCopyCatalog.ts')
const originalWindow = globalThis.window
globalThis.window = { location: { origin: 'https://editor.test' } }
after(async () => {
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
  await vite.close()
})
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
function render(overrides = {}) {
  const documents = { notices: empty() }
  const props = {
    page: 'notices', label: '공지 목록', path: '/notices?lang=ko', device: 'desktop', documents, locked: false,
    context: { editorPage: 'notices', previewPage: 'notices', device: 'desktop', scope: 'desktop', documents,
      loadedOwners: new Set(['notices']), defaultsTrusted: true, defaults: {} },
    onDeviceChange() {}, onCommit() {}, onActiveChange() {}, onSave() {}, onLayoutChange() {}, onBoxAdd() {}, onBoxRemove() {},
    ...overrides,
  }
  return renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(EditorPreview, props)))
}

test('Korean and English previews use their explicitly selected live public routes', () => {
  assert.match(render(), /src="\/notices\?lang=ko&amp;site-editor-preview=/)
  assert.match(render({ storageScope: 'sample-english', path: '/notices?lang=en' }), /src="\/notices\?lang=en&amp;site-editor-preview=/)
  for (const path of ['/notices?lang=ko', '/samplex/notices?lang=en', '/sample/notices?lang=en', '/admin/editor?lang=en', 'https://other.test/sample/notices?lang=en']) {
    const html = render({ storageScope: 'sample-english', path })
    assert.doesNotMatch(html, /<iframe/)
    assert.match(html, /허용된 홈페이지 경로만 미리볼 수 있습니다/)
  }
})

test('preview draft validation honours the supplied English character limit', () => {
  const field = siteCopyDefinitions.find(item => item.key === 'notices.title')
  const options = { storageScope: 'sample-english', path: '/notices?lang=en', documents: { notices: { ...empty(), copy: { 'notices.title': 'Our news' } } } }
  const valid = render({ ...options, copyDefinitions: [{ ...field, maxLength: 8 }] })
  assert.doesNotMatch(valid, /입력 범위를 벗어난 값/)
  const invalid = render({ ...options, copyDefinitions: [{ ...field, maxLength: 4 }] })
  assert.match(invalid, /입력 범위를 벗어난 값/)
})

test('English empty previews identify their workspace without linking to original content managers', () => {
  const html = render({ storageScope: 'sample-english', path: null })
  assert.match(html, /영어 초안 편집·미리보기/)
  assert.match(html, /영문 화면에 사용할 공개 항목이 없습니다/)
  assert.doesNotMatch(html, /연결된 콘텐츠 관리에서 항목을 등록/)
})
