import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const api = await vite.ssrLoadModule('/src/lib/accompanistProfileCopy.ts')
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { AccompanistProfileCopy } = await vite.ssrLoadModule('/src/components/about/AccompanistProfileCopy.tsx')
const { resolveEditorCopy } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const first = '11111111-1111-4111-8111-111111111111', second = '22222222-2222-4222-8222-222222222222'
const key = api.accompanistProfileCopyKey(first, 'role')
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
function render(document = empty(), order = [first, second]) {
  const documents = { accompanist: document }
  const context = { documents, device: 'desktop', isPreview: false, copy: (page, id, fallback) => resolveEditorCopy(documents, page, id, fallback, 'desktop') }
  return renderToStaticMarkup(React.createElement(SiteEditorContext, { value: context }, order.map(profileId => React.createElement('p', { key: profileId }, React.createElement(AccompanistProfileCopy, { profileId, kind: 'role' })))))
}
test('independent profile adapters keep byte-identical unedited markup and inherited legacy formatting', () => {
  assert.equal(render(), '<p>ACCOMPANIST</p><p>ACCOMPANIST</p>')
  const doc = empty(), old = 'accompanist.accompanistProfiles.english3'
  doc.copy[old] = '기존 역할'
  doc.textStyles = { shared: { [old]: { text: '기존 역할', runs: [{ start: 0, end: 2, style: { fontSize: 24 } }] } } }
  const html = render(doc)
  assert.equal((html.match(/font-size:24px/g) ?? []).length, 2)
  assert.ok(html.includes('기존'))
})
test('text and formatting changes follow one profile after reordering and preserve explicit newlines', () => {
  const doc = empty()
  doc.deviceCopy.desktop = { [key]: '첫째\n역할' }
  assert.equal(render(doc), '<p>첫째<br/>역할</p><p>ACCOMPANIST</p>')
  assert.equal(render(doc, [second, first]), '<p>ACCOMPANIST</p><p>첫째<br/>역할</p>')
  assert.equal(api.getAccompanistCopyDefinition('accompanist.profile.bad.role'), null)
  assert.equal(api.getAccompanistCopyDefinition(`accompanist.profile.${first}.name`), null)
})
