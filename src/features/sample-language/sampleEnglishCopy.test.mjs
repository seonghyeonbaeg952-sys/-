import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { resolveEnglishPageCopy, resolveEnglishHomeCopy } = await vite.ssrLoadModule('/src/features/sample-language/sampleEnglishCopy.ts')
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
const { resolveHomeEditorContent } = await vite.ssrLoadModule('/src/lib/homeEditorOverrides.ts')

const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })

test('English page copy ignores changed Korean CMS copy until its own English document changes', () => {
  const english = { notices: empty() }
  const read = korean => resolveEnglishPageCopy(english, 'notices', 'notices.title', korean, 'desktop', translateEnglish)
  assert.equal(read('공지사항'), 'Notices')
  assert.equal(read('한글 편집 후 새 제목'), 'Notices')
  english.notices.copy['notices.title'] = 'News from the Choir'
  assert.equal(read('한글 편집 후 새 제목'), 'News from the Choir')
})

test('the existing published English editorial wording does not fall back to older catalogue prose', () => {
  const docs = { spirit: empty() }
  assert.equal(resolveEnglishPageCopy(docs, 'spirit', 'spirit.motetMeaning.text1', '모테트는', 'desktop', translateEnglish), '')
  assert.equal(resolveEnglishPageCopy(docs, 'spirit', 'spirit.motetMeaning.text2', '여러 ', 'desktop', translateEnglish), 'Different ')
  assert.equal(resolveEnglishPageCopy(docs, 'spirit', 'spirit.faithSection.text1', '정직한', 'desktop', translateEnglish), 'Our approach')
})

test('English home copy stays stable when Korean home copy changes on mobile and tablet', () => {
  const english = { home: empty() }
  for (const device of ['mobile', 'tablet']) {
    const original = resolveHomeEditorContent({}, {}, device)
    const edited = structuredClone(original)
    edited.about.title = '한글 초안 새 문구'
    const first = resolveEnglishHomeCopy(original, english, device, translateEnglish)
    const second = resolveEnglishHomeCopy(edited, english, device, translateEnglish)
    assert.equal(second.about.title, first.about.title)
    assert.notEqual(second.about.title, edited.about.title)
  }
})
