import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, JoinApplicationRow } from '../../types/cms'

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '검토 중', value: 'in_review' },
  { label: '합격', value: 'accepted' },
  { label: '불합격', value: 'rejected' },
  { label: '보관', value: 'archived' },
]

const fields = [
  { name: 'applicant_name', label: '지원자 이름', type: 'text', readOnly: true },
  { name: 'applicant_phone', label: '지원자 연락처', type: 'text', readOnly: true },
  { name: 'guardian_name', label: '보호자 이름', type: 'text', readOnly: true },
  { name: 'guardian_phone', label: '보호자 연락처', type: 'text', readOnly: true },
  { name: 'email', label: '이메일', type: 'email', readOnly: true },
  { name: 'school', label: '학교', type: 'text', readOnly: true },
  { name: 'grade', label: '학년', type: 'text', readOnly: true },
  { name: 'desired_part', label: '희망 파트', type: 'text', readOnly: true },
  { name: 'music_experience', label: '음악 경험', type: 'textarea', rows: 5, readOnly: true },
  { name: 'motivation', label: '지원 동기', type: 'textarea', rows: 5, readOnly: true },
  { name: 'vision', label: '비전', type: 'textarea', rows: 5, readOnly: true },
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
  { name: 'admin_notes', label: '관리자 메모', type: 'textarea', rows: 4 },
  { name: 'is_archived', label: '보관 처리', type: 'switch' },
] satisfies Array<AdminFieldConfig<JoinApplicationRow>>

const columns = [
  { header: '지원자', value: 'applicant_name' },
  { header: '학교', value: 'school' },
  { header: '학년', value: 'grade' },
  { header: '보호자', value: 'guardian_name' },
  {
    header: '상태',
    render: (row) =>
      statusOptions.find((option) => option.value === row.status)?.label ?? row.status,
  },
  { header: '접수일', value: 'created_at' },
] satisfies Array<AdminTableColumn<JoinApplicationRow>>

function preparePayload(payload: CmsMutationPayload) {
  return {
    admin_notes: payload.admin_notes,
    is_archived: payload.is_archived,
    status: payload.status,
  }
}

export function AdminJoinApplicationsPage() {
  return (
    <AdminCrudListPage
      canCreate={false}
      columns={columns}
      description="입단지원서 제출 내용을 확인하고 처리 상태를 관리합니다."
      emptyMessage="접수된 입단지원서가 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 상태',
          column: 'status',
          label: '처리 상태',
          options: statusOptions,
        },
        {
          allLabel: '전체 보관 상태',
          column: 'is_archived',
          label: '보관 여부',
          options: [
            { label: '보관', value: 'true' },
            { label: '보관 안 함', value: 'false' },
          ],
        },
      ]}
      info="지원서 원문은 관리자 화면에서만 확인합니다. public 화면에는 노출하지 않습니다."
      order={{ column: 'created_at', ascending: false }}
      preparePayload={preparePayload}
      searchColumn="applicant_name"
      searchPlaceholder="지원자 이름 검색"
      showVisibility={false}
      table="join_applications"
      title="입단지원서 관리"
    />
  )
}
