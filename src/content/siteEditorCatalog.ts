import type { EditorPageId } from '../types/siteEditor'

export type SiteEditorPage = {
  id: EditorPageId
  label: string
  previewPath: string | null
  contentLinks: Array<{ label: string; href: string }>
}

export const siteEditorPages: SiteEditorPage[] = [
  { id: 'common', label: '공통 · 메뉴와 푸터', previewPath: '/', contentLinks: [{ label: '연락처와 기본 정보', href: '/admin/settings' }] },
  { id: 'home', label: '홈', previewPath: '/', contentLinks: [{ label: '홈 슬라이드', href: '/admin/hero-slides' }, { label: '홈 팝업', href: '/admin/popups' }] },
  { id: 'about', label: '합창단 소개', previewPath: '/about?section=overview', contentLinks: [{ label: '소개 원문', href: '/admin/about' }] },
  { id: 'spirit', label: '합창단 정신', previewPath: '/spirit', contentLinks: [{ label: '정신과 교육 원문', href: '/admin/about' }] },
  { id: 'conductor', label: '지휘자', previewPath: '/about?section=conductor', contentLinks: [{ label: '지휘자 약력과 사진', href: '/admin/conductor' }] },
  { id: 'accompanist', label: '반주자', previewPath: '/about?section=accompanist', contentLinks: [{ label: '반주자 프로필', href: '/admin/accompanist' }] },
  { id: 'members', label: '단원', previewPath: '/about?section=members', contentLinks: [{ label: '단원과 이름 공개 설정', href: '/admin/members' }] },
  { id: 'history', label: '연혁', previewPath: '/about?section=history', contentLinks: [{ label: '연혁 기록', href: '/admin/history' }] },
  { id: 'concerts', label: '공연 목록', previewPath: '/concerts', contentLinks: [{ label: '공연 등록과 수정', href: '/admin/concerts' }] },
  { id: 'concert-detail', label: '공연 상세', previewPath: null, contentLinks: [{ label: '공개할 공연 등록', href: '/admin/concerts' }] },
  { id: 'notices', label: '공지 목록', previewPath: '/notices', contentLinks: [{ label: '공지 등록과 수정', href: '/admin/notices' }] },
  { id: 'notice-detail', label: '공지 상세', previewPath: null, contentLinks: [{ label: '공개할 공지 등록', href: '/admin/notices' }] },
  { id: 'gallery', label: '갤러리', previewPath: '/gallery', contentLinks: [{ label: '사진', href: '/admin/gallery' }, { label: '영상', href: '/admin/videos' }, { label: '포스터', href: '/admin/posters' }] },
  { id: 'join', label: '입단 안내와 지원서', previewPath: '/join', contentLinks: [{ label: '모집 안내와 FAQ 원문', href: '/admin/join' }] },
  { id: 'contact', label: '후원 · 문의', previewPath: '/contact', contentLinks: [{ label: '후원약정 원문', href: '/admin/support' }, { label: '후원사', href: '/admin/sponsors' }, { label: '오시는 길', href: '/admin/location' }] },
]
