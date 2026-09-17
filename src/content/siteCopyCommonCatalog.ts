import { publicNavigation } from '../constants/navigation'
import type { SiteCopyDefinition } from '../types/siteEditor'

export function navigationCopyKey(href: string, suffix: 'label' | 'description' = 'label') {
  const route = href === '/' ? 'home' : href.replace(/[^a-z0-9]+/gi, '.').replace(/^\.|\.$/g, '')
  return `common.navigation.${route}.${suffix}`
}

// A destination is not a text identity: headings, short mobile labels and
// contextual links may intentionally use different words for the same URL.
export const navigationLabelVariants = [
  ['/concerts', '공연·소식', 'overview'], ['/join', '입단 안내', 'overview'],
  ['/about?section=conductor', '지휘자·반주자', 'combined'], ['/about?section=conductor', '지휘자', 'short'],
  ['/about?section=accompanist', '반주자', 'short'], ['/about?section=history', '연혁과 활동', 'activities'],
  ['/notices', '공연 소식', 'concertNews'], ['/join?section=faq', '자주 묻는 질문', 'full'],
  ['/contact?section=support', '후원·문의', 'combined'], ['/contact?section=location', '오시는 길', 'short'],
] as const

export function navigationLabelKey(href: string, originalLabel: string) {
  const variant = navigationLabelVariants.find(([route, label]) => route === href && label === originalLabel)
  return variant ? `${navigationCopyKey(href)}.${variant[2]}` : navigationCopyKey(href)
}

const megaGroupDefaults = {
  about: ['합창단 소개', '모테트 정신', '활동과 기록'], spirit: ['합창단 정신', '핵심 가치', '교육 방향'],
  concerts: ['공연 안내', '일정과 기록', '공지와 소식'], gallery: ['갤러리', '사진과 영상', '포스터 기록'],
  join: ['입단 안내', '지원 준비', '절차와 문의'], contact: ['후원·문의', '후원 안내', '문의와 위치'],
} as const
export function megaGroupCopyKey(href: string, code: string) { return `common.megaGroup.${href.replace(/^\//, '')}.${code}.title` }
const megaGroupDefinitions = Object.entries(megaGroupDefaults).flatMap(([route, titles]) => titles.map((defaultValue, index) => ({
  key: megaGroupCopyKey(`/${route}`, `0${index + 1}`), page: 'common' as const, section: '펼친 메뉴 제목', label: `${route} · ${defaultValue}`, defaultValue,
})))
const variantDefinitions = navigationLabelVariants.map(([href, defaultValue]) => ({
  key: navigationLabelKey(href, defaultValue), page: 'common' as const, section: '메뉴별 이름', label: `${defaultValue} (${href})`, defaultValue,
}))

const navigationDefinitions = publicNavigation.flatMap(item => [
  { href: item.href, label: item.label, description: item.description }, ...(item.children ?? []),
]).flatMap(item => (['label'] as const).flatMap(suffix => item[suffix] ? [{
  key: navigationCopyKey(item.href, suffix), page: 'common' as const, section: '메뉴',
  label: `${item.label} ${suffix === 'label' ? '메뉴 이름' : '설명'}`, defaultValue: item[suffix]!,
}] : []))

const fixed = [
  ['common.skip', '접근성', '본문 바로가기', '본문으로 바로가기'],
  ['common.header.apply', '메뉴', '입단신청 버튼', '입단신청'],
  ['common.header.open', '메뉴', '메뉴 열기', '메뉴 열기'],
  ['common.header.close', '메뉴', '메뉴 닫기', '메뉴 닫기'],
  ['common.footer.contact', '푸터', '연락처 표제', 'CONTACT'],
  ['common.footer.address', '푸터', '주소 라벨', '주소'],
  ['common.footer.phone', '푸터', '전화 라벨', '전화'],
  ['common.footer.email', '푸터', '이메일 라벨', '이메일'],
  ['common.footer.explore', '푸터', '둘러보기 표제', 'EXPLORE'],
  ['common.footer.participate', '푸터', '참여 표제', 'TAKE PART'],
  ['common.footer.connect', '푸터', '채널 표제', 'CONNECT'],
  ['common.footer.empty', '푸터', '채널 빈 상태', '공식 채널 준비 중'],
  ['common.footer.admin', '푸터', '관리자 로그인', '관리자 로그인'],
  ['common.footer.top', '푸터', '맨 위 버튼', 'TOP'],
] as const

export const commonCopyDefinitions: SiteCopyDefinition[] = [
  ...new Map(navigationDefinitions.map(field => [field.key, field])).values(),
  ...fixed.map(([key, section, label, defaultValue]) => ({ key, page: 'common' as const, section, label, defaultValue })),
  ...variantDefinitions, ...megaGroupDefinitions,
]

const catalogueOnlyKeys = new Set([
  'common.skip', 'common.header.open', 'common.header.close',
  // Retained legacy keys without a current visible consumer. Actual short or
  // contextual labels now use the explicit variant keys above.
  navigationCopyKey('/about?section=overview#spirit'), navigationCopyKey('/about?section=conductor'),
  navigationCopyKey('/about?section=accompanist'), navigationCopyKey('/about?section=history'),
])
export const commonRichCopyKeys: ReadonlySet<string> = new Set(commonCopyDefinitions
  .filter(field => !catalogueOnlyKeys.has(field.key))
  .map(field => field.key))
