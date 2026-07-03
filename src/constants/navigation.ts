import type { AdminNavigationItem } from '../types/admin'

export interface PublicNavigationItem {
  children?: PublicNavigationChild[]
  description?: string
  href: string
  label: string
}

export interface PublicNavigationChild {
  description?: string
  href: string
  label: string
}

export const publicNavigation = [
  { label: '홈', href: '/' },
  {
    label: '합창단 정신',
    href: '/spirit',
    description: '마음을 담은 음악과 다음 세대 교육의 방향을 소개합니다.',
    children: [
      {
        label: '합창단 정신',
        href: '/spirit',
        description: '합창단의 핵심 가치와 교육 철학',
      },
      {
        label: '소개 안에서 보기',
        href: '/about?section=spirit',
        description: '소개 페이지의 요약형 정신 섹션',
      },
    ],
  },
  {
    label: '합창단 소개',
    href: '/about',
    description: '합창단의 정체성과 사람, 연혁을 한눈에 봅니다.',
    children: [
      {
        label: '합창단 소개',
        href: '/about?section=overview',
        description: '창단 배경과 교육 목적',
      },
      {
        label: '정신과 교육철학',
        href: '/about?section=spirit',
        description: '합창단이 지향하는 교육 가치',
      },
      {
        label: '지휘자 소개',
        href: '/about?section=conductor',
        description: '음악적 방향을 이끄는 지휘자',
      },
      {
        label: '반주자 소개',
        href: '/about?section=accompanist',
        description: '연습과 무대를 함께 만드는 반주자',
      },
      {
        label: '단원 소개',
        href: '/about?section=members',
        description: '파트별 단원 소개',
      },
      {
        label: '연혁',
        href: '/about?section=history',
        description: '창단 이후 주요 활동',
      },
    ],
  },
  {
    label: '공연·소식',
    href: '/concerts',
    description: '공연 일정과 합창단의 공식 공지를 확인합니다.',
    children: [
      { label: '공연 일정', href: '/concerts', description: '전체 공연 목록' },
      { label: '예정 공연', href: '/concerts?filter=upcoming', description: '앞으로 열릴 공연' },
      { label: '지난 공연', href: '/concerts?filter=past', description: '지난 무대 기록' },
      { label: '공지사항', href: '/notices', description: '입단, 연습, 공연 공지' },
      { label: '중요 공지', href: '/notices?filter=important', description: '우선 확인할 안내' },
    ],
  },
  {
    label: '갤러리',
    href: '/gallery',
    description: '사진, 영상, 포스터 자료를 모아 봅니다.',
    children: [
      { label: '사진', href: '/gallery?tab=photos', description: '공연과 연습 사진' },
      { label: '영상', href: '/gallery?tab=videos', description: '공연 영상 아카이브' },
      { label: '포스터 아카이브', href: '/gallery?tab=posters', description: '공연 포스터 기록' },
    ],
  },
  {
    label: '입단 안내',
    href: '/join',
    description: '입단 대상, 오디션 절차, 자주 묻는 질문을 안내합니다.',
    children: [
      { label: '입단 안내', href: '/join?section=overview', description: '입단 안내 요약' },
      { label: '모집 대상', href: '/join?section=eligibility', description: '지원 가능 대상과 파트' },
      { label: '오디션·절차', href: '/join?section=process', description: '상담부터 활동 시작까지' },
      { label: '연습 안내', href: '/join?section=practice', description: '정기연습 시간과 장소' },
      { label: 'FAQ', href: '/join?section=faq', description: '자주 묻는 질문' },
      { label: '입단 문의', href: '/join?section=contact', description: '입단 문의 연결' },
    ],
  },
  {
    label: '후원·문의',
    href: '/contact',
    description: '후원, 공연 의뢰, 오시는 길을 공식 채널로 연결합니다.',
    children: [
      { label: '후원 안내', href: '/contact?section=support', description: '후원과 협력 문의' },
      { label: '후원사', href: '/contact?section=sponsors', description: '후원사와 협력기관' },
      { label: '공연 문의', href: '/contact?section=performance', description: '초청연주와 공연 의뢰' },
      { label: '입단 문의', href: '/contact?section=join', description: '입단 상담과 신청' },
      { label: '오시는 길·지도', href: '/contact?section=location', description: '주소와 지도 바로가기' },
    ],
  },
] satisfies PublicNavigationItem[]

export const adminNavigation = [
  { label: '대시보드', href: '/admin', resource: 'site_settings' },
  { label: '홈페이지 기본 설정', href: '/admin/settings', resource: 'site_settings' },
  { label: '홈 문구 관리', href: '/admin/site-texts', resource: 'site_texts' },
  { label: '홈 슬라이드 관리', href: '/admin/hero-slides', resource: 'hero_slides' },
  { label: '홈 팝업 관리', href: '/admin/popups', resource: 'popup_notices' },
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
  { label: '후원약정 관리', href: '/admin/support', resource: 'support_settings' },
  { label: '후원 신청 관리', href: '/admin/support-pledges', resource: 'support_pledges' },
  { label: '후원사 관리', href: '/admin/sponsors', resource: 'sponsors' },
  { label: '문의 관리', href: '/admin/contacts', resource: 'contacts' },
  { label: '계정 설정', href: '/admin/account', resource: 'account' },
] satisfies AdminNavigationItem[]
