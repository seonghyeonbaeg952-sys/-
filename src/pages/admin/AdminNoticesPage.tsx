import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { NoticeRow } from '../../types/cms'

const categoryOptions = [
  { label: '공지사항', value: 'notice' },
  { label: '입단 안내', value: 'join' },
  { label: '공연 안내', value: 'concert' },
  { label: '연습 안내', value: 'rehearsal' },
  { label: '보도자료', value: 'press' },
  { label: '활동소식', value: 'news' },
]

const importantOptions = [
  { label: '중요 공지', value: 'true' },
  { label: '일반 공지', value: 'false' },
]

const fields = [
  { name: 'title', label: '제목', type: 'text', required: true },
  { name: 'category', label: '카테고리', type: 'select', options: categoryOptions },
  { name: 'content', label: '내용', type: 'textarea', rows: 10 },
  {
    name: 'cover_image_url',
    label: '대표 이미지',
    type: 'image',
    folder: 'notices',
    description: '공지 카드와 상세 화면에 사용할 대표 이미지를 관리합니다.',
  },
  { name: 'is_important', label: '중요 공지', type: 'switch' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<NoticeRow>>

const columns = [
  {
    header: '이미지',
    render: (row) => (
      <AdminImagePreview
        alt={`${row.title} 대표 이미지`}
        src={row.cover_image_url}
      />
    ),
  },
  { header: '제목', value: 'title' },
  {
    header: '카테고리',
    render: (row) =>
      categoryOptions.find((option) => option.value === row.category)?.label ??
      row.category,
  },
  {
    header: '중요',
    render: (row) => (row.is_important ? '중요' : '일반'),
  },
  { header: '등록일', value: 'created_at' },
] satisfies Array<AdminTableColumn<NoticeRow>>

export function AdminNoticesPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        category: 'notice',
        is_important: false,
        is_visible: true,
      }}
      description="공지사항, 입단 안내, 보도자료를 작성하고 공개 여부를 관리합니다."
      emptyMessage="등록된 공지사항이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 카테고리',
          column: 'category',
          label: '카테고리',
          options: categoryOptions,
        },
        {
          allLabel: '전체 중요 상태',
          column: 'is_important',
          label: '중요 여부',
          options: importantOptions,
        },
      ]}
      order={{ column: 'created_at', ascending: false }}
      searchColumn="title"
      searchPlaceholder="공지 제목 검색"
      table="notices"
      title="공지사항 관리"
    />
  )
}
