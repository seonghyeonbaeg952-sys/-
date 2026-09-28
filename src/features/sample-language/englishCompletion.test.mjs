import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-english-completion-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const content = await vite.ssrLoadModule('/src/features/sample-language/sampleContentModel.ts')
const language = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
const source = async path => readFile(new URL(path, import.meta.url), 'utf8')

test('profile English records overlay text by UUID without changing Korean metadata', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  for (const resource of ['conductor', 'accompanist']) {
    assert.equal(content.validateEnglishContent(resource, { name: 'English name', role: 'Conductor', bio: 'Biography' }), null)
    assert.ok(content.validateEnglishContent(resource, { photo_url: '/private.jpg' }))
  }
  const person = { id, name: '김형수', role: '지휘자', bio: '원문', photo_url: '/portrait.jpg', is_visible: true }
  const result = content.applyEnglishContent({ conductor: person }, [{ resource: 'conductor', record_id: id, published: { name: 'Kim Hyung-su', bio: 'Biography' }, published_at: '2026-09-28T00:00:00Z' }], 'about')
  assert.equal(result.conductor.name, 'Kim Hyung-su')
  assert.equal(result.conductor.bio, 'Biography')
  assert.equal(result.conductor.photo_url, '/portrait.jpg')
  assert.equal(person.name, '김형수')
})

test('About option tabs have translated labels independent of their route keys', async () => {
  const about = await source('../../pages/public/AboutPage.tsx')
  assert.match(about, /aboutSectionTabs\.map\(/)
  assert.match(about, /translate\(tab\.label\)/)
  assert.equal(translateEnglish('연혁'), 'History')
})

test('membership form uses segmented English date and keeps native Korean date', async () => {
  const join = await source('../../components/join/JoinApplicationForm.tsx')
  assert.match(join, /<SampleDateInput[^>]*id="join-v2-birth-date"/)
  assert.doesNotMatch(join, /id="join-v2-birth-date"[^>]*type="date"/)
  assert.match(join, /isSample/)
})

test('original public links retain their path while sample links stay isolated', () => {
  assert.equal(language.publicLanguageHref('/join?section=contact#application', 'en', false), '/join?section=contact&lang=en#application')
  assert.equal(language.publicLanguageHref('/join?section=contact#application', 'ko', false), '/join?section=contact#application')
  assert.equal(language.publicLanguageHref('/join?section=contact#application', 'en', true), '/sample/join?section=contact&lang=en#application')
  assert.equal(language.resolvePublicLanguage('/about', '?lang=en', 'ko'), 'en')
  assert.equal(language.resolvePublicLanguage('/admin/editor', '?lang=en', 'ko'), 'ko')
})

test('production English remains indexable and forms remain live while sample stays read-only', async () => {
  const app = await source('../../App.tsx')
  const seo = await source('../../components/common/SeoHead.tsx')
  const forms = await Promise.all(['../../components/join/JoinApplicationForm.tsx','../../components/contact/ContactInquiryForm.tsx','../../components/contact/SupportPledgeForm.tsx'].map(source))
  assert.match(app, /<SampleLanguageProvider isSample=\{isColorSample\}>/)
  assert.match(seo, /noIndex \|\| isSample/)
  for (const form of forms) assert.match(form, /if \(isSample\)/)
})

test('English history months and concert times do not leak Korean calendar words', async () => {
  const { workflowTime } = await vite.ssrLoadModule('/src/components/common/workflowCopy.ts')
  assert.equal(language.englishHistoryMonth('6월'), 'June')
  assert.equal(language.englishHistoryMonth('7-8월'), 'July–August')
  assert.equal(workflowTime('오후 7시 30분', true), '7:30 PM')
  assert.equal(workflowTime('오후 7시 30분', false), '오후 7시 30분')
})

test('contact map actions and brochure controls translate fixed labels', async () => {
  const contact = await source('../../pages/public/ContactPage.tsx')
  const brochure = await source('../../components/sample/home-v4/HomeV4PerformanceCarousel.tsx')
  assert.match(contact, /translate\(action\.label\)/)
  assert.match(brochure, /translate\('템플릿 접기'\)/)
  assert.match(brochure, /translate\('공연 문의'\)/)
})

test('site-summary CMS hint describes its actual About metadata usage', async () => {
  const settings = await source('../../pages/admin/AdminSettingsPage.tsx')
  assert.match(settings, /검색 결과|메타 설명/)
  assert.doesNotMatch(settings, /푸터와 일부 기본 안내 화면의 짧은 단체 소개/)
})
