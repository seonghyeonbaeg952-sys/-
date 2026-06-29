import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { HeroSlideRow } from '../../types/cms'

const fields = [
  { name: 'title', label: '제목', type: 'text', required: true },
  { name: 'subtitle', label: '부제', type: 'text' },
  { name: 'description', label: '설명', type: 'textarea', rows: 4 },
  {
    name: 'image_url',
    label: 'Hero 이미지',
    type: 'image',
    folder: 'hero',
    description:
      'Home Hero에 사용할 이미지를 업로드하거나 외부 이미지 URL을 입력할 수 있습니다. 이미지가 없으면 navy/gold gradient fallback이 표시됩니다.',
  },
  {
    name: 'image_alt',
    label: '이미지 대체 텍스트',
    type: 'text',
    description:
      '비워 두면 public 화면에서 제목을 기반으로 대체 텍스트를 사용합니다.',
  },
  { name: 'primary_cta_label', label: '1차 버튼 문구', type: 'text' },
  { name: 'primary_cta_href', label: '1차 버튼 링크', type: 'text' },
  { name: 'secondary_cta_label', label: '2차 버튼 문구', type: 'text' },
  { name: 'secondary_cta_href', label: '2차 버튼 링크', type: 'text' },
  { name: 'display_order', label: '표시 순서', type: 'number' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<HeroSlideRow>>

const columns = [
  {
    header: '이미지',
    render: (row) => (
      <AdminImagePreview
        alt={row.image_alt || `${row.title} Hero 이미지`}
        src={row.image_url}
      />
    ),
  },
  { header: '제목', value: 'title' },
  { header: '부제', value: 'subtitle' },
  { header: '1차 CTA', value: 'primary_cta_label' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<HeroSlideRow>>

export function AdminHeroSlidesPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        display_order: 0,
        is_visible: true,
        primary_cta_href: '/concerts',
        primary_cta_label: '공연 일정 보기',
        secondary_cta_href: '',
        secondary_cta_label: '',
      }}
      description="첫 화면에 노출되는 Hero 슬라이드의 사진, 문구, CTA, 공개 상태를 관리합니다."
      emptyMessage="등록된 Hero 슬라이드가 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 공개 상태',
          column: 'is_visible',
          label: '공개 상태',
          options: [
            { label: '공개', value: 'true' },
            { label: '비공개', value: 'false' },
          ],
        },
      ]}
      info="public 홈 화면에는 공개 상태가 켜진 슬라이드만 표시됩니다. 슬라이드 이미지는 16:9 또는 21:9 비율을 권장합니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="슬라이드 제목 검색"
      table="hero_slides"
      title="홈 슬라이드 관리"
    />
  )
}
