import { BRANDS } from '../constants/brand'
import type { EditorPageId, SiteCopyDefinition } from '../types/siteEditor'

// Stable display identities are separate from the stored enum, route, or URL.
const groups: Array<{ page: EditorPageId; prefix: string; values: Record<string, string>; plain?: boolean }> = [
  ...Object.entries(BRANDS).map(([brand, value]) => ({ page: 'common' as const, prefix: `common.brand.${brand}`, values: { name: value.name, nameEn: value.nameEn } })),
  ...Object.entries(BRANDS).map(([brand, value]) => ({ page: 'common' as const, prefix: `common.brand.${brand}`, values: { alt: value.alt }, plain: true })),
  { page: 'common', prefix: 'common.map', values: { naver: '네이버지도에서 보기', kakao: '카카오맵에서 보기' } },
  { page: 'common', prefix: 'common.footer.social', values: { YouTube: 'YouTube', Instagram: 'Instagram' } },
  { page: 'common', prefix: 'common.route', values: { brand: '서울모테트청소년합창단', loading: '페이지를 준비하고 있습니다' } },
  { page: 'gallery', prefix: 'gallery.category', values: { archive: '아카이브', concert: '공연', event: '행사', practice: '연습', video: '공연 영상', poster: '포스터' } },
  { page: 'concerts', prefix: 'concerts.status', values: { cancelled: '취소', past: '지난 공연', open: '예매 가능', upcoming: '예정' } },
  { page: 'concert-detail', prefix: 'concert-detail.status', values: { past: '지난 공연', upcoming: '공연 예정', closed: '접수·예매 마감', cancelled: '공연 취소' } },
  { page: 'home', prefix: 'home.noticeNotesCategory', values: { concert: '공연', join: '모집', news: '소식', notice: '공지', press: '보도자료', rehearsal: '연습' } },
  { page: 'home', prefix: 'home.noticeStripCategory', values: { concert: '공연 소식', join: '모집 안내', news: '합창단 소식', notice: '일반 안내', press: '보도자료', rehearsal: '연습 안내' } },
  { page: 'notice-detail', prefix: 'notice-detail.category', values: { notice: '공지', join: '모집', concert: '공연', news: '소식', press: '보도자료', rehearsal: '연습' } },
  { page: 'concerts', prefix: 'concerts.category', values: { church: '교회·예배연주', invited: '초청연주', other: '기타', past: '지난 공연', regular: '정기연주회', special: '특별연주' } },
  { page: 'contact', prefix: 'contact.supportContact', values: { phone: '문의 전화', email: '문의 이메일', website: '홈페이지' } },
  { page: 'home', prefix: 'home.joinSummary', plain: true, values: {
    targetLabel: '모집 대상', targetFallback: '합창 활동에 관심이 있고 정기 연습에 참여할 수 있는 청소년',
    rehearsalLabel: '연습 안내', rehearsalFallback: '정기 연습과 특별 연습, 공연 준비 일정은 입단 안내에서 확인',
    processLabel: '입단 절차', processFallback: '지원서 작성 → 보호자 연락처로 안내 → 간단한 음역 확인과 입단 상담',
  } },
]

export const displayCopyDefinitions: SiteCopyDefinition[] = groups.flatMap(({ page, prefix, values }) =>
  Object.entries(values).map(([name, defaultValue]) => ({ key: `${prefix}.${name}`, page, section: '분류·연결·브랜드 표시', label: defaultValue, defaultValue })))

export const displayRichCopyKeys = [
  ...groups.filter(group => !group.plain).flatMap(({ prefix, values }) => Object.keys(values).map(name => `${prefix}.${name}`)),
  ...['notice', 'join', 'concert', 'news', 'press', 'rehearsal'].map(name => `notices.options.${name}`),
]
