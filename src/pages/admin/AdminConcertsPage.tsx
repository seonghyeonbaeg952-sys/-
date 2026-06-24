import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { ConcertRow } from '../../types/cms'

const categoryOptions = [
  { label: '정기연주회', value: 'regular' },
  { label: '초청연주', value: 'invited' },
  { label: '특별연주', value: 'special' },
  { label: '교회/예배연주', value: 'church' },
  { label: '지난 공연', value: 'past' },
  { label: '기타', value: 'other' },
]

const statusOptions = [
  { label: '예정', value: 'upcoming' },
  { label: '접수 중', value: 'open' },
  { label: '예매 가능', value: 'ticketing' },
  { label: '마감', value: 'closed' },
  { label: '종료', value: 'past' },
  { label: '취소', value: 'canceled' },
]

const fields = [
  { name: 'title', label: '공연명', type: 'text', required: true },
  { name: 'category', label: '카테고리', type: 'select', options: categoryOptions },
  { name: 'concert_date', label: '공연 날짜', type: 'date' },
  { name: 'concert_time', label: '공연 시간', type: 'text' },
  { name: 'location', label: '장소', type: 'text' },
  {
    name: 'poster_url',
    label: '공연 포스터',
    type: 'image',
    folder: 'concerts',
    description: '포스터 이미지를 업로드하거나 외부 이미지 URL을 입력할 수 있습니다.',
  },
  { name: 'description', label: '공연 설명', type: 'textarea', rows: 4 },
  { name: 'program', label: '프로그램', type: 'textarea', rows: 5 },
  { name: 'performers', label: '출연', type: 'textarea', rows: 4 },
  { name: 'ticket_url', label: '예매 URL', type: 'url' },
  { name: 'apply_url', label: '신청 URL', type: 'url' },
  { name: 'status', label: '상태', type: 'select', options: statusOptions },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<ConcertRow>>

const columns = [
  {
    header: '포스터',
    render: (row) => (
      <AdminImagePreview alt={`${row.title} 포스터`} src={row.poster_url} />
    ),
  },
  { header: '공연명', value: 'title' },
  { header: '날짜', value: 'concert_date' },
  { header: '장소', value: 'location' },
  {
    header: '상태',
    render: (row) =>
      statusOptions.find((option) => option.value === row.status)?.label ?? row.status,
  },
] satisfies Array<AdminTableColumn<ConcertRow>>

export function AdminConcertsPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        category: 'other',
        is_visible: true,
        status: 'upcoming',
      }}
      description="공연 일정, 포스터, 상태, 공개 여부를 관리합니다."
      emptyMessage="등록된 공연이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 카테고리',
          column: 'category',
          label: '카테고리',
          options: categoryOptions,
        },
        {
          allLabel: '전체 상태',
          column: 'status',
          label: '상태',
          options: statusOptions,
        },
      ]}
      order={{ column: 'concert_date', ascending: false }}
      searchColumn="title"
      searchPlaceholder="공연명 검색"
      table="concerts"
      title="공연 관리"
    />
  )
}
