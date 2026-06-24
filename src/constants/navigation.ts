import type { AdminNavigationItem } from '../types/admin'

export interface PublicNavigationItem {
  href: string
  label: string
}

export const publicNavigation = [
  { label: '홈', href: '/' },
  { label: '합창단 소개', href: '/about' },
  { label: '공연·소식', href: '/concerts' },
  { label: '갤러리', href: '/gallery' },
  { label: '입단 안내', href: '/join' },
  { label: '후원·문의', href: '/contact' },
] satisfies PublicNavigationItem[]

export const adminNavigation = [
  { label: '대시보드', href: '/admin', resource: 'site_settings' },
  { label: '홈페이지 기본 설정', href: '/admin/settings', resource: 'site_settings' },
  { label: '홈 슬라이드 관리', href: '/admin/hero-slides', resource: 'hero_slides' },
  { label: '합창단 소개 관리', href: '/admin/about', resource: 'about_sections' },
  { label: '지휘자 관리', href: '/admin/conductor', resource: 'conductor' },
  { label: '반주자 관리', href: '/admin/accompanist', resource: 'accompanist' },
  { label: '단원 관리', href: '/admin/members', resource: 'members' },
  { label: '공연 관리', href: '/admin/concerts', resource: 'concerts' },
  { label: '공지사항 관리', href: '/admin/notices', resource: 'notices' },
  { label: '갤러리 관리', href: '/admin/gallery', resource: 'gallery' },
  { label: '영상 관리', href: '/admin/videos', resource: 'videos' },
  { label: '포스터 관리', href: '/admin/posters', resource: 'posters' },
  { label: '연혁 관리', href: '/admin/history', resource: 'history' },
  { label: '오시는 길 관리', href: '/admin/location', resource: 'locations' },
  { label: '입단 안내 관리', href: '/admin/join', resource: 'join_info' },
  { label: '문의 관리', href: '/admin/contacts', resource: 'contacts' },
  { label: '계정 설정', href: '/admin/account', resource: 'account' },
] satisfies AdminNavigationItem[]
