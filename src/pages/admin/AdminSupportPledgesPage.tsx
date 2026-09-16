import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, SupportPledgeRow } from '../../types/cms'
import { isSignaturePng } from '../../lib/intakeModel'
import '../../components/admin/join/join-application-print.css'

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '처리 중', value: 'in_progress' },
  { label: '완료', value: 'done' },
]

const genderOptions = [
  { label: '선택 안 함', value: '' },
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
  { label: '응답하지 않음', value: 'none' },
]

const memberTypeOptions = [
  { label: '개인회원', value: 'individual' },
  { label: '기업회원', value: 'corporate' },
]

function formatAmount(value: number | null | undefined) {
  if (!value) {
    return '-'
  }

  return `${value.toLocaleString('ko-KR')}원`
}

const fields = [
  { name: 'name', label: '이름', type: 'text', readOnly: true },
  { name: 'phone', label: '핸드폰', type: 'text', readOnly: true },
  { name: 'email', label: 'E-mail', type: 'email', readOnly: true },
  {
    name: 'gender',
    label: '성별',
    type: 'select',
    options: genderOptions,
    readOnly: true,
  },
  { name: 'birth_date', label: '생년월일', type: 'date', readOnly: true },
  { name: 'address', label: '주소', type: 'textarea', rows: 3, readOnly: true },
  {
    name: 'member_type',
    label: '회원 유형',
    type: 'select',
    options: memberTypeOptions,
    readOnly: true,
  },
  { name: 'amount', label: '후원금', type: 'number', readOnly: true },
  { name: 'custom_amount', label: '기타 금액', type: 'number', readOnly: true },
  { name: 'depositor', label: '예금주', type: 'text', readOnly: true },
  { name: 'pledge_date', label: '약정 날짜', type: 'date', readOnly: true },
  { name: 'signer_name', label: '서명 이름', type: 'text', readOnly: true },
  {
    name: 'signature_image_url',
    label: '그린 인/서명',
    type: 'signature',
    readOnly: true,
    description: '방문자가 약정서에서 마우스 또는 터치로 작성한 서명입니다.',
  },
  { name: 'privacy_agreed', label: '개인정보 동의', type: 'switch', readOnly: true },
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
] satisfies Array<AdminFieldConfig<SupportPledgeRow>>

const columns = [
  { header: '이름', value: 'name' },
  { header: '핸드폰', value: 'phone' },
  { header: 'E-mail', value: 'email' },
  {
    header: '유형',
    render: (row) =>
      memberTypeOptions.find((option) => option.value === row.member_type)?.label ??
      row.member_type,
  },
  {
    header: '후원금',
    render: (row) => formatAmount(row.amount),
  },
  {
    header: '상태',
    render: (row) =>
      statusOptions.find((option) => option.value === row.status)?.label ?? row.status,
  },
  { header: '접수일', value: 'created_at' },
] satisfies Array<AdminTableColumn<SupportPledgeRow>>

function preparePayload(payload: CmsMutationPayload) {
  return {
    status: payload.status,
  } satisfies CmsMutationPayload
}

const originalTerms = [
  ['title', '약정서 제목'], ['subtitle', '부제'], ['description', '후원 안내'], ['message', '약정 본문'],
  ['form_note', '작성 안내'], ['privacy_notice', '개인정보 수집 및 이용 안내'], ['print_note', '인쇄 안내'],
  ['organization_name', '기관명'], ['footer_note', '추가 안내'], ['contact_phone', '문의 전화'],
  ['contact_email', '문의 이메일'], ['homepage_url', '홈페이지'], ['bank_name', '은행'],
  ['bank_account_number', '계좌번호'], ['bank_account_holder', '예금주'], ['bank_note', '계좌 안내'],
] as const

function PledgeTerms({ row }: { row: SupportPledgeRow }) {
  const snapshot = row.terms_snapshot
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return <p>접수 당시 약정 원문이 별도로 저장되지 않은 이전 접수입니다. 현재 안내문을 과거 약정 원문으로 대신 표시하지 않습니다.</p>
  }
  return <dl className="space-y-4">{originalTerms.map(([key, label]) => {
    const value = snapshot[key]
    return typeof value === 'string' && value.length > 0 ? <div key={key} className="join-application-detail-long"><dt className="text-sm font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div> : null
  })}</dl>
}

