import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, SupportPledgeRow } from '../../types/cms'

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '처리 중', value: 'in_progress' },
  { label: '완료', value: 'done' },
]

const genderOptions = [
  { label: '선택 안 함', value: '' },
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
  { label: '응답하지 않음', value: 'none' },
]

const memberTypeOptions = [
  { label: '개인회원', value: 'individual' },
  { label: '기업회원', value: 'corporate' },
]

function formatAmount(value: number | null | undefined) {
  if (!value) {
    return '-'
  }

  return `${value.toLocaleString('ko-KR')}원`
}

const fields = [
  { name: 'name', label: '이름', type: 'text', readOnly: true },
  { name: 'phone', label: '핸드폰', type: 'text', readOnly: true },
  { name: 'email', label: 'E-mail', type: 'email', readOnly: true },
  {
    name: 'gender',
    label: '성별',
    type: 'select',
    options: genderOptions,
    readOnly: true,
  },
  { name: 'birth_date', label: '생년월일', type: 'date', readOnly: true },
  { name: 'address', label: '주소', type: 'textarea', rows: 3, readOnly: true },
  {
    name: 'member_type',
    label: '회원 유형',
    type: 'select',
    options: memberTypeOptions,
    readOnly: true,
  },
  { name: 'amount', label: '후원금', type: 'number', readOnly: true },
  { name: 'custom_amount', label: '기타 금액', type: 'number', readOnly: true },
  { name: 'depositor', label: '예금주', type: 'text', readOnly: true },
  { name: 'pledge_date', label: '약정 날짜', type: 'date', readOnly: true },
  { name: 'signer_name', label: '서명 이름', type: 'text', readOnly: true },
  {
    name: 'signature_image_url',
    label: '그린 인/서명',
    type: 'signature',
    readOnly: true,
    description: '방문자가 약정서에서 마우스 또는 터치로 작성한 서명입니다.',
  },
  { name: 'privacy_agreed', label: '개인정보 동의', type: 'switch', readOnly: true },
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
] satisfies Array<AdminFieldConfig<SupportPledgeRow>>

const columns = [
  { header: '이름', value: 'name' },
  { header: '핸드폰', value: 'phone' },
  { header: 'E-mail', value: 'email' },
  {
    header: '유형',
    render: (row) =>
      memberTypeOptions.find((option) => option.value === row.member_type)?.label ??
      row.member_type,
  },
  {
    header: '후원금',
    render: (row) => formatAmount(row.amount),
  },
  {
    header: '상태',
    render: (row) =>
      statusOptions.find((option) => option.value === row.status)?.label ?? row.status,
  },
  { header: '접수일', value: 'created_at' },
] satisfies Array<AdminTableColumn<SupportPledgeRow>>

function preparePayload(payload: CmsMutationPayload) {
  return {
    status: payload.status,
  } satisfies CmsMutationPayload
}

export function AdminSupportPledgesPage() {
  return (
    <AdminCrudListPage
      canCreate={false}
      columns={columns}
      description="방문자가 제출한 후원약정 정보를 확인하고 처리 상태를 변경합니다."
      emptyMessage="접수된 후원약정이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 회원 유형',
          column: 'member_type',
          label: '회원 유형',
          options: memberTypeOptions,
        },
        {
          allLabel: '전체 처리 상태',
          column: 'status',
          label: '처리 상태',
          options: statusOptions,
        },
      ]}
      info="후원약정에는 개인정보가 포함됩니다. 이 목록은 관리자에게만 표시되며 public 화면에는 노출되지 않습니다."
      order={{ column: 'created_at', ascending: false }}
      preparePayload={preparePayload}
      searchColumn="name"
      searchPlaceholder="후원자 이름 검색"
      showVisibility={false}
      table="support_pledges"
      title="후원 신청 관리"
    />
  )
}
