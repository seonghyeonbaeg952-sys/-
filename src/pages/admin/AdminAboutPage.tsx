import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { AboutSectionRow } from '../../types/cms'

const fields = [
  {
    name: 'section_key',
    label: '섹션 키',
    type: 'text',
    required: true,
    placeholder: 'foundation',
    description: '예: foundation, education, activities, mission',
  },
  {
    name: 'title',
    label: '제목',
    type: 'text',
    placeholder: '창단 배경',
  },
  {
    name: 'content',
    label: '본문',
    type: 'textarea',
    rows: 9,
    required: true,
    placeholder: '방문자 화면에 표시할 소개 문구를 입력해 주세요.',
  },
  { name: 'display_order', label: '표시 순서', type: 'number' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<AboutSectionRow>>

const columns = [
  { header: '섹션 키', value: 'section_key' },
  { header: '제목', value: 'title' },
  {
    header: '본문',
    render: (row) => (
      <span className="line-clamp-2 max-w-xl text-text-muted">
        {row.content}
      </span>
    ),
  },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<AboutSectionRow>>

export function AdminAboutPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        display_order: 0,
        is_visible: true,
        section_key: 'foundation',
      }}
      description="방문자 화면에 표시되는 합창단 소개 문구를 관리합니다."
      emptyMessage="등록된 소개 섹션이 없습니다."
      fields={fields}
      info="공개 화면에는 공개 여부가 켜진 섹션만 표시됩니다. 오래된 시점 표현은 운영 중 어색해지지 않도록 현재형 또는 지속형 문장으로 관리해 주세요."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="제목 검색"
      table="about_sections"
      title="합창단 소개 관리"
    />
  )
}
