import { publicNavigation } from '../constants/navigation'
import type { SiteCopyDefinition } from '../types/siteEditor'

export function navigationCopyKey(href: string, suffix: 'label' | 'description' = 'label') {
  const route = href === '/' ? 'home' : href.replace(/[^a-z0-9]+/gi, '.').replace(/^\.|\.$/g, '')
  return `common.navigation.${route}.${suffix}`
}

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
]
