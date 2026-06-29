import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
import type { LocationRow, SiteSettingsRow } from '../../types/cms'

const siteSettingsFields = [
  { name: 'site_title', label: '사이트명', type: 'text', required: true },
  { name: 'hero_title', label: 'Hero 기본 제목', type: 'text' },
  { name: 'hero_subtitle', label: 'Hero 기본 부제', type: 'text' },
  { name: 'home_hero_eyebrow', label: 'Home Hero 영문 라벨', type: 'text' },
  {
    name: 'home_hero_description',
    label: 'Home Hero 기본 설명',
    type: 'textarea',
    rows: 3,
  },
  { name: 'home_info_card_1_title', label: 'Home 정보 카드 1 제목', type: 'text' },
  {
    name: 'home_info_card_1_description',
    label: 'Home 정보 카드 1 설명',
    type: 'textarea',
    rows: 2,
  },
  { name: 'home_info_card_2_title', label: 'Home 정보 카드 2 제목', type: 'text' },
  {
    name: 'home_info_card_2_description',
    label: 'Home 정보 카드 2 설명',
    type: 'textarea',
    rows: 2,
  },
  { name: 'home_info_card_3_title', label: 'Home 정보 카드 3 제목', type: 'text' },
  {
    name: 'home_info_card_3_description',
    label: 'Home 정보 카드 3 설명',
    type: 'textarea',
    rows: 2,
  },
  { name: 'home_about_title', label: 'Home 소개 섹션 제목', type: 'text' },
  { name: 'home_about_button_label', label: 'Home 소개 버튼 문구', type: 'text' },
  {
    name: 'about_summary',
    label: '합창단 소개 요약',
    type: 'textarea',
    rows: 4,
  },
  { name: 'home_concerts_title', label: 'Home 공연 섹션 제목', type: 'text' },
  {
    name: 'home_concerts_description',
    label: 'Home 공연 섹션 설명',
    type: 'textarea',
    rows: 2,
  },
  { name: 'home_concerts_button_label', label: 'Home 공연 버튼 문구', type: 'text' },
  { name: 'home_notices_title', label: 'Home 공지 섹션 제목', type: 'text' },
  {
    name: 'home_notices_description',
    label: 'Home 공지 섹션 설명',
    type: 'textarea',
    rows: 2,
  },
  { name: 'home_notices_button_label', label: 'Home 공지 버튼 문구', type: 'text' },
  { name: 'home_gallery_title', label: 'Home 갤러리 섹션 제목', type: 'text' },
  {
    name: 'home_gallery_description',
    label: 'Home 갤러리 섹션 설명',
    type: 'textarea',
    rows: 2,
  },
  { name: 'home_gallery_button_label', label: 'Home 갤러리 버튼 문구', type: 'text' },
  { name: 'home_join_title', label: 'Home 입단 CTA 제목', type: 'text' },
  { name: 'support_text', label: '후원 안내 문구', type: 'textarea', rows: 4 },
  { name: 'join_cta_text', label: '입단 CTA 문구', type: 'textarea', rows: 4 },
  { name: 'home_join_button_label', label: 'Home 입단 CTA 버튼 문구', type: 'text' },
  { name: 'home_support_title', label: 'Home 후원 CTA 제목', type: 'text' },
  { name: 'home_support_button_label', label: 'Home 후원 CTA 버튼 문구', type: 'text' },
  { name: 'email', label: '대표 이메일', type: 'email' },
  { name: 'phone', label: '대표 전화', type: 'text' },
  { name: 'fax', label: 'FAX', type: 'text' },
  { name: 'address', label: '주소', type: 'textarea', rows: 3 },
  {
    name: 'youtube_url',
    label: 'YouTube URL',
    type: 'url',
    description: 'Footer 소셜 영역에 노출됩니다. https://로 시작하는 전체 주소를 입력하세요.',
    placeholder: 'https://www.youtube.com/@...',
  },
  {
    name: 'instagram_url',
    label: 'Instagram URL',
    type: 'url',
    description: 'Footer 소셜 영역에 노출됩니다. https://로 시작하는 전체 주소를 입력하세요.',
    placeholder: 'https://www.instagram.com/...',
  },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<SiteSettingsRow>>

const locationFields = [
  { name: 'place_name', label: '장소명', type: 'text' },
  { name: 'address', label: '주소', type: 'textarea', rows: 3 },
  { name: 'naver_map_url', label: '네이버 지도 URL', type: 'url' },
  { name: 'kakao_map_url', label: '카카오 지도 URL', type: 'url' },
  { name: 'transit_info', label: '대중교통 안내', type: 'textarea', rows: 4 },
  { name: 'parking_info', label: '주차 안내', type: 'textarea', rows: 4 },
  { name: 'phone', label: '문의 전화', type: 'text' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<LocationRow>>

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="방문자 화면에 사용하는 기본 문구, 연락처, 소셜 링크를 관리합니다."
        title="홈페이지 기본 설정"
      />
      <AdminSingleRecordSection
        defaultValues={{
          is_visible: true,
          site_title: '서울모테트청소년합창단',
        }}
        description="사이트 대표 정보가 없으면 새로 생성하고, 있으면 기존 정보를 수정합니다."
        fields={siteSettingsFields}
        table="site_settings"
        title="사이트 정보"
      />
      <AdminSingleRecordSection
        defaultValues={{ is_visible: true }}
        description="오시는 길 기본 정보를 관리합니다. 지도는 URL 입력 방식만 사용합니다."
        fields={locationFields}
        table="locations"
        title="오시는 길 기본 정보"
      />
    </div>
  )
}
