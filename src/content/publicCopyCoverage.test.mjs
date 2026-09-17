import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { expressionCopyInventory, findExpressionCopy } from '../../scripts/public-copy-expressions.mjs'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const common = await vite.ssrLoadModule('/src/content/siteCopyCommonCatalog.ts')
const { siteCopyDefinitions } = await vite.ssrLoadModule('/src/content/siteCopyCatalog.ts')
const { publicNavigation } = await vite.ssrLoadModule('/src/constants/navigation.ts')
const { resolveEditorCopy } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { usePublicNavigation } = await vite.ssrLoadModule('/src/components/site-editor/usePublicNavigation.ts')
const { HomeV4SampleMegaMenu } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4SampleMegaMenu.tsx')
const { HomeV4SampleMobileMenu } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4SampleMobileMenu.tsx')
const { HomeV4SampleHeader } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4SampleHeader.tsx')
const { Footer } = await vite.ssrLoadModule('/src/components/layout/Footer.tsx')
const { ContactInquiryForm } = await vite.ssrLoadModule('/src/components/contact/ContactInquiryForm.tsx')
const { MapPreview } = await vite.ssrLoadModule('/src/components/common/MapPreview.tsx')
const { BrandLogo } = await vite.ssrLoadModule('/src/components/common/BrandLogo.tsx')
const { HomeV4ProgramNoticeStrip } = await vite.ssrLoadModule('/src/components/sample/home-v4/HomeV4ProgramNoticeStrip.tsx')
const { NoticeProgramNotes } = await vite.ssrLoadModule('/src/components/home/NoticeProgramNotes.tsx')
const { GalleryViewer } = await vite.ssrLoadModule('/src/components/gallery/GalleryViewer.tsx')
const { RouteFallback } = await vite.ssrLoadModule('/src/App.tsx')
const { NoticesPage } = await vite.ssrLoadModule('/src/pages/public/NoticesPage.tsx')
const { mockSiteSettings } = await vite.ssrLoadModule('/src/constants/mockData.ts')
const { richCopyKeys } = await vite.ssrLoadModule('/src/content/richCopyKeys.ts')
const fields = new Map(siteCopyDefinitions.map(field => [field.key, field]))

test('copy definitions retain unique source identities after every coverage extension', () => {
  assert.equal(fields.size, siteCopyDefinitions.length)
})

test('conditional visible fallbacks are audited separately from already-managed children and control values', () => {
  const source = 'function Demo() { return <p>{state === "ready" ? "Visible" : value || "Fallback"}<HomeCopy text="Managed">{"Original"}</HomeCopy></p> }'
  assert.deepEqual(findExpressionCopy(source, 'fixture.tsx').map(item => item.value), ['Visible', 'Fallback'])
  assert.deepEqual(expressionCopyInventory(), [], 'Direct visible expression leaves still lack a copy adapter')
})
const variants = [
  ['/concerts', '공연·소식', '공연 일정'], ['/join', '입단 안내', '입단 안내 전체'],
  ['/about?section=conductor', '지휘자·반주자', '지휘자 소개'], ['/about?section=conductor', '지휘자', '지휘자 소개'],
  ['/about?section=accompanist', '반주자', '반주자 소개'], ['/about?section=history', '연혁과 활동', '연혁'],
  ['/notices', '공연 소식', '공지사항'], ['/join?section=faq', '자주 묻는 질문', 'FAQ'],
  ['/contact?section=support', '후원·문의', '후원 안내'], ['/contact?section=location', '오시는 길', '오시는 길·지도'],
]
function labelKey(href, label) {
  assert.equal(typeof common.navigationLabelKey, 'function', 'navigation labels sharing a URL need explicit identities')
  return common.navigationLabelKey(href, label)
}
function render(child, copy = {}, textStyles = {}, preview = false, owner = 'common') {
  const documents = { [owner]: { schemaVersion: 1, copy, deviceCopy: {}, appearance: {}, textStyles } }
  const value = { copy: (page, key, fallback) => resolveEditorCopy(documents, page, key, fallback, 'desktop'), documents, device: 'desktop', isPreview: preview,
    ...(preview ? { canvas: { register: () => () => {}, subscribe: () => () => {}, getActiveId: () => null } } : {}) }
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SiteEditorContext, { value }, child)))
}
const mega = () => createElement(HomeV4SampleMegaMenu, { id: 'menu', item: publicNavigation.find(item => item.href === '/about'), routePrefix: '', onNavigate() {}, onMouseEnter() {}, onMouseLeave() {} })
const mobile = () => createElement(HomeV4SampleMobileMenu, { id: 'mobile', routePrefix: '', onNavigate() {} })

