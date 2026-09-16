import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
import { AdminIntakeLimits } from '../../components/admin/AdminIntakeLimits'
import { Button } from '../../components/common/Button'
import type { CmsMutationPayload, SiteSettingsRow } from '../../types/cms'

const siteBasicFields = [
  { name: 'site_title', label: '사이트명', type: 'text', required: true },
  {
    description: '푸터와 일부 기본 안내 화면의 짧은 단체 소개입니다. 홈 섹션 문구는 “홈페이지 편집 · 미리보기”에서 수정합니다.',
    label: '사이트 소개 한 줄',
    name: 'about_summary',
    type: 'textarea',
    rows: 4,
  },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<SiteSettingsRow>>

const contactFields = [
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
] satisfies Array<AdminFieldConfig<SiteSettingsRow>>

function isValidOptionalUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return true
  }

  try {
    const url = new URL(value.trim())

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validateUrlPayload(payload: CmsMutationPayload) {
  const invalidUrlField = [
    ['youtube_url', 'YouTube URL'],
    ['instagram_url', 'Instagram URL'],
    ['naver_map_url', '네이버 지도 URL'],
    ['kakao_map_url', '카카오 지도 URL'],
  ].find(([field]) => !isValidOptionalUrl(payload[field]))

  return invalidUrlField
    ? `${invalidUrlField[1]}은 http:// 또는 https://로 시작하는 주소만 저장할 수 있습니다.`
    : null
}

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="대표 정보와 연락처를 관리합니다. 화면의 문구·글꼴·색은 ‘홈페이지 편집 · 미리보기’에서 임시저장 후 게시하세요."
        title="홈페이지 기본 설정"
      />
      <AdminSingleRecordSection
        defaultValues={{
          is_visible: true,
          site_title: '서울모테트청소년합창단',
        }}
        description="사이트 대표명과 공통 소개 문구를 관리합니다. Hero, 입단 CTA, 갤러리 등 홈 전용 문구는 이 화면에서 분리했습니다."
        fields={siteBasicFields}
        table="site_settings"
        title="사이트 기본 정보"
      />
      <AdminSingleRecordSection
        defaultValues={{ is_visible: true }}
        description="푸터와 문의 화면에서 사용하는 대표 연락처와 외부 채널 링크입니다."
        fields={contactFields}
        table="site_settings"
        title="연락처와 외부 링크"
        validatePayload={validateUrlPayload}
      />
      <section className="border-t border-line-default pt-5"><h2 className="mb-2 font-semibold">오시는 길</h2><p className="mb-4 text-sm text-text-muted">장소·주소·지도·교통 안내는 오시는 길 관리에서 한 번만 수정합니다.</p><Button href="/admin/location" variant="secondary">오시는 길 관리</Button></section>
      <AdminIntakeLimits />
    </div>
  )
}
