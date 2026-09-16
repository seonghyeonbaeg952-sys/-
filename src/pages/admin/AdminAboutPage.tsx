import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { AboutSectionRow, CmsMutationPayload } from '../../types/cms'

const sectionOptions = [
  { value: 'foundation', label: '합창단 소개 · 창단 배경' },
  { value: 'education', label: '합창단 소개 · 교육' },
  { value: 'activities', label: '합창단 소개 · 활동' },
  { value: 'mission', label: '합창단 소개 · 지향점' },
  { value: 'spirit_hero', label: '합창단 정신 · 첫 화면' },
  { value: 'spirit_manifesto', label: '합창단 정신 · 선언문' },
  { value: 'spirit_motet', label: '합창단 정신 · 모테트의 의미' },
  { value: 'spirit_education', label: '합창단 정신 · 교육 철학' },
  { value: 'spirit_peace', label: '합창단 정신 · 평화와 나눔' },
  { value: 'spirit_cta', label: '합창단 정신 · 참여 안내' },
  { value: 'home_spirit', label: '홈 · 합창단 정신 요약' },
]

function validatePayload(payload: CmsMutationPayload, row: AboutSectionRow | null) {
  return sectionOptions.some(option => option.value === payload.section_key)
    || (Boolean(row?.section_key) && payload.section_key === row?.section_key)
    ? null : '문구를 적용할 위치를 목록에서 선택해 주세요.'
}

const fields = [
  {
    name: 'section_key',
    label: '적용 위치',
    type: 'select',
    options: sectionOptions,
    required: true,
    description:
      '관리할 문구의 위치를 선택해 주세요. 기존에 등록된 위치는 그대로 유지할 수 있습니다.',
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
  { header: '적용 위치', render: row => sectionOptions.find(option => option.value === row.section_key)?.label ?? `기존 위치: ${row.section_key}` },
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
      validatePayload={validatePayload}
      info="공개 화면에는 공개 여부가 켜진 섹션만 표시됩니다. spirit_* 섹션은 /spirit과 /about?section=overview#spirit에, home_spirit은 홈 정신 섹션에 반영됩니다. cta_label, cta_url, secondary_cta_label, secondary_cta_url 같은 구조화 문구를 본문 상단에 넣을 수 있습니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="title"
      searchPlaceholder="제목 검색"
      table="about_sections"
      title="합창단 소개 관리"
    />
  )
}
