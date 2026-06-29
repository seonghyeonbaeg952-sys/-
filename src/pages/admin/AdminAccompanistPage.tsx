import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { PersonProfileRow } from '../../types/cms'

const fields = [
  { name: 'name', label: '이름', type: 'text', required: true },
  { name: 'role', label: '역할', type: 'text' },
  {
    name: 'photo_url',
    label: '프로필 사진',
    type: 'image',
    folder: 'accompanist',
    description:
      '업로드한 public URL이 사진 필드에 저장됩니다. 외부 URL도 사용할 수 있습니다.',
  },
  { name: 'description', label: '짧은 소개', type: 'textarea', rows: 3 },
  { name: 'bio', label: '약력', type: 'textarea', rows: 7 },
  { name: 'message', label: '인사말', type: 'textarea', rows: 5 },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<PersonProfileRow>>

const columns = [
  {
    header: '사진',
    render: (row) => (
      <AdminImagePreview
        alt={`${row.name || row.role || '반주자'} 프로필 사진`}
        src={row.photo_url}
      />
    ),
  },
  { header: '이름', value: 'name' },
  { header: '역할', value: 'role' },
  {
    header: '소개',
    render: (row) => row.description || '-',
  },
] satisfies Array<AdminTableColumn<PersonProfileRow>>

export function AdminAccompanistPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{ is_visible: true, role: '반주자' }}
      description="반주자 소개 정보와 프로필 사진을 여러 명까지 등록하고 수정할 수 있습니다."
      emptyMessage="등록된 반주자가 없습니다."
      fields={fields}
      filters={[
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
      info="public 소개 페이지에는 공개 상태가 켜진 반주자만 등록 순서대로 표시됩니다."
      order={{ column: 'created_at', ascending: true }}
      searchColumn="name"
      searchPlaceholder="반주자 이름 검색"
      table="accompanist"
      title="반주자 관리"
    />
  )
}
