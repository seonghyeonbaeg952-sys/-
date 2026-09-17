import type { SiteCopyDefinition } from '../types/siteEditor'

// Display labels only. Stored enum values, routing and submission payloads never
// come from these overrides; native control labels intentionally remain strings.
const optionGroups = {
  contact: { general: '일반 문의', join: '입단 관련 문의', support: '후원 관련 문의', concert_request: '공연 관련 문의', other: '기타' },
  notices: { all: '전체 분류', notice: '공지', join: '모집', concert: '공연', news: '소식', press: '보도자료', rehearsal: '연습' },
  gallery: { all: '전체 분류', noResultsSuffix: ' (결과 없음)' },
  concerts: { allTypes: '전체 유형', allDates: '날짜 전체' },
} as const

export const optionCopyDefinitions: SiteCopyDefinition[] = Object.entries(optionGroups).flatMap(([page, entries]) =>
  Object.entries(entries).map(([name, defaultValue]) => ({ key: `${page}.options.${name}`, page: page as SiteCopyDefinition['page'],
    section: '선택 메뉴 표시 이름', label: defaultValue.trim(), defaultValue })))

// Explicit computed keys whose actual JSX leaves are rich-rendered.
export const computedRichCopyKeys = ['contact.nameLabel', 'contact.emailLabel', 'contact.phoneLabel', 'contact.titleLabel'] as const
