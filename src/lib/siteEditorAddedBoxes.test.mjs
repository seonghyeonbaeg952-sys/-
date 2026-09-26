import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const api = await vite.ssrLoadModule('/src/lib/siteEditorAddedBoxes.ts').catch(() => ({}))
const { validateSiteEditorDocument } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const uid = '11111111-1111-4111-8111-111111111111'

test('creating a text box stores only plain text and its section anchor in the existing validated document', () => {
  const original = empty()
  const result = api.addEditorTextBox(original, 'home', 'home-about-portrait', '새로운 소개', uid)
  assert.equal(result.id, `home.box.${uid}.text`)
  assert.deepEqual(result.document.copy, { [`home.box.${uid}.text`]: '새로운 소개', [`home.box.${uid}.anchor`]: 'home-about-portrait' })
  assert.deepEqual(original, empty())
  assert.deepEqual(api.listEditorTextBoxes(result.document, 'home'), [{ id: result.id, anchor: 'home-about-portrait', text: '새로운 소개' }])
  assert.equal(validateSiteEditorDocument(result.document), null)
})

test('malformed or incomplete added boxes cannot be saved as a valid CMS document', () => {
  const created = api.addEditorTextBox(empty(), 'home', 'home-about-portrait', '문구', uid)
  const noAnchor = structuredClone(created.document); delete noAnchor.copy[`home.box.${uid}.anchor`]
  assert.notEqual(validateSiteEditorDocument(noAnchor), null)
  const tooLong = structuredClone(created.document); tooLong.copy[created.id] = '가'.repeat(1001)
  assert.notEqual(validateSiteEditorDocument(tooLong), null)
  const deviceAnchor = structuredClone(created.document); deviceAnchor.deviceCopy.desktop = { [`home.box.${uid}.anchor`]: 'other-section' }
  assert.notEqual(validateSiteEditorDocument(deviceAnchor), null)
})

test('sections without an id get a stable unique class anchor instead of falling back to the whole page', () => {
  const sections = [
    { id: '', classes: ['flow-section', 'home-about-portrait', 'relative'] },
    { id: '', classes: ['flow-section', 'join-open-score', 'relative'] },
    { id: 'home-spirit-chorus-orbit', classes: ['flow-section', 'home-spirit-chorus-orbit'] },
  ]
  assert.deepEqual(api.chooseEditorSectionAnchors(sections), ['class-home-about-portrait', 'class-join-open-score', 'home-spirit-chorus-orbit'])
})

test('box creation rejects empty text, unsafe anchors, duplicate ids and unbounded quantities', () => {
  for (const [anchor, text] of [['home-about-portrait', ''], ['../admin', '문구'], ['section[onclick]', '문구'], ['home-about-portrait', '<script>x</script>']]) {
    assert.throws(() => api.addEditorTextBox(empty(), 'home', anchor, text, uid))
  }
  const created = api.addEditorTextBox(empty(), 'home', 'home-about-portrait', '문구', uid)
  assert.throws(() => api.addEditorTextBox(created.document, 'home', 'home-about-portrait', '또 다른 문구', uid))
})

test('removing a newly added box also removes its per-device layout and formatting without touching other copy', () => {
  const created = api.addEditorTextBox(empty(), 'home', 'home-about-portrait', '문구', uid)
  const document = { ...created.document, copy: { ...created.document.copy, 'home.title': '기존' },
    textLayouts: { desktop: { [created.id]: { offsetX: 20 }, 'home.about.title': { offsetY: 8 } } },
    textStyles: { desktop: { [created.id]: { text: '문구', runs: [] } } } }
  const removed = api.removeEditorTextBox(document, 'home', created.id)
  assert.deepEqual(removed.copy, { 'home.title': '기존' })
  assert.deepEqual(removed.textLayouts.desktop, { 'home.about.title': { offsetY: 8 } })
  assert.equal(removed.textStyles, undefined)
})
