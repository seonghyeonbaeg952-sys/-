import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-editor-language-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const presentation = existsSync(fileURLToPath(new URL('./siteEditorLanguagePresentation.ts', import.meta.url)))
  ? await vite.ssrLoadModule('/src/components/site-editor/siteEditorLanguagePresentation.ts') : {}
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const sample = language => ({ enabled: true, isSample: false, language, setLanguage() {}, translate: translateEnglish,
  translateData: value => value, translateHome: value => value, href: value => value })

test('loaded Korean copy retains its exact authored value, while the English publication stays independent', () => {
  assert.equal(typeof presentation.createEditorLanguagePresentation, 'function')
  const original = { spirit: { ...empty(), copy: { 'spirit.spiritHero.text2': '최신 한국어 문구' } } }
  const english = { spirit: { ...empty(), copy: { 'spirit.spiritHero.text2': 'Published English heading' } } }
  const ko = presentation.createEditorLanguagePresentation(original, original, sample('ko'), 'desktop')
  const en = presentation.createEditorLanguagePresentation(original, english, sample('en'), 'desktop')
  assert.equal(ko.copy('spirit', 'spirit.spiritHero.text2', '기본 문구'), '최신 한국어 문구')
  assert.equal(ko.copy('spirit', 'spirit.spiritHero.text3', '기본 한국어 그대로'), '기본 한국어 그대로')
  assert.equal(en.copy('spirit', 'spirit.spiritHero.text2', '최신 한국어 문구'), 'Published English heading')
  assert.equal(original.spirit.copy['spirit.spiritHero.text2'], '최신 한국어 문구')
})

test('an explicitly blank English fragment remains blank rather than reviving the Korean default', () => {
  assert.equal(typeof presentation.createEditorLanguagePresentation, 'function')
  const english = { spirit: { ...empty(), copy: { 'spirit.spiritManifesto.text2': '' } } }
  const en = presentation.createEditorLanguagePresentation({}, english, sample('en'), 'mobile')
  assert.equal(en.copy('spirit', 'spirit.spiritManifesto.text2', '배웁니다'), '')
})
