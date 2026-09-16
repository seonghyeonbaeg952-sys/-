import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', configFile: false, cacheDir: 'node_modules/.vite-home-device-content-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
let model
try { model = await vite.ssrLoadModule('/src/lib/homeDeviceContent.ts') } catch {}
const { normalizeHomeContentV2, getHomeContentV2Value } = await vite.ssrLoadModule('/src/lib/homeContent.ts')
const defaults = normalizeHomeContentV2({})
function api() {
  assert.equal(typeof model?.resolveHomeContentForDevice, 'function', 'device content model must exist')
  return model
}

test('editing mobile and tablet keys does not mutate desktop content or the input record', () => {
  const { resolveHomeContentForDevice } = api()
  const desktop = { 'home.current.about.title': '데스크톱 원본 제목', 'home.quickActions.join.isVisible': 'false', 'home.heroSupplement.fallbackDescription': '히어로 원본 소개' }
  const raw = { ...desktop, 'home.mobile.current.about.title': '모바일 제목', 'home.tablet.current.about.title': '태블릿 제목', 'home.mobile.quickActions.join.isVisible': 'true' }
  const before = JSON.stringify(raw)
  assert.deepEqual(resolveHomeContentForDevice(raw, 'desktop'), normalizeHomeContentV2(desktop))
  assert.equal(resolveHomeContentForDevice(raw, 'mobile').about.title, '모바일 제목')
  assert.equal(resolveHomeContentForDevice(raw, 'tablet').about.title, '태블릿 제목')
  assert.equal(JSON.stringify(raw), before)
})

test('missing phone and tablet fields use approved defaults instead of edited desktop copy', () => {
  const { resolveHomeContentForDevice, createHomeEditorValues } = api()
  const raw = { 'home.current.about.title': '데스크톱 제목 변경', 'home.current.join.ctaLabel': '데스크톱 버튼 변경', 'home.current.archive.desktopTitle': '데스크톱 기록 제목 변경' }
  for (const device of ['mobile', 'tablet']) {
    const actual = resolveHomeContentForDevice(raw, device)
    assert.equal(actual.about.title, defaults.about.title)
    assert.equal(actual.joinLetter.ctaLabel, defaults.joinLetter.ctaLabel)
    assert.equal(actual.archive.desktopTitle, defaults.archive.desktopTitle)
    const ui = createHomeEditorValues(raw)
    assert.equal(ui[`home.${device}.current.about.title`], actual.about.title)
    assert.equal(ui[`home.${device}.current.archive.desktopTitle`], actual.archive.desktopTitle)
  }
})

test('device quick visibility and order are applied before filtering, and hidden edits survive editor readback', () => {
  const { resolveHomeContentForDevice, createHomeEditorValues } = api()
  const raw = {
    'home.quickActions.join.isVisible': 'false',
    'home.mobile.quickActions.join.isVisible': 'true', 'home.mobile.quickActions.join.title': '모바일 입단', 'home.mobile.quickActions.join.displayOrder': '3',
    'home.tablet.quickActions.join.isVisible': 'false', 'home.tablet.quickActions.join.title': '태블릿 숨김 입단', 'home.tablet.quickActions.join.displayOrder': '2',
    'home.tablet.quickActions.concert.isVisible': 'true',
  }
  assert.equal(resolveHomeContentForDevice(raw, 'desktop').quickActions.items.some(x => x.id === 'join'), false)
  const mobile = resolveHomeContentForDevice(raw, 'mobile').quickActions.items
  assert.equal(mobile.find(x => x.id === 'join').title, '모바일 입단')
  assert.equal(mobile.find(x => x.id === 'join').displayOrder, 3)
  assert.equal(resolveHomeContentForDevice(raw, 'tablet').quickActions.items.some(x => x.id === 'join'), false)
  const ui = createHomeEditorValues(raw)
  assert.equal(ui['home.tablet.quickActions.join.isVisible'], 'false')
  assert.equal(ui['home.tablet.quickActions.join.title'], '태블릿 숨김 입단')
  assert.equal(ui['home.tablet.quickActions.join.displayOrder'], '2')
  assert.equal(ui['home.quickActions.join.isVisible'], 'false')
})

