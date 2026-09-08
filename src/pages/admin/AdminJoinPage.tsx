import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import {
  prepareJoinRecruitmentPeriod,
  toSeoulDateTimeLocal,
  validateJoinRecruitmentPeriod,
} from '../../lib/joinRecruitment'
import type { CmsMutationPayload, CmsValue, FaqRow, JoinInfoRow } from '../../types/cms'

function formatRecruitmentField(value: CmsValue | undefined) {
  return toSeoulDateTimeLocal(typeof value === 'string' ? value : null)
}

function recruitmentPeriod(payload: CmsMutationPayload) {
  return {
    recruitment_starts_at: typeof payload.recruitment_starts_at === 'string' ? payload.recruitment_starts_at : null,
    recruitment_ends_at: typeof payload.recruitment_ends_at === 'string' ? payload.recruitment_ends_at : null,
  }
}

function preparePayload(payload: CmsMutationPayload, row: JoinInfoRow | null) {
  const next = { ...payload }
  delete next.recruitment_starts_at
  delete next.recruitment_ends_at
  return { ...next, ...prepareJoinRecruitmentPeriod(recruitmentPeriod(payload), row) }
}

function validatePayload(payload: CmsMutationPayload, row: JoinInfoRow | null) {
  const period = recruitmentPeriod(payload)
  const error = validateJoinRecruitmentPeriod(period)
  if (error) return error
  if (row && (
    (period.recruitment_starts_at && !('recruitment_starts_at' in row)) ||
    (period.recruitment_ends_at && !('recruitment_ends_at' in row))
  )) {
    return '모집 기간 기능을 위한 데이터베이스 업데이트가 필요합니다. 업데이트 후 페이지를 새로고침하고 다시 저장해 주세요.'
  }
  return null
}

const joinInfoFields = [
  { name: 'title', label: '제목', type: 'text' },
  {
    name: 'recruitment_starts_at', label: '모집 시작 (한국 시간)', type: 'datetime-local',
    description: '이 시각부터 접수를 받습니다. 비우면 시작 제한이 없습니다.',
    formatValue: formatRecruitmentField,
  },
  {
    name: 'recruitment_ends_at', label: '모집 종료 (한국 시간)', type: 'datetime-local',
    description: '이 시각부터 접수가 닫힙니다. 비우면 종료 제한이 없습니다.',
    formatValue: formatRecruitmentField,
  },
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
        description="한국 시간(Asia/Seoul) 기준으로 설정합니다. 두 일시를 모두 비우면 상시 접수하며, 설정한 기간에 맞춰 접수가 자동으로 열리고 닫힙니다."
        fields={joinInfoFields}
        preparePayload={preparePayload}
        table="join_info"
        title="입단 안내"
        validatePayload={validatePayload}
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
