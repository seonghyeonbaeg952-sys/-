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
    description:
      '예: foundation, education, activities, mission, spirit_hero, spirit_manifesto, spirit_motet, spirit_education, spirit_peace, spirit_cta, home_spirit',
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
      description="방문자 화면에 표시되는 합창단 소개, 정신과 교육철학, 홈 요약 문구를 관리합니다."
      emptyMessage="등록된 소개 섹션이 없습니다."
      fields={fields}
      info="공개 화면에는 공개 여부가 켜진 섹션만 표시됩니다. spirit_* 섹션은 /spirit과 /about?section=spirit에, home_spirit은 홈 정신 섹션에 반영됩니다. cta_label, cta_url, secondary_cta_label, secondary_cta_url 같은 구조화 문구를 본문 상단에 넣을 수 있습니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="제목 검색"
      table="about_sections"
      title="합창단 소개 관리"
    />
  )
}