test('distinct labels sharing a destination have independently editable defaults without deleting legacy route keys', () => {
  for (const [href, variant, canonical] of variants) {
    const key = labelKey(href, variant)
    assert.notEqual(key, common.navigationCopyKey(href), `${href}: ${variant}`)
    assert.equal(fields.get(key)?.defaultValue, variant)
    assert.equal(fields.get(common.navigationCopyKey(href))?.defaultValue, canonical)
  }
})

test('changing a desktop menu variant does not rename the mobile short label or the route label', () => {
  const key = labelKey('/about?section=conductor', '지휘자·반주자')
  const desktop = render(mega(), { [key]: '음악 지도진' })
  const handheld = render(mobile(), { [key]: '음악 지도진' })
  assert.match(desktop, /음악 지도진/)
  assert.doesNotMatch(handheld, /음악 지도진/)
  assert.match(handheld, />지휘자</)
  assert.match(render(mega()), />지휘자·반주자</)
})

test('top-level labels no longer inherit conflicting child-route edits', () => {
  function Navigation() { return createElement('nav', null, usePublicNavigation().map(item => createElement('span', { key: item.href }, item.label))) }
  const html = render(createElement(Navigation), { [common.navigationCopyKey('/concerts')]: '공연 일정 변경', [common.navigationCopyKey('/join')]: '입단 전체 변경' })
  assert.match(html, />공연·소식</)
  assert.match(html, />입단 안내</)
  assert.doesNotMatch(html, /공연 일정 변경|입단 전체 변경/)
})

test('menu variants expose actual rich and preview leaves rather than catalogue-only formatting promises', () => {
  const key = labelKey('/about?section=conductor', '지휘자·반주자')
  assert.equal(richCopyKeys.has(key), true)
  const html = render(mega(), {}, { shared: { [key]: { text: '지휘자·반주자', runs: [{ start: 0, end: 3, style: { fontSize: 32 } }] } } }, true)
  assert.match(html, /data-canvas-target=/)
  assert.match(html, /font-size:32px[^>]*>지휘자<\/smyc-copy>/)
})

test('every visible mega-menu group heading is editable without changing default labels', () => {
  const key = 'common.megaGroup.about.02.title'
  assert.equal(fields.get(key)?.defaultValue, '모테트 정신')
  assert.match(render(mega(), { [key]: '함께 지키는 정신' }), />함께 지키는 정신</)
  assert.match(render(mega()), />모테트 정신</)
})

test('footer contextual links do not borrow a different destination label and visible utility labels support character styling', () => {
  const key = common.navigationCopyKey('/contact?section=support')
  const html = render(createElement(Footer), { [key]: '후원 안내 변경' }, { shared: { 'common.footer.address': { text: '주소', runs: [{ start: 0, end: 2, style: { fontSize: 28 } }] } } })
  assert.doesNotMatch(html, /후원 안내 변경/)
  assert.match(html, /font-size:28px[^>]*>주소<\/smyc-copy>/)
  assert.match(html, />후원·문의</)
})

test('public form options and filter prompts are editable while form values remain unchanged', () => {
  for (const [key, defaultValue] of [['contact.options.general', '일반 문의'], ['notices.options.all', '전체 분류'], ['gallery.options.all', '전체 분류'], ['concerts.options.allTypes', '전체 유형']]) {
    assert.equal(fields.get(key)?.defaultValue, defaultValue)
  }
  // These are string-only controls: they must not be advertised as rich leaves.
  assert.equal(richCopyKeys.has('contact.options.general'), false)
  const form = render(createElement(ContactInquiryForm, { initialType: 'general' }), { 'contact.options.general': '일반 상담', 'contact.namePlaceholder': '성함 입력' }, {}, false, 'contact')
  assert.match(form, /문의 유형: 일반 상담/)
  assert.match(form, /placeholder="성함 입력"/)
  const notices = render(createElement(NoticesPage), { 'notices.options.all': '모든 소식' }, {}, false, 'notices')
  assert.match(notices, /공지 분류: 모든 소식/)
})

test('computed contact label keys have real character-formatting leaves without formatting their placeholders', () => {
  const html = render(createElement(ContactInquiryForm, { initialType: 'general' }), {}, { shared: {
    'contact.nameLabel': { text: '이름', runs: [{ start: 0, end: 2, style: { fontSize: 28 } }] },
  } }, false, 'contact')
  assert.equal(richCopyKeys.has('contact.nameLabel'), true)
  assert.match(html, /font-size:28px[^>]*>이름<\/smyc-copy>/)
  assert.match(html, /placeholder="이름을 입력해 주세요"/)
})

