import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { FaqRow, JoinInfoRow } from '../../types/cms'

const joinInfoFields = [
  { name: 'title', label: '제목', type: 'text' },
  { name: 'description', label: '설명', type: 'textarea', rows: 4 },
  { name: 'target', label: '지원 대상', type: 'textarea', rows: 4 },
  { name: 'parts', label: '모집 파트', type: 'textarea', rows: 3 },
  { name: 'audition_process', label: '오디션 절차', type: 'textarea', rows: 5 },
  { name: 'preparation', label: '준비 사항', type: 'textarea', rows: 4 },
  { name: 'rehearsal_time', label: '연습 시간', type: 'text' },
  { name: 'rehearsal_location', label: '연습 장소', type: 'text' },
  { name: 'application_url', label: '입단 신청 URL', type: 'url' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<JoinInfoRow>>

const faqFields = [
  { name: 'question', label: '질문', type: 'text', required: true },
  { name: 'answer', label: '답변', type: 'textarea', rows: 5 },
  { name: 'category', label: '카테고리', type: 'text' },
  { name: 'display_order', label: '표시 순서', type: 'number' },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<FaqRow>>

const faqColumns = [
  { header: '질문', value: 'question' },
  { header: '카테고리', value: 'category' },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<FaqRow>>

export function AdminJoinPage() {
  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="입단 안내 본문과 자주 묻는 질문을 관리합니다."
        title="입단 안내 관리"
      />
      <AdminSingleRecordSection
        defaultValues={{ is_visible: true }}
        fields={joinInfoFields}
        table="join_info"
        title="입단 안내"
      />
      <AdminCrudListPage
        columns={faqColumns}
        defaultValues={{
          category: 'join',
          display_order: 0,
          is_visible: true,
        }}
        description="입단 안내 페이지에 표시할 FAQ를 관리합니다."
        emptyMessage="등록된 FAQ가 없습니다."
        fields={faqFields}
        order={{ column: 'display_order', ascending: true }}
        searchColumn="question"
        searchPlaceholder="FAQ 질문 검색"
        table="faq"
        title="FAQ 관리"
      />
    </div>
  )
}
