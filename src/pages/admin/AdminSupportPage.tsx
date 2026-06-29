import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import { AdminSingleRecordSection } from '../../components/admin/AdminSingleRecordSection'
import type { CmsMutationPayload, SupportSettingsRow } from '../../types/cms'

const supportFields = [
  { name: 'title', label: '약정서 제목', type: 'text', required: true },
  { name: 'subtitle', label: '약정 문구', type: 'text' },
  {
    name: 'description',
    label: '상단 설명',
    type: 'textarea',
    rows: 3,
  },
  {
    name: 'message',
    label: '후원 취지 안내문',
    type: 'textarea',
    rows: 5,
  },
  {
    name: 'individual_amounts',
    label: '개인회원 후원금 옵션',
    type: 'textarea',
    rows: 3,
    description: '쉼표 또는 줄바꿈으로 입력합니다. 예: 10000, 20000, 30000',
  },
  {
    name: 'corporate_amounts',
    label: '기업회원 후원금 옵션',
    type: 'textarea',
    rows: 3,
    description: '쉼표 또는 줄바꿈으로 입력합니다. 예: 100000, 200000, 300000',
  },
  {
    name: 'allow_custom_amount',
    label: '기타 금액 입력 허용',
    type: 'switch',
  },
  { name: 'bank_name', label: '은행명', type: 'text' },
  {
    name: 'bank_account_number',
    label: '계좌번호',
    type: 'text',
    description: '실제 계좌번호는 코드가 아니라 이 관리자 입력값으로만 관리합니다.',
  },
  { name: 'bank_account_holder', label: '예금주', type: 'text' },
  {
    name: 'bank_note',
    label: '계좌 안내 문구',
    type: 'textarea',
    rows: 3,
  },
  {
    name: 'enable_online_submission',
    label: '온라인 제출 저장 사용',
    type: 'switch',
    description:
      '켜면 약정서 내용이 support_pledges 테이블에 저장됩니다. 실제 자동이체 출금이나 결제는 실행하지 않습니다.',
  },
  {
    name: 'form_note',
    label: '작성 안내 문구',
    type: 'textarea',
    rows: 3,
  },
  {
    name: 'privacy_notice',
    label: '개인정보 안내 문구',
    type: 'textarea',
    rows: 3,
  },
  {
    name: 'print_note',
    label: '인쇄 안내 문구',
    type: 'textarea',
    rows: 3,
  },
  { name: 'submit_button_label', label: '제출 버튼 문구', type: 'text' },
  { name: 'print_button_label', label: '인쇄 버튼 문구', type: 'text' },
  {
    name: 'success_message',
    label: '저장 성공 문구',
    type: 'textarea',
    rows: 2,
  },
  { name: 'contact_phone', label: '후원 문의 전화', type: 'text' },
  { name: 'contact_email', label: '후원 문의 이메일', type: 'email' },
  { name: 'homepage_url', label: '홈페이지 URL', type: 'url' },
  { name: 'organization_name', label: '하단 단체명', type: 'text' },
  {
    name: 'footer_note',
    label: '하단 안내 문구',
    type: 'textarea',
    rows: 3,
  },
  { name: 'is_visible', label: '공개 여부', type: 'switch' },
] satisfies Array<AdminFieldConfig<SupportSettingsRow>>

function normalizeAmountList(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const values = value
    .split(/[\n,]/)
    .map((item) => item.replace(/[^\d]/g, '').trim())
    .filter(Boolean)

  return values.join('\n')
}

function prepareSupportPayload(payload: CmsMutationPayload) {
  return {
    ...payload,
    individual_amounts:
      normalizeAmountList(payload.individual_amounts) ?? payload.individual_amounts,
    corporate_amounts:
      normalizeAmountList(payload.corporate_amounts) ?? payload.corporate_amounts,
  }
}

export function AdminSupportPage() {
  return (
    <div className="space-y-6">
      <AdminPageTitle
        description="후원약정서 문구, 후원금 옵션, 계좌 안내, 온라인 접수 여부를 관리합니다."
        title="후원약정 관리"
      />
      <AdminSingleRecordSection
        defaultValues={{
          allow_custom_amount: true,
          bank_note: '후원 계좌 정보는 관리자 CMS에서 등록한 뒤 표시됩니다.',
          corporate_amounts: '100000\n200000\n300000\n500000\n1000000',
          description:
            '후원은 서울모테트청소년합창단의 연습, 공연, 교육 활동이 안정적으로 이어지는 기반이 됩니다.',
          enable_online_submission: true,
          footer_note:
            '입력 내용은 관리자 CMS에 안전하게 저장되며 공개 화면에는 표시되지 않습니다.',
          form_note:
            '작성 후 온라인 제출하거나 인쇄/PDF 저장으로 보관할 수 있습니다. 자동이체 출금은 별도 확인 절차 후 진행됩니다.',
          individual_amounts: '10000\n20000\n30000\n50000',
          is_visible: true,
          message:
            '여러분의 후원은 다음 세대가 음악 안에서 지성과 인성, 신앙의 태도를 함께 배우는 시간을 지켜 줍니다. 합창단의 정기연습, 공연, 초청연주, 봉사연주가 지속될 수 있도록 후원에 동참해 주세요.',
          organization_name: '서울모테트청소년합창단',
          print_note:
            '작성 후 인쇄하거나 PDF로 저장할 수 있습니다. 온라인 제출 시 동일한 내용이 관리자 CMS에 저장되며, 실제 자동이체는 별도 안내 후 처리됩니다.',
          privacy_notice:
            '작성하신 개인정보는 후원 안내 및 약정 확인 목적으로만 사용되며, 관리자만 조회할 수 있습니다.',
          print_button_label: '약정서 인쇄하기',
          submit_button_label: '후원약정 제출',
          subtitle: '서울모테트청소년합창단을 후원하겠습니다.',
          success_message: '후원약정이 접수되었습니다. 확인 후 연락드리겠습니다.',
          title: '후원약정',
        }}
        description="방문자 화면의 /contact?section=support에 표시되는 공개 설정입니다. 신청자 개인정보는 별도 후원 신청 관리 화면에서 관리자만 조회합니다."
        fields={supportFields}
        preparePayload={prepareSupportPayload}
        table="support_settings"
        title="후원약정서 공개 설정"
      />
    </div>
  )
}
