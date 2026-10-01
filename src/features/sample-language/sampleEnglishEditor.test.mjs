import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const fixtureKey = '__sampleEnglishEditorResourceFixture'
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const source = { notices: { ...empty(), copy: { 'notices.title': '공지사항' }, deviceCopy: {
  mobile: { 'notices.title': '합창단 소식' }, tablet: { 'notices.title': '공연 소식' },
} } }
const popup = { id: 'popup-fixture', title: '새 공개 팝업 제목', content: '새 공개 팝업 내용을 번역해 주세요.', button_label: '새 공지 확인', button_href: '/join?ref=모집', image_url: '/이미지.png', is_visible: true }
const calls = []
globalThis[fixtureKey] = {
  async load(name) {
    calls.push(name)
    if (name === 'loadPublicEditorPages') return { data: Object.entries(source).map(([page_key, document]) => ({ page_key, document, published_at: '2026-09-28T00:00:00Z' })), error: null }
    if (name === 'getPublicPopupNotices') return { data: [popup], error: null }
    return { data: [], error: null }
  },
}
const publicReaders = ['getPublicSiteTexts', 'getPublicAboutData', 'getPublicJoinData', 'getPublicContactData', 'getPublicConcerts', 'getPublicNotices', 'getPublicGalleryImages', 'getPublicVideos', 'getPublicPosters', 'getPublicHeroSlides', 'getPublicPopupNotices']
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true },
  plugins: [{ name: 'english-resource-fixtures', enforce: 'pre',
    resolveId(name, importer) {
      if (!importer?.replaceAll('\\', '/').endsWith('/features/sample-language/sampleEnglishEditor.ts')) return
      if (name.endsWith('/lib/publicData')) return '\0english-public-fixtures'
      if (name.endsWith('/lib/siteEditorApi')) return '\0english-publication-fixtures'
    },
    load(id) {
      const names = id === '\0english-public-fixtures' ? publicReaders : id === '\0english-publication-fixtures' ? ['loadPublicEditorPages'] : []
      if (names.length) return names.map(name => `export const ${name}=()=>globalThis.${fixtureKey}.load('${name}');`).join('\n')
    },
  }],
})
after(async () => { delete globalThis[fixtureKey]; await vite.close() })
const { buildSampleEnglishDefaults, loadSampleEnglishResources, sampleEnglishDefinitions } = await vite.ssrLoadModule('/src/features/sample-language/sampleEnglishEditor.ts')
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
const { sampleContentKey } = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')
const { resolveEditorCopy } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const { makeCanvasGrant, commitCanvasGrant } = await vite.ssrLoadModule('/src/components/admin/site-editor/editorCanvasController.ts')

test('English defaults remain independent when Korean site text and published copy change', () => {
  const raw = { 'home.current.about.title': '함께 빚어가는 화음,\n다음 세대의 노래', 'home.mobile.current.about.title': '함께 빚어가는 화음,\n세대의 노래' }
  const snapshot = structuredClone({ raw, source })
  const { defaults, deviceDefaults } = buildSampleEnglishDefaults()
  assert.equal(defaults['notices.title'], 'Notices')
  assert.equal(deviceDefaults.desktop['notices.title'], 'Notices')
  assert.equal(deviceDefaults.mobile['notices.title'], 'Notices')
  assert.equal(deviceDefaults.tablet['notices.title'], 'Notices')
  raw['home.mobile.current.about.title'] = '한글 새 제목'
  source.notices.copy['notices.title'] = '한글 새 공지 제목'
  const changed = buildSampleEnglishDefaults()
  assert.deepEqual(changed, { defaults, deviceDefaults })
  assert.notDeepEqual({ raw, source }, snapshot)
  source.notices.copy['notices.title'] = snapshot.source.notices.copy['notices.title']
  const sharedKey = sampleContentKey('공연')
  assert.equal(defaults[sharedKey], translateEnglish('공연'))
  for (const map of Object.values(deviceDefaults)) assert.equal(Object.hasOwn(map, sharedKey), false)
})

test('device-aware English defaults issue matching grants on mobile, tablet and desktop, including shared editing', () => {
  const baseline = buildSampleEnglishDefaults()
  const document = empty()
  for (const device of ['mobile', 'tablet', 'desktop']) {
    const displayed = translateEnglish('공지사항', 'notices.title')
    for (const scope of [device, 'shared']) {
      const ctx = { editorPage: 'notices', previewPage: 'notices', device, scope, storageScope: 'sample-english',
        documents: { notices: document }, loadedOwners: new Set(['notices']), defaultsTrusted: true,
        defaults: { ...baseline.defaults, ...baseline.deviceDefaults[device] }, copyDefinitions: sampleEnglishDefinitions, baseDraftSequence: 1 }
      const block = { id: 'notices-title', label: 'Notice title', visibleText: displayed, revision: 1,
        segments: [{ source: { ownerPage: 'notices', scope, key: 'notices.title', text: displayed }, sourceStart: 0, sourceEnd: displayed.length, visibleStart: 0, visibleEnd: displayed.length, transform: 'exact' }],
        capabilities: { format: true, replaceText: true } }
      const grant = makeCanvasGrant(ctx, block, { editId: 'device-fixture', fieldVersionFactory: () => 'device-version' })
      assert.equal(grant.ok, true, `${device}/${scope}: ${grant.message}`)
      const field = grant.issued.grant.fields[0]
      assert.equal(field.text, displayed)
      const changes = [{ source: field.source, fieldVersion: field.fieldVersion, edits: [{ start: 0, end: displayed.length, text: 'Updated news', runs: [] }] }]
      assert.equal(commitCanvasGrant(ctx, grant.issued, changes).ok, true)
      assert.equal(commitCanvasGrant({ ...ctx, device: device === 'mobile' ? 'desktop' : 'mobile' }, grant.issued, changes).ok, false)
    }
  }
  assert.deepEqual(document, empty())
})

test('resource loading uses independent English defaults and inventories public popup copy without exposing its URL', async () => {
  calls.length = 0
  const before = structuredClone({ source, popup })
  const result = await loadSampleEnglishResources()
  assert.equal(calls.filter(name => name === 'getPublicSiteTexts').length, 0)
  assert.equal(calls.filter(name => name === 'loadPublicEditorPages').length, 0)
  assert.equal(calls.filter(name => name === 'getPublicPopupNotices').length, 1)
  assert.equal(result.deviceDefaults.mobile['notices.title'], 'Notices')
  for (const text of [popup.title, popup.content, popup.button_label]) {
    const key = sampleContentKey(text)
    assert.ok(result.definitions.some(field => field.key === key && field.page === 'common'))
    assert.equal(result.defaults[key], text)
  }
  assert.equal(result.definitions.some(field => field.key === sampleContentKey(popup.button_href)), false)
  assert.deepEqual({ source, popup }, before)
})
