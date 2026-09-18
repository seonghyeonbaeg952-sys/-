import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { TEXT_LAYOUT_CATALOG } = await vite.ssrLoadModule('/src/content/textLayoutCatalog.ts')
const spirit = await vite.ssrLoadModule('/src/constants/spiritContent.ts')
const cases = [
  ['notices', '/src/pages/public/NoticesPage.tsx', 'NoticesPage', {}],
  ['concerts', '/src/pages/public/ConcertsPage.tsx', 'ConcertsPage', {}],
  ['gallery', '/src/pages/public/GalleryPage.tsx', 'GalleryPage', {}],
  ['contact', '/src/pages/public/ContactPage.tsx', 'ContactPage', {}],
  ['accompanist', '/src/components/about/AccompanistProfiles.tsx', 'AccompanistProfiles', { people: [] }],
  ['members', '/src/components/about/MembersArchiveExperience.tsx', 'MembersArchiveExperience', { members: [] }],
  ['history', '/src/components/about/HistoryCueSheetExperience.tsx', 'HistoryCueSheetExperience', { history: [{ id: 'history', year: '2025', title: '공연', content: '기록', is_visible: true, display_order: 1 }], shouldUseLegacyFallback: false }],
  ['about', '/src/components/about/AboutOverviewExperience.tsx', 'AboutOverviewExperience', {}],
  ['spirit', '/src/components/spirit/SpiritHeritageExperience.tsx', 'SpiritHeritageExperience', { hero: spirit.defaultSpiritHero, motetMeaning: spirit.defaultMotetMeaning, cta: spirit.defaultSpiritCta, manifestoText: spirit.spiritManifestoCopy.paragraphs.join('\n\n'), values: spirit.spiritValues }],
  ['conductor', '/src/components/about/ConductorProfileDocument.tsx', 'ConductorProfileDocument', {}],
  ['join', '/src/components/join/JoinGuide.tsx', 'JoinGuide', { activeSection: 'all', applicationHref: '/join?section=application', faqs: [], getSectionHref: section => `/join?section=${section}`, joinInfo: { id: 'join', target: '모집 대상', description: '지원 소개', parts: '모집 파트', audition_process: '오디션 절차', preparation: '', rehearsal_time: '토요일', rehearsal_location: '연습실', application_period: '별도 안내', contact: '', is_visible: true } }],
]
const loaded = await Promise.all(cases.map(async ([page, path, name, props]) => [page, (await vite.ssrLoadModule(path))[name], props]))
function render(Component, props, isPreview, documents = {}, device = 'desktop') {
  const value = { documents, device, isPreview, copy: (_page, _key, fallback) => fallback }
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SiteEditorContext, { value }, createElement(Component, props))))
}

for (const [page, Component, props] of loaded) test(`${page} registers every declared nonrepeating block only in preview and retains default markup`, () => {
  const publicHtml = render(Component, props, false)
  const previewHtml = render(Component, props, true)
  const ids = [...previewHtml.matchAll(/data-site-layout="([^"]+)"/g)].map(match => match[1])
  const expected = TEXT_LAYOUT_CATALOG.filter(item => item.page === page).map(item => item.id)
  assert.deepEqual(ids.sort(), expected.sort(), 'Each semantic block must have one real native target, not just a catalogue entry')
  assert.doesNotMatch(publicHtml, /data-site-layout=|smyc-layout/)
  const withoutPreviewMetadata = previewHtml.replace(/ data-site-layout(?:-group|-value)?="[^"]*"/g, '')
  assert.equal(withoutPreviewMetadata, publicHtml)
})

test('every registered non-home block consumes only its device layout and keeps the original text', () => {
  for (const [page, Component, props] of loaded) {
    const expected = TEXT_LAYOUT_CATALOG.filter(item => item.page === page).map(item => item.id)
    const documents = { [page]: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {}, textLayouts: {
      desktop: Object.fromEntries(expected.map(id => [id, { width: 47, textAlign: 'center' }])),
    } } }
    const html = render(Component, props, true, documents)
    for (const id of expected) {
      const opening = html.match(new RegExp(`<[^>]+data-site-layout="${id.replaceAll('.', '\\.')}"[^>]*>`))?.[0]
      assert.ok(opening, id)
      assert.match(opening, /width:47%/, id)
      assert.match(opening, /text-align:center/, id)
    }
    assert.equal(render(Component, props, false, documents, 'mobile'), render(Component, props, false), page)
  }
})

test('compact history registers one title and one paragraph, never its repeated history rows', () => {
  const [, Component, props] = loaded.find(([page]) => page === 'history')
  const html = render(Component, { ...props, compact: true }, true)
  assert.deepEqual([...html.matchAll(/data-site-layout="([^"]+)"/g)].map(match => match[1]).sort(), ['history.intro.description', 'history.intro.title'])
})
