import type { SiteCopyDefinition } from '../types/siteEditor'

const fields = {
  'support-custom-amount': '기타 금액 (원)',
  'support-name': '이름 (필수)',
  'support-phone': '핸드폰 (필수)',
  'support-email': 'E-mail (필수)',
  'support-gender': '성별',
  'support-birth-date': '생년월일',
  'support-depositor': '예금주',
  'support-address': '주소',
  'support-pledge-date': '날짜',
  'support-signer-name': '서명 이름',
} as const

export const pledgeCopyDefinitions: SiteCopyDefinition[] = Object.entries(fields).map(([field, label]) => ({
  key: `contact.pledge.${field}`, page: 'contact', section: '후원약정 입력 라벨', label, defaultValue: label,
}))
