import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
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

export function AdminAccompanistPage() {
  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="반주자 소개 정보와 프로필 사진을 관리합니다."
        title="반주자 관리"
      />
      <AdminSingleRecordSection
        defaultValues={{ is_visible: true, role: '반주자' }}
        fields={fields}
        table="accompanist"
        title="반주자 프로필"
      />
    </div>
  )
}
