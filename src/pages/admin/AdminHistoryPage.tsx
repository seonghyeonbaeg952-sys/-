import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { HistoryRow } from '../../types/cms'

const fields = [
  { name: 'year', label: '연도', type: 'text', required: true },
  { name: 'month', label: '월', type: 'text' },
  { name: 'title', label: '제목', type: 'text' },
  { name: 'content', label: '내용', type: 'textarea', rows: 5, required: true },
  { name: 'image_url', label: '연혁 이미지', type: 'image', folder: 'history' },
  { name: 'display_order', label: '표시 순서', type: 'number' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<HistoryRow>>

const columns = [
  {
    header: '이미지',
    render: (row) => (
      <AdminImagePreview
        alt={`${row.year}${row.month ? ` ${row.month}` : ''} 연혁 이미지`}
        src={row.image_url}
      />
    ),
  },
  { header: '연도', value: 'year' },
  { header: '월', value: 'month' },
  { header: '제목', value: 'title' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<HistoryRow>>

export function AdminHistoryPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{ display_order: 0, is_visible: true }}
      description="합창단 연혁을 관리합니다."
      emptyMessage="등록된 연혁이 없습니다."
      fields={fields}
      order={{ column: 'display_order', ascending: true }}
      searchColumn="year"
      searchPlaceholder="연도 검색"
      table="history"
      title="연혁 관리"
    />
  )
}