test('fixed map provider and brand labels are editable without changing destinations or logo image paths', () => {
  const map = render(createElement(MapPreview, { address: '서울' }), { 'common.map.naver': '네이버로 길 찾기', 'common.map.kakao': '카카오로 길 찾기' })
  assert.match(map, />네이버로 길 찾기</)
  assert.match(map, />카카오로 길 찾기</)
  assert.match(map, /https:\/\/map.naver.com\/p\/search\//)
  assert.match(render(createElement(BrandLogo, { variant: 'text' }), { 'common.brand.smyc.name': '테스트 합창단' }), />테스트 합창단</)
  const image = render(createElement(BrandLogo), { 'common.brand.smyc.alt': '합창단 상징 이미지' })
  assert.match(image, /alt="합창단 상징 이미지"/)
  assert.match(image, /src="\/images\/brand\/smyc-logo-transparent.png"/)
})

test('contextual homepage notice badges use distinct keys and never replace CMS notice titles', () => {
  const notice = { id: 'fixture', title: '게시물 원문', content: '본문', category: 'concert', is_important: false, is_visible: true, created_at: '2026-01-01', date: '2026-01-01' }
  const copy = { 'home.noticeStripCategory.concert': '연주 안내', 'home.noticeNotesCategory.concert': '무대' }
  const strip = render(createElement(HomeV4ProgramNoticeStrip, { notices: [notice] }), copy, {}, false, 'home')
  const notes = render(createElement(NoticeProgramNotes, { notices: [notice] }), copy, {}, false, 'home')
  assert.match(strip, />연주 안내</)
  assert.match(notes, />무대</)
  assert.match(strip, /게시물 원문/)
  assert.match(notes, /게시물 원문/)
  assert.equal(fields.get('home.noticeStripCategory.concert')?.defaultValue, '공연 소식')
  assert.equal(fields.get('home.noticeNotesCategory.concert')?.defaultValue, '공연')
})

test('gallery category labels and the public boot message are editable while source titles and admin boot text remain independent', () => {
  const html = render(createElement(GalleryViewer, { item: { id: 'photo', title: '자료 원문', category: 'practice', image_url: '/photo.jpg', image_alt: '원본 설명', description: '', is_visible: true }, index: 0, count: 1, onClose() {}, onMove() {} }), { 'gallery.category.practice': '연습 현장' }, {}, false, 'gallery')
  assert.match(html, />연습 현장</)
  assert.match(html, /자료 원문/)
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  try {
    globalThis.window = { location: { pathname: '/notices' } }
    assert.match(render(createElement(RouteFallback), { 'common.route.loading': '잠시만 기다려 주세요' }), />잠시만 기다려 주세요</)
    globalThis.window.location.pathname = '/admin/popups'
    const admin = render(createElement(RouteFallback), { 'common.route.loading': '잠시만 기다려 주세요' })
    assert.match(admin, /관리자 화면을 불러오고 있습니다/)
    assert.doesNotMatch(admin, /잠시만 기다려 주세요/)
  } finally { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window }
})

test('every common key advertised as rich has a real styled leaf in the header, menus or footer', () => {
  const styles = {}, expected = []
  for (const [index, key] of [...common.commonRichCopyKeys].entries()) {
    const field = fields.get(key)
    assert.ok(field, key)
    const color = `#${(0x100000 + index).toString(16)}`
    styles[key] = { text: field.defaultValue, runs: [{ start: 0, end: field.defaultValue.length, style: { color } }] }
    expected.push([key, color])
  }
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalEmail = mockSiteSettings.email
  mockSiteSettings.email = 'fixture@example.invalid'
  globalThis.window = { scrollY: 0 }
  let html
  try {
    html = render(createElement('div', null, createElement(HomeV4SampleHeader, { mode: 'production' }), mobile(), createElement(Footer),
      ...publicNavigation.slice(1).map(item => createElement(HomeV4SampleMegaMenu, { key: item.href, id: item.href, item, routePrefix: '', onNavigate() {}, onMouseEnter() {}, onMouseLeave() {} }))), {}, { shared: styles })
  } finally { mockSiteSettings.email = originalEmail; if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window }
  assert.deepEqual(expected.filter(([, color]) => !html.includes(`color:${color}`)).map(([key]) => key), [], 'These keys are catalogue-only, not rendered rich leaves')
})
