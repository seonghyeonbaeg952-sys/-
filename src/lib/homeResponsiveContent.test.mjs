import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', configFile: false, cacheDir: 'node_modules/.vite-responsive-content-test', logLevel: 'silent', root: process.cwd(), server: { middlewareMode: true } })
const { normalizeHomeContentV2, flattenHomeContentV2 } = await vite.ssrLoadModule('/src/lib/homeContent.ts')
const { homeFieldDefinitions } = await vite.ssrLoadModule('/src/components/admin/home/homeFieldDefinitions.ts')
after(() => vite.close())

test('CMS responsive spirit copy round-trips without changing desktop spirit copy', () => {
  const content = normalizeHomeContentV2({
    'home.spiritWrapper.orbitHeadline': '기존 데스크톱 문구',
    'home.spiritWrapper.title': '기존 정신 제목',
    'home.spiritWrapper.responsiveTitle': '함께 듣는 음악\n함께 부르는 노래',
    'home.spiritWrapper.responsiveDescription': '새로운 작은 화면 설명',
    'home.spiritWrapper.responsiveLabel1': '우리의 이름',
    'home.spiritWrapper.responsiveCtaLabel': '정신 알아보기',
  })
  assert.equal(content.spiritWrapper.responsiveTitle, '함께 듣는 음악\n함께 부르는 노래')
  assert.equal(content.spiritWrapper.responsiveLabel1, '우리의 이름')
  assert.equal(content.spiritWrapper.orbitHeadline, '기존 데스크톱 문구')
  assert.equal(content.spiritWrapper.title, '기존 정신 제목')
  const flat = flattenHomeContentV2(content)
  assert.equal(flat['home.spiritWrapper.responsiveDescription'], '새로운 작은 화면 설명')
  assert.equal(normalizeHomeContentV2(flat).spiritWrapper.responsiveCtaLabel, '정신 알아보기')
})

test('CMS exposes responsive fields and retains editable concert-card label on readback', () => {
  for (const key of ['responsiveEyebrow', 'responsiveTitle', 'responsiveDescription', 'responsiveCtaLabel', 'responsiveLabel1', 'responsiveLabel2', 'responsiveLabel3', 'responsiveLabel4', 'responsiveLabel5']) {
    assert.ok(homeFieldDefinitions.some(field => field.key === `home.spiritWrapper.${key}`), key)
  }
  const content = normalizeHomeContentV2({ 'home.concertProgram.responsiveCardEyebrow': '다음 무대', 'home.concertProgram.responsiveNoticeEyebrow': '새 소식' })
  assert.equal(content.concertProgram.responsiveCardEyebrow, '다음 무대')
  assert.equal(flattenHomeContentV2(content)['home.concertProgram.responsiveCardEyebrow'], '다음 무대')
  assert.equal(content.concertProgram.responsiveNoticeEyebrow, '새 소식')
})

test('missing or unsafe responsive CMS copy falls back to the approved readable design', () => {
  const content = normalizeHomeContentV2({ 'home.spiritWrapper.responsiveTitle': '<script>alert(1)</script>', 'home.spiritWrapper.responsiveLabel1': '' })
  assert.equal(content.spiritWrapper.responsiveTitle, '서로 다른 목소리,\n하나의 음악.')
  assert.equal(content.spiritWrapper.responsiveLabel1, '이름')
  assert.equal(content.concertProgram.responsiveCardEyebrow, 'NEXT CONCERT')
})

test('archive editor distinguishes the shared visible heading from the navigation label', () => {
  const heading = homeFieldDefinitions.find(field => field.key === 'home.current.archive.desktopTitle')
  const navigation = homeFieldDefinitions.find(field => field.key === 'home.current.archive.title')
  assert.match(heading.label, /공통 제목/)
  assert.match(heading.description, /모바일·태블릿·데스크톱/)
  assert.match(navigation.description, /탐색 영역/)
})

test('editing responsive layout copy survives CMS save and reload without changing desktop copy', () => {
  const custom = {
    'home.responsive.about.mobileDescription': '모바일 소개 편집',
    'home.responsive.join.mobileTitle': '모바일 모집 제목 편집',
    'home.scoreBook.responsiveLeftBody': '태블릿 교육 문구 편집',
    'home.concertProgram.responsiveDescription': '반응형 공연 설명 편집',
    'home.supportLetter.responsiveMobileDescription': '모바일 후원 설명 편집',
    'home.supportLetter.responsiveUse1': '후원 사용처 편집',
  }
  const current = normalizeHomeContentV2({})
  const edited = normalizeHomeContentV2(custom)
  const saved = flattenHomeContentV2(edited)
  for (const [key, value] of Object.entries(custom)) assert.equal(saved[key], value, key)
  assert.equal(edited.about.globalDescription, current.about.globalDescription)
  assert.equal(edited.joinLetter.title, current.joinLetter.title)
  assert.equal(edited.scoreBook.leftPage.calloutBody, current.scoreBook.leftPage.calloutBody)
  assert.equal(edited.concertProgram.description, current.concertProgram.description)
  assert.equal(edited.supportLetter.description, current.supportLetter.description)
  assert.equal(normalizeHomeContentV2(saved).supportLetter.responsiveUse1, '후원 사용처 편집')
})