test('legacy responsive-only saved values remain read-only fallback until each device has its own value', () => {
  const { resolveHomeContentForDevice, createHomeEditorValues, getHomeEditorFields } = api()
  const raw = { 'home.spiritWrapper.responsiveTitle': '이전 승인 문구', 'home.responsive.about.mobileDescription': '이전 모바일 소개', 'home.mobile.spiritWrapper.responsiveTitle': '새 모바일 정신' }
  assert.equal(resolveHomeContentForDevice(raw, 'mobile').spiritWrapper.responsiveTitle, '새 모바일 정신')
  assert.equal(resolveHomeContentForDevice(raw, 'tablet').spiritWrapper.responsiveTitle, '이전 승인 문구')
  assert.equal(resolveHomeContentForDevice(raw, 'mobile').about.responsiveMobileDescription, '이전 모바일 소개')
  const ui = createHomeEditorValues(raw)
  assert.equal(ui['home.tablet.spiritWrapper.responsiveTitle'], '이전 승인 문구')
  assert.equal(Object.hasOwn(ui, 'home.spiritWrapper.responsiveTitle'), false)
  assert.equal(getHomeEditorFields('desktop').some(field => field.key === 'home.spiritWrapper.responsiveTitle'), false)
})

test('blank unsafe or malformed own overrides fall back to design defaults, never another view or a legacy alias', () => {
  const { resolveHomeContentForDevice, createHomeEditorValues } = api()
  for (const invalid of ['', '  ', '<script>alert(1)</script>', 'javascript:alert(1)', 42]) {
    const raw = { 'home.current.about.title': '데스크톱 문구', 'home.about.title': '이전 공유 제목', 'home.spiritWrapper.responsiveTitle': '이전 반응형 문구', 'home.mobile.current.about.title': invalid, 'home.mobile.spiritWrapper.responsiveTitle': invalid }
    const actual = resolveHomeContentForDevice(raw, 'mobile')
    assert.equal(actual.about.title, defaults.about.title)
    assert.equal(actual.spiritWrapper.responsiveTitle, defaults.spiritWrapper.responsiveTitle)
    assert.equal(createHomeEditorValues(raw)['home.mobile.current.about.title'], defaults.about.title)
  }
})

test('unknown device keys cannot override protected hero, routes, image sources or desktop-only controls', () => {
  const { resolveHomeContentForDevice, getHomeEditorFields } = api()
  const raw = { 'home.mobile.heroSupplement.fallbackDescription': '비허용 히어로', 'home.mobile.quickActions.join.href': 'https://bad.example', 'home.mobile.spiritWrapper.backgroundVideoUrl': 'https://bad.example/video.mp4', 'home.mobile.scoreBook.responsiveTitle': '비허용 모바일 교육' }
  assert.deepEqual(resolveHomeContentForDevice(raw, 'mobile'), resolveHomeContentForDevice({}, 'mobile'))
  const keys = getHomeEditorFields('mobile').map(field => field.key)
  for (const key of Object.keys(raw)) assert.equal(keys.includes(key), false, key)
  assert.equal(getHomeEditorFields('tablet').some(field => field.sourceKey === 'home.concertProgram.concertsCtaLabel'), false)
  assert.equal(getHomeEditorFields('mobile').some(field => field.sourceKey === 'home.scoreBook.responsiveTitle'), false)
})

test('all device editor fields have unique storage keys and a save reload value matching public resolution', () => {
  const { getHomeEditorFields, homeAllEditorFields, createHomeEditorValues, resolveHomeContentForDevice } = api()
  assert.equal(new Set(homeAllEditorFields.map(field => field.key)).size, homeAllEditorFields.length)
  for (const device of ['desktop', 'mobile', 'tablet']) {
    const fields = getHomeEditorFields(device)
    assert.ok(fields.length > 0)
    for (const [index, field] of fields.entries()) {
      assert.ok(field.sourceKey.startsWith('home.'))
      if (device !== 'desktop') assert.equal(field.key, `home.${device}.${field.sourceKey.slice(5)}`)
      const value = field.inputType === 'boolean' ? 'false' : field.inputType === 'number' ? '2' : `저장한 문구 ${index}`
      const saved = { [field.key]: value }
      const ui = createHomeEditorValues(saved)
      assert.equal(ui[field.key], value, `${device}: ${field.key}`)
      const publicValue = getHomeContentV2Value(resolveHomeContentForDevice(saved, device), field.sourceKey)
      assert.equal(publicValue || (field.inputType === 'boolean' ? 'false' : ''), value, `${device} consumer: ${field.key}`)
    }
  }
})
