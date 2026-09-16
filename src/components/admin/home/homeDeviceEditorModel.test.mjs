import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-home-device-editor-test', logLevel: 'silent', root: process.cwd(), server: { middlewareMode: true } })
const model = await vite.ssrLoadModule('/src/components/admin/home/homeDeviceEditorModel.ts').catch(() => ({}))
const homeContent = await vite.ssrLoadModule('/src/lib/homeContent.ts')
after(() => vite.close())

test('save validation rejects public-fallback literals before submitting a Home field', () => {
  const definition = { key: 'home.mobile.concertProgram.description', inputType: 'textarea', maxLength: 500 }
  for (const value of ['공연 일정 미정 안내', '공연 준비중', '테스트 문구', '임시 안내', '등록 예정']) {
    assert.ok(model.validateHomeEditorField(definition, value), `${value} must be rejected before save`)
  }
})

test('shared validation preserves existing public fallback and valid content normalization', () => {
  assert.equal(homeContent.normalizeHomeContentV2({
    'home.concertProgram.description': '공연 일정 미정 안내',
  }).concertProgram.description, '다가오는 공연의 날짜, 장소, 공지사항을 확인합니다. 공연 정보가 확정되면 이 섹션에 반영됩니다.')
  assert.equal(homeContent.normalizeHomeContentV2({
    'home.concertProgram.description': '  다음 정기연주회 소식을 확인하세요.  ',
  }).concertProgram.description, '다음 정기연주회 소식을 확인하세요.')
})

test('save validation preserves valid text and rejects unsafe, blank, overlong and fractional values', () => {
  const definition = { key: 'home.mobile.concertProgram.description', inputType: 'textarea', maxLength: 100 }
  assert.equal(model.validateHomeEditorField(definition, '다가오는 공연 일정을 확인하세요.'), null)
  for (const value of ['', '  ', '<script>alert(1)</script>', 'TODO', 'href="#"', '가'.repeat(101)]) {
    assert.ok(model.validateHomeEditorField(definition, value))
  }
  const order = { inputType: 'number', min: 1, max: 10 }
  assert.ok(model.validateHomeEditorField(order, '2.5'))
  assert.ok(model.validateHomeEditorField(order, '0'))
  assert.equal(model.validateHomeEditorField(order, '2'), null)
})

const desktop = [{ key: 'home.about.title', defaultValue: 'Desktop default' }]
const tablet = [{ key: 'home.tablet.about.title', defaultValue: 'Tablet default' }]
const mobile = [
  { key: 'home.mobile.about.title', defaultValue: 'Mobile default' },
  { key: 'home.mobile.about.description', defaultValue: 'Mobile body default' },
]
const all = [...desktop, ...tablet, ...mobile]
const initial = {
  'home.about.title': 'Desktop saved',
  'home.tablet.about.title': 'Tablet saved',
  'home.mobile.about.title': 'Mobile saved',
  'home.mobile.about.description': 'Mobile body saved',
}
function available(name) { assert.equal(typeof model[name], 'function', `${name} must implement the draft contract`) }
function start() { available('createHomeEditorDraft'); return model.createHomeEditorDraft(initial) }

test('device-specific edits retain all other device drafts and dirty-key selection', () => {
  available('updateHomeEditorDraft')
  available('getHomeEditorDirtyKeys')
  let state = start()
  state = model.updateHomeEditorDraft(state, mobile[0].key, 'Mobile draft')
  state = model.updateHomeEditorDraft(state, tablet[0].key, 'Tablet draft')
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, mobile), ['home.mobile.about.title'])
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, tablet), ['home.tablet.about.title'])
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, desktop), [])
  assert.equal(state.values['home.mobile.about.title'], 'Mobile draft')
  assert.equal(state.values['home.about.title'], 'Desktop saved')
  assert.equal(initial['home.mobile.about.title'], 'Mobile saved')
})

