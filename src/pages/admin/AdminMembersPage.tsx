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
  { label: '반주자', value: 'accompanist' },
  { label: '미표시', value: 'hidden' },
  { label: '기타', value: 'other' },
]

const groupOptions = [
  { label: '초등부', value: 'elementary' },
  { label: '중등부', value: 'middle' },
  { label: '고등부', value: 'high' },
  { label: '대학부', value: 'university' },
  { label: '스태프', value: 'staff' },
  { label: '미표시', value: 'hidden' },
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
  { name: 'name', label: '한국어 이름', type: 'text' },
  { name: 'name_en', label: '영문 이름', type: 'text', description: '공식 영문 표기를 확인한 뒤 입력하세요. 공개 화면에는 한국어 이름과 동일한 이름 공개 방식이 적용됩니다.' },
  { name: 'part', label: '파트', type: 'select', options: partOptions, required: true, description: '스태프도 지정한 성부·반주 파트 명단에 함께 표시됩니다. 미표시·기타 파트의 스태프만 스태프 분류에 남습니다. 이름 공개 방식과 단원 공개 여부는 유지됩니다.' },
  {
    name: 'group_type',
    label: '그룹',
    type: 'select',
    options: groupOptions,
    required: true,
    description: '그룹은 관리용입니다. 스태프도 파트가 있으면 해당 파트에, 파트가 없으면 스태프 분류에 표시됩니다. 홈페이지에는 개인별 설명 없이 이름만 표시됩니다.',
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
  { header: '영문 이름', render: (row) => row.name_en?.trim() || '미입력' },
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
      description="현재단원, 스태프, 역대단원의 한국어·영문 이름과 공개 방식을 관리합니다. 청소년 개인정보 보호를 위해 이름 공개 방식은 기본 비공개입니다."
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
      info="방문자 화면에는 공개 상태가 켜진 단원만 표시됩니다. 한국어·영문 이름 모두 같은 전체·부분·비공개 설정을 따릅니다. 영문 이름이 없으면 영어 화면도 보호된 한국어 이름을 표시합니다. 현단원 탭은 현재 활동 단원을 파트별로 표시합니다. 역대단원 탭은 현단원까지 포함한 모든 공개 단원을 파트 구분 없이 가나다순으로 표시합니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="name"
      searchPlaceholder="단원 이름 검색"
      table="members"
      title="단원 관리"
    />
  )
}
