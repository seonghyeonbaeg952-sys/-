import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { MemberRow } from '../../types/cms'
import {
  getMemberGroupLabel,
  getMemberPartLabel,
  getMemberStatusLabel,
  getProtectedMemberName,
} from '../../utils/memberName'

const partOptions = [
  { label: '소프라노', value: 'soprano' },
  { label: '알토', value: 'alto' },
  { label: '테너', value: 'tenor' },
  { label: '베이스', value: 'bass' },
]

const groupOptions = [
  { label: '초등부', value: 'elementary' },
  { label: '중등부', value: 'middle' },
  { label: '고등부', value: 'high' },
  { label: '대학부', value: 'university' },
  { label: '스태프', value: 'staff' },
]

const statusOptions = [
  { label: '현재단원', value: 'active' },
  { label: '역대단원', value: 'alumni' },
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
    name: 'member_status',
    label: '활동 상태',
    type: 'select',
    options: statusOptions,
    required: true,
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
    header: '공개 이름',
    render: (row) => getProtectedMemberName(row),
  },
  {
    header: '그룹',
    render: (row) => getMemberGroupLabel(row.group_type),
  },
  {
    header: '활동 상태',
    render: (row) => getMemberStatusLabel(row.member_status),
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
        group_type: 'middle',
        is_visible: true,
        member_status: 'active',
        name_display_type: 'hidden',
        part: 'soprano',
      }}
      description="현재단원, 스태프, 역대단원의 이름 공개 방식을 관리합니다. 청소년 개인정보 보호를 위해 이름 공개 방식은 기본 비공개입니다."
      emptyMessage="등록된 단원이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 그룹',
          column: 'group_type',
          label: '그룹',
          options: groupOptions,
        },
        {
          allLabel: '전체 활동 상태',
          column: 'member_status',
          label: '활동 상태',
          options: statusOptions,
        },
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
      info="방문자 화면에는 공개 상태가 켜진 단원만 표시되며, 이름은 full, partial, hidden 설정에 따라 보호 표시됩니다. 공개 화면의 역대단원 탭은 현재단원까지 포함한 전체 공개 단원 명단으로 표시되고, 활동 상태의 역대단원 값은 과거 활동 단원을 구분해 관리하는 용도입니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="name"
      searchPlaceholder="단원 이름 검색"
      table="members"
      title="단원 관리"
    />
  )
}
