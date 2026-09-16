import type { ContactMessageInput } from '../../lib/publicData'

export const inquiryTypes: ReadonlyArray<{ label: string; value: ContactMessageInput['type'] }> = [
  { label: '일반 문의', value: 'general' },
  { label: '입단 관련 문의', value: 'join' },
  { label: '후원 관련 문의', value: 'support' },
  { label: '공연 관련 문의', value: 'concert_request' },
  { label: '기타', value: 'other' },
]

export type ContactSectionKey = 'all' | 'support' | 'sponsors' | 'performance' | 'inquiry' | 'location'
export type ContactFormValues = {
  name: string
  email: string
  phone: string
  title: string
  message: string
  type: ContactMessageInput['type']
  privacy_agreed: boolean
  website: string
}
export type ContactFieldErrors = Partial<Record<keyof ContactFormValues, string>>

export function getContactSection(value: string | null): ContactSectionKey {
  return value === 'support' || value === 'sponsors' || value === 'performance' || value === 'inquiry' || value === 'location' ? value : 'all'
}

export function getInitialInquiryType(section: ContactSectionKey): ContactMessageInput['type'] {
  return section === 'support' ? 'support' : section === 'performance' ? 'concert_request' : 'general'
}

export function validateContactForm(values: ContactFormValues): ContactFieldErrors {
  const errors: ContactFieldErrors = {}
  if (!values.name.trim()) errors.name = '이름을 입력해 주세요.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = '답변을 받을 이메일 주소를 확인해 주세요.'
  if (!values.message.trim()) errors.message = '문의 내용을 입력해 주세요.'
  if (!inquiryTypes.some(option => option.value === values.type)) errors.type = '문의 유형을 선택해 주세요.'
  if (values.privacy_agreed !== true) errors.privacy_agreed = '개인정보 수집 및 이용에 동의해 주세요.'
  return errors
}

export function buildContactMessageInput(values: ContactFormValues): ContactMessageInput {
  return {
    name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() || null,
    title: values.title.trim() || null, message: values.message.trim(), type: values.type,
    privacy_agreed: values.privacy_agreed, website: values.website,
  }
}

export function formatSupportAmounts(amounts: readonly number[]): string {
  return amounts.map(amount => `${amount.toLocaleString('ko-KR')}원`).join(' · ')
}