export function SupportPledgePrintDocument({ row }: { row: SupportPledgeRow }) {
  const answers = [
    ['이름', row.name], ['핸드폰', row.phone], ['E-mail', row.email],
    ['성별', genderOptions.find(option => option.value === row.gender)?.label ?? '미작성'],
    ['생년월일', row.birth_date], ['주소', row.address],
    ['회원 유형', memberTypeOptions.find(option => option.value === row.member_type)?.label ?? row.member_type],
    ['후원금', formatAmount(row.amount)], ['기타 금액', formatAmount(row.custom_amount)],
    ['예금주', row.depositor], ['약정 날짜', row.pledge_date], ['서명 이름', row.signer_name],
    ['개인정보 동의', row.privacy_agreed ? '동의함' : '미동의'], ['접수일', row.created_at], ['접수번호', row.id],
  ]
  return <article className="join-application-print-sheet">
    <header><p>서울모테트청소년합창단</p><h1>후원약정서</h1><p>접수 원문 · 관리자 확인용</p></header>
    <section><h3>후원자 작성 내용</h3><dl>{answers.map(([label, value]) => <div key={label} className={label === '주소' ? 'join-application-detail-long' : undefined}><dt>{label}</dt><dd>{value || '미작성'}</dd></div>)}</dl>
      {row.signature_image_url && isSignaturePng(row.signature_image_url) ? <div className="admin-receipt-signature"><p>그린 인/서명</p><img src={row.signature_image_url} alt="접수된 인/서명" /></div> : <p>{row.signature_image_url ? '서명 형식을 확인할 수 없습니다. 원본 접수 자료를 확인해 주세요.' : '그린 인/서명 미작성'}</p>}
    </section>
    <section><h3>접수 당시 약정 원문</h3><PledgeTerms row={row} /></section>
    <footer>개인정보가 포함된 문서입니다. 출력물과 PDF 파일을 안전하게 보관해 주세요.</footer>
  </article>
}

function SupportPledgeDetails({ row }: { row: SupportPledgeRow }) {
  const [printError, setPrintError] = useState<string | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const handlePrint = () => {
    setPrintError(null)
    try { window.print() }
    catch { setPrintError('인쇄 창을 열지 못했습니다. 브라우저의 인쇄 기능(Ctrl+P 또는 ⌘P)을 이용해 주세요.') }
    finally { buttonRef.current?.focus({ preventScroll: true }) }
  }
  return <div className="space-y-5">
    <div className="join-application-print-toolbar"><button className="join-application-print-button" type="button" ref={buttonRef} onClick={handlePrint}>후원약정서 인쇄</button><p>저장된 답변·서명과 접수 당시 약정 원문을 인쇄하거나 PDF로 보관합니다. 현재 수정 중인 처리 상태는 인쇄하지 않습니다.</p>{printError ? <p role="alert">{printError}</p> : null}</div>
    <details><summary className="min-h-11 cursor-pointer py-3 font-semibold">접수 당시 약정 원문 보기</summary><PledgeTerms row={row} /></details>
    {typeof document !== 'undefined' ? createPortal(<SupportPledgePrintDocument row={row} />, document.body) : null}
  </div>
}

export function AdminSupportPledgesPage() {
  return (
    <AdminCrudListPage
      canCreate={false}
      columns={columns}
      description="방문자가 제출한 후원약정 정보를 확인하고 처리 상태를 변경합니다."
      emptyMessage="접수된 후원약정이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 회원 유형',
          column: 'member_type',
          label: '회원 유형',
          options: memberTypeOptions,
        },
        {
          allLabel: '전체 처리 상태',
          column: 'status',
          label: '처리 상태',
          options: statusOptions,
        },
      ]}
      info="후원약정에는 개인정보가 포함됩니다. 이 목록은 관리자에게만 표시되며 public 화면에는 노출되지 않습니다."
      order={{ column: 'created_at', ascending: false }}
      preparePayload={preparePayload}
      renderBeforeForm={(row) => <SupportPledgeDetails row={row} />}
      searchColumn="name"
      searchPlaceholder="후원자 이름 검색"
      showVisibility={false}
      table="support_pledges"
      title="후원 신청 관리"
    />
  )
}
