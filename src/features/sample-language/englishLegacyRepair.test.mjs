import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { repairLegacyEnglishDocument } = await vite.ssrLoadModule('/src/features/sample-language/englishLegacyRepair.ts')
const { validateSiteEditorDocument } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')

const old = { schemaVersion: 1, copy: {}, appearance: {}, deviceCopy: {
  desktop: { 'spirit.spiritManifesto.text2': 'we learn ', 'spirit.spiritManifesto.text3': 'art',
    'spirit.spiritManifesto.text4': 'the', 'spirit.spiritManifesto.text5': 'of listening together.' },
  tablet: { 'spirit.spiritManifesto.text2': 'we learn ', 'spirit.spiritManifesto.text4': 'the',
    'spirit.spiritManifesto.text5': 'of listening together..' },
  mobile: { 'spirit.spiritManifesto.text5': 'listening togrthrer.' },
}, textLayouts: { desktop: { 'spirit.spiritManifesto.text3': { offsetX: 60.5 } }, tablet: { 'spirit.spiritManifesto.text4': { offsetX: -31.8 } } } }

test('known persisted English manifesto typo and displaced fragments are repaired without touching the original', () => {
  const before = structuredClone(old)
  const fixed = repairLegacyEnglishDocument('spirit', old)
  assert.deepEqual(old, before)
  assert.equal(fixed.deviceCopy.desktop['spirit.spiritManifesto.text2'], 'we learn the ')
  assert.equal(fixed.deviceCopy.desktop['spirit.spiritManifesto.text4'], ' of ')
  assert.equal(fixed.deviceCopy.desktop['spirit.spiritManifesto.text5'], 'listening together.')
  assert.equal(fixed.deviceCopy.tablet['spirit.spiritManifesto.text5'], 'listening together.')
  assert.equal(fixed.deviceCopy.mobile['spirit.spiritManifesto.text5'], 'listening together.')
  assert.equal(fixed.textLayouts?.desktop?.['spirit.spiritManifesto.text3'], undefined)
  assert.equal(fixed.textLayouts?.tablet?.['spirit.spiritManifesto.text4'], undefined)
  assert.equal(validateSiteEditorDocument(fixed), null)
})

test('later intentional English edits and other pages are left alone', () => {
  const current = { ...old, deviceCopy: { desktop: { 'spirit.spiritManifesto.text5': 'New English line.' } } }
  assert.equal(repairLegacyEnglishDocument('spirit', current), current)
  assert.equal(repairLegacyEnglishDocument('home', old), old)
})
