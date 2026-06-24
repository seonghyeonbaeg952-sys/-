import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { MemberRow } from '../../types/cms'
import { getMemberPartLabel, getProtectedMemberName } from '../../utils/memberName'

const partOptions = [
  { label: '소프라노', value: 'soprano' },
  { label: '알토', value: 'alto' },
  { label: '테너', value: 'tenor' },
  { label: '베이스', value: 'bass' },
  { label: '기타', value: 'other' },
]

const groupOptions = [
  { label: '초등부', value: 'elementary' },
  { label: '중등부', value: 'middle' },
  { label: '고등부', value: 'high' },
  { label: '졸업단원', value: 'alumni' },
  { label: '기타', value: 'other' },
]

const displayOptions = [
  { label: '실명 공개', value: 'full' },
  { label: '부분 공개', value: 'partial' },
  { label: '이름 비공개', value: 'hidden' },
]

const fields = [
  { name: 'name', label: '이름', type: 'text' },
  { name: 'part', label: '파트', type: 'select', options: partOptions, required: true },
  {
    name: 'group_type',
    label: '그룹',
    type: 'select',
    options: groupOptions,
    required: true,
  },
  {
    name: 'photo_url',
    label: '단원 사진',
    type: 'image',
    folder: 'members',
    description:
      '청소년 개인정보 보호를 위해 공개 여부와 이름 공개 방식을 함께 확인하세요.',
  },
  { name: 'description', label: '짧은 소개', type: 'textarea', rows: 3 },
  {
    name: 'name_display_type',
    label: '이름 공개 방식',
    type: 'select',
    options: displayOptions,
    required: true,
  },
  { name: 'display_order', label: '표시 순서', type: 'number' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<MemberRow>>

const columns = [
  {
    header: '사진',
    render: (row) => (
      <AdminImagePreview
        alt={`${getProtectedMemberName(row)} 사진`}
        src={row.photo_url}
      />
    ),
  },
  {
    header: '공개 이름',
    render: (row) => getProtectedMemberName(row),
  },
  {
    header: '파트',
    render: (row) => getMemberPartLabel(row.part),
  },
  {
    header: '이름 공개',
    render: (row) =>
      displayOptions.find((option) => option.value === row.name_display_type)?.label ??
      row.name_display_type,
  },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<MemberRow>>

export function AdminMembersPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        display_order: 0,
        group_type: 'other',
        is_visible: true,
        name_display_type: 'hidden',
        part: 'other',
      }}
      description="단원 정보를 관리합니다. 청소년 개인정보 보호를 위해 이름 공개 방식은 기본 비공개입니다."
      emptyMessage="등록된 단원이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 파트',
          column: 'part',
          label: '파트',
          options: partOptions,
        },
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
      info="청소년 단원 개인정보 보호를 위해 방문자 화면에는 이름 공개 방식(full, partial, hidden)에 따라 표시됩니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="name"
      searchPlaceholder="단원 이름 검색"
      table="members"
      title="단원 관리"
    />
  )
}