test('capture serializes only changed allowed keys from the selected device and rejects cross-device definitions', () => {
  available('captureHomeDeviceSubmission')
  let state = start()
  state = model.updateHomeEditorDraft(state, mobile[0].key, '  Mobile edited  ')
  state = model.updateHomeEditorDraft(state, tablet[0].key, 'Tablet edited')
  const submission = model.captureHomeDeviceSubmission(state, 'mobile', mobile)
  assert.equal(submission.device, 'mobile')
  assert.deepEqual(submission.draftValues, { 'home.mobile.about.title': '  Mobile edited  ' })
  assert.deepEqual(submission.persistedValues, { 'home.mobile.about.title': 'Mobile edited' })
  assert.throws(() => model.captureHomeDeviceSubmission(state, 'mobile', [...mobile, ...tablet]))
  assert.deepEqual(model.captureHomeDeviceSubmission(start(), 'mobile', mobile).persistedValues, {})
})

test('save acknowledgement preserves new in-flight edits and dirty drafts on another device', () => {
  available('acceptHomeDeviceSubmission')
  let state = model.updateHomeEditorDraft(start(), mobile[0].key, 'Submitted mobile')
  const submission = model.captureHomeDeviceSubmission(state, 'mobile', mobile)
  state = model.updateHomeEditorDraft(state, mobile[0].key, 'New mobile while saving')
  state = model.updateHomeEditorDraft(state, tablet[0].key, 'Other tab draft')
  state = model.acceptHomeDeviceSubmission(state, submission)
  assert.equal(state.baseline['home.mobile.about.title'], 'Submitted mobile')
  assert.equal(state.values['home.mobile.about.title'], 'New mobile while saving')
  assert.equal(state.values['home.tablet.about.title'], 'Other tab draft')
  assert.equal(state.baseline['home.tablet.about.title'], 'Tablet saved')
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, all), ['home.tablet.about.title', 'home.mobile.about.title'])
})

test('successful save canonicalizes unchanged submitted input without clearing other device changes', () => {
  available('acceptHomeDeviceSubmission')
  let state = model.updateHomeEditorDraft(start(), mobile[0].key, '  Saved mobile  ')
  state = model.updateHomeEditorDraft(state, tablet[0].key, 'Unsaved tablet')
  const submission = model.captureHomeDeviceSubmission(state, 'mobile', mobile)
  state = model.acceptHomeDeviceSubmission(state, submission)
  assert.equal(state.values['home.mobile.about.title'], 'Saved mobile')
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, mobile), [])
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, tablet), ['home.tablet.about.title'])
})

test('server reload reconciles only clean keys and retains dirty drafts and their baselines', () => {
  available('reconcileHomeEditorDraft')
  let state = model.updateHomeEditorDraft(start(), mobile[0].key, 'Unsaved mobile')
  state = model.reconcileHomeEditorDraft(state, {
    ...initial,
    'home.about.title': 'New server desktop',
    'home.mobile.about.title': 'Different server mobile',
  })
  assert.equal(state.values['home.about.title'], 'New server desktop')
  assert.equal(state.baseline['home.about.title'], 'New server desktop')
  assert.equal(state.values['home.mobile.about.title'], 'Unsaved mobile')
  assert.equal(state.baseline['home.mobile.about.title'], 'Mobile saved')
})

test('restore resets only selected fields and unknown keys cannot enter the draft', () => {
  available('restoreHomeEditorFields')
  let state = model.updateHomeEditorDraft(start(), tablet[0].key, 'Tablet draft')
  state = model.updateHomeEditorDraft(state, mobile[0].key, 'Mobile draft')
  state = model.restoreHomeEditorFields(state, [mobile[0]])
  assert.equal(state.values['home.mobile.about.title'], 'Mobile default')
  assert.equal(state.values['home.mobile.about.description'], 'Mobile body saved')
  assert.equal(state.values['home.tablet.about.title'], 'Tablet draft')
  assert.equal(state.baseline['home.mobile.about.title'], 'Mobile saved')
  assert.equal(model.updateHomeEditorDraft(state, '__proto__', 'unsafe'), state)
})

test('preparing a submission leaves the draft and baseline intact until explicit success acknowledgement', () => {
  available('captureHomeDeviceSubmission')
  const state = model.updateHomeEditorDraft(start(), mobile[0].key, 'Retry this draft')
  const before = structuredClone(state)
  const submission = model.captureHomeDeviceSubmission(state, 'mobile', mobile)
  assert.deepEqual(state, before)
  assert.deepEqual(submission.persistedValues, { 'home.mobile.about.title': 'Retry this draft' })
  assert.deepEqual(model.getHomeEditorDirtyKeys(state, mobile), ['home.mobile.about.title'])
})
