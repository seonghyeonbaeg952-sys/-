import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { PersonProfileRow } from '../../types/cms'

const fields = [
  { name: 'name', label: '이름', type: 'text', required: true },
  { name: 'role', label: '역할', type: 'text' },
  {
    name: 'photo_url',
    label: '프로필 사진',
    type: 'image',
    folder: 'conductor',
    description:
      '업로드한 public URL이 사진 필드에 저장됩니다. 외부 URL도 사용할 수 있습니다.',
  },
  {
    name: 'profile_image_alt',
    label: '프로필 사진 대체 텍스트',
    type: 'text',
    description: '예: 지휘자 홍길동 프로필 사진',
  },
  {
    name: 'hero_quote',
    label: '대표 문장',
    type: 'textarea',
    rows: 2,
    description: '사진 아래에 짧게 표시되는 문장입니다.',
  },
  {
    name: 'description',
    label: '짧은 소개',
    type: 'textarea',
    rows: 3,
    description: '방문자가 가장 먼저 읽는 문장입니다. 지휘 방향과 교육 관점을 2~3문장으로 적어 주세요.',
  },
  {
    name: 'profile_highlight',
    label: 'Profile 강조 문장',
    type: 'textarea',
    rows: 3,
    description: '프로필 본문 위의 Soft Gold 강조 박스에 표시됩니다.',
  },
  {
    name: 'profile_summary',
    label: 'Profile 본문',
    type: 'textarea',
    rows: 7,
    description: '공식 프로필 문서의 본문입니다. 문단은 빈 줄로 나누면 public 화면에도 반영됩니다.',
  },
  {
    name: 'bio',
    label: '약력',
    type: 'textarea',
    rows: 7,
    description: '기존 호환용 본문입니다. Profile 본문이 비어 있으면 public 프로필 본문으로 사용됩니다.',
  },
  {
    name: 'current_roles',
    label: '현재 역할',
    type: 'textarea',
    rows: 4,
    description: '한 줄에 하나씩 입력합니다.',
  },
  {
    name: 'education_items',
    label: '학력',
    type: 'textarea',
    rows: 5,
    description: '한 줄에 하나씩 입력합니다. 데이터가 없으면 public에서 섹션을 숨깁니다.',
  },
  {
    name: 'career_items',
    label: '주요 경력',
    type: 'textarea',
    rows: 6,
    description: '한 줄에 하나씩 입력합니다.',
  },
  {
    name: 'awards_items',
    label: '수상 및 주요 활동',
    type: 'textarea',
    rows: 5,
    description: '수상, 강의, 초청활동 등을 한 줄에 하나씩 입력합니다.',
  },
  {
    name: 'philosophy_title',
    label: '철학 섹션 제목',
    type: 'text',
    placeholder: '지휘와 교육철학',
  },
  {
    name: 'philosophy_quote',
    label: '철학 인용문',
    type: 'textarea',
    rows: 2,
  },
  {
    name: 'philosophy_body',
    label: '지휘와 교육철학 본문',
    type: 'textarea',
    rows: 6,
    description: '약력과 중복되지 않게 청소년합창단 교육 철학 중심으로 작성합니다.',
  },
  {
    name: 'teaching_principles',
    label: '교육 원리 카드',
    type: 'textarea',
    rows: 6,
    description: '한 줄에 하나씩 `제목: 설명` 형식으로 입력합니다. 비우면 기본 6개 원리가 표시됩니다.',
  },
  {
    name: 'message_title',
    label: '메시지 제목',
    type: 'text',
    placeholder: '지휘자 메시지',
  },
  {
    name: 'message',
    label: '교육 철학/인사말',
    type: 'textarea',
    rows: 5,
    description: '기존 호환용 메시지입니다. 메시지 본문이 비어 있으면 public 메시지로 사용됩니다.',
  },
  {
    name: 'message_body',
    label: '메시지 본문',
    type: 'textarea',
    rows: 6,
    description: '긴 글이면 빈 줄로 문단을 나눠 입력합니다.',
  },
  {
    name: 'activity_images',
    label: '활동 사진',
    type: 'textarea',
    rows: 5,
    description:
      '한 줄에 하나씩 `이미지URL | 대체텍스트 | 캡션` 형식으로 입력합니다. 최대 3장까지 public에 표시됩니다.',
  },
  {
    name: 'is_featured',
    label: '대표 지휘자 표시',
    type: 'switch',
  },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<PersonProfileRow>>

export function AdminConductorPage() {
  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="지휘자 소개 정보, 약력, 교육 철학, 프로필 사진을 관리합니다."
        title="지휘자 관리"
      />
      <AdminSingleRecordSection
        defaultValues={{
          is_featured: true,
          is_visible: true,
          philosophy_body:
            '합창은 서로의 소리를 들으며 함께 자라는 예술입니다. 청소년들은 노래 안에서 귀 기울임, 약속, 어울림, 따뜻한 마음을 배우고, 정통 합창과 교회음악의 정신을 다음 세대의 언어로 이어갑니다.',
          role: '지휘자',
        }}
        fields={fields}
        table="conductor"
        title="지휘자 프로필"
      />
    </div>
  )
}
