import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { ContactRow } from '../../types/cms'

const typeOptions = [
  { label: '입단 문의', value: 'join' },
  { label: '공연 섭외', value: 'concert_request' },
  { label: '후원 문의', value: 'support' },
  { label: '일반 문의', value: 'general' },
]

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '처리 중', value: 'in_progress' },
  { label: '완료', value: 'done' },
]

const fields = [
  { name: 'name', label: '이름', type: 'text', readOnly: true },
  { name: 'email', label: '이메일', type: 'email', readOnly: true },
  { name: 'phone', label: '전화번호', type: 'text', readOnly: true },
  { name: 'type', label: '문의 유형', type: 'select', options: typeOptions, readOnly: true },
  { name: 'title', label: '제목', type: 'text', readOnly: true },
  { name: 'message', label: '문의 내용', type: 'textarea', rows: 8, readOnly: true },
  { name: 'privacy_agreed', label: '개인정보 동의', type: 'switch' },
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
] satisfies Array<AdminFieldConfig<ContactRow>>

const columns = [
  { header: '제목', value: 'title' },
  { header: '이름', value: 'name' },
  { header: '이메일', value: 'email' },
  {
    header: '유형',
    render: (row) =>
      typeOptions.find((option) => option.value === row.type)?.label ?? row.type,
  },
  {
    header: '상태',
    render: (row) =>
      statusOptions.find((option) => option.value === row.status)?.label ??
      row.status,
  },
  { header: '접수일', value: 'created_at' },
] satisfies Array<AdminTableColumn<ContactRow>>

export function AdminContactsPage() {
  return (
    <AdminCrudListPage
      canCreate={false}
      columns={columns}
      description="방문자가 남긴 문의를 확인하고 처리 상태를 변경합니다."
      emptyMessage="접수된 문의가 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 유형',
          column: 'type',
          label: '문의 유형',
          options: typeOptions,
        },
        {
          allLabel: '전체 상태',
          column: 'status',
          label: '처리 상태',
          options: statusOptions,
        },
      ]}
      info="문의 내용은 관리자 화면에서만 조회합니다. public 화면에는 표시하지 않습니다."
      order={{ column: 'created_at', ascending: false }}
      searchColumn="title"
      searchPlaceholder="문의 제목 검색"
      table="contacts"
      title="문의 관리"
    />
  )
}
