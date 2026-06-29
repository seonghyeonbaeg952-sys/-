import type { SponsorCategory, SponsorTier } from '../types/content'

export const HOME_SPONSOR_COPY = {
  body:
    '서울모테트청소년합창단의 다음세대 음악교육을 함께 세우는 후원사와 협력기관입니다.',
  ctaHref: '/contact?section=sponsors',
  ctaLabel: '후원사 전체 보기',
  eyebrow: 'WITH OUR SUPPORTERS',
  title: '함께 세우는 손길',
}

export const SPONSORS_PAGE_COPY = {
  body:
    '한 사람의 목소리가 자라기까지 보이지 않는 많은 손길이 함께합니다. 서울모테트청소년합창단의 연습과 공연, 교육과 나눔을 함께 세우는 후원사와 협력기관을 소개합니다.',
  emptyBody:
    '공개 동의가 완료된 후원사와 협력기관을 등록하면 이곳에 표시됩니다.',
  emptyTitle: '후원사 정보가 준비 중입니다.',
  eyebrow: 'PARTNERS',
  title: '후원사 · 협력기관',
}

export const SUPPORT_SPONSOR_COPY = {
  body:
    '후원사와 협력기관의 동행은 청소년들이 정직한 음악, 교회음악의 바른 이상, 공동체의 책임을 배우는 시간을 가능하게 합니다.',
  eyebrow: 'TOGETHER',
  title: '다음 세대의 울림을 함께 세우는 분들',
}

export const SPONSOR_TIERS = [
  { label: '동행 후원사', value: 'main' },
  { label: '교육 후원사', value: 'education' },
  { label: '공연 후원사', value: 'performance' },
  { label: '협력기관', value: 'partner' },
  { label: '물품·장소 후원', value: 'in_kind' },
  { label: '나눔 후원', value: 'supporter' },
] satisfies Array<{ label: string; value: SponsorTier }>

export const SPONSOR_CATEGORIES = [
  { label: '기업', value: 'corporate' },
  { label: '교회', value: 'church' },
  { label: '기관', value: 'institution' },
  { label: '재단', value: 'foundation' },
  { label: '개인', value: 'individual' },
  { label: '미디어', value: 'media' },
  { label: '기타', value: 'other' },
] satisfies Array<{ label: string; value: SponsorCategory }>

export function getSponsorTierLabel(value: string | null | undefined) {
  return SPONSOR_TIERS.find((tier) => tier.value === value)?.label ?? '나눔 후원'
}

export function getSponsorCategoryLabel(value: string | null | undefined) {
  return SPONSOR_CATEGORIES.find((category) => category.value === value)?.label ?? '기타'
}
