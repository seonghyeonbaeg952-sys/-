import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { AdminImagePreview } from '../../components/admin/AdminImagePreview'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import {
  getSponsorCategoryLabel,
  getSponsorTierLabel,
  SPONSOR_CATEGORIES,
  SPONSOR_TIERS,
} from '../../constants/sponsors'
import type { SponsorRow } from '../../types/cms'
import { classNames } from '../../utils/classNames'

function StatusBadge({
  tone,
  value,
}: {
  tone: 'muted' | 'success' | 'warning'
  value: string
}) {
  return (
    <span
      className={classNames(
        'inline-flex min-h-7 items-center rounded-pill px-3 text-xs font-semibold',
        tone === 'success' && 'bg-state-success/10 text-state-success',
        tone === 'warning' && 'bg-gold-soft/45 text-gold-warm',
        tone === 'muted' && 'bg-line-default text-text-muted',
      )}
    >
      {value}
    </span>
  )
}

const columns = [
  {
    header: '로고',
    render: (row) => (
      <AdminImagePreview
        alt={`${row.display_name || row.name} 로고`}
        className="bg-bg-warm-white object-contain"
        src={row.logo_url}
      />
    ),
  },
  {
    header: '후원사명',
    render: (row) => row.display_name || row.name,
  },
  {
    header: '등급',
    render: (row) => getSponsorTierLabel(row.tier),
  },
  {
    header: '분류',
    render: (row) => getSponsorCategoryLabel(row.category),
  },
  {
    header: '공개 가능',
    render: (row) =>
      row.is_visible && row.consent_public ? (
        <StatusBadge tone="success" value="표시 가능" />
      ) : row.is_visible ? (
        <StatusBadge tone="warning" value="동의 필요" />
      ) : (
        <StatusBadge tone="muted" value="비공개" />
      ),
  },
  { header: '순서', value: 'display_order' },
] satisfies Array<AdminTableColumn<SponsorRow>>

const fields = [
  { name: 'name', label: '이름', type: 'text', required: true },
  { name: 'display_name', label: '표시 이름', type: 'text' },
  {
    name: 'category',
    label: '분류',
    type: 'select',
    options: SPONSOR_CATEGORIES,
    required: true,
  },
  {
    name: 'tier',
    label: '등급',
    type: 'select',
    options: SPONSOR_TIERS,
    required: true,
  },
  {
    name: 'description',
    label: '설명',
    type: 'textarea',
    rows: 4,
  },
  {
    allowManualUrl: true,
    allowSvg: true,
    folder: 'sponsors',
    label: '로고',
    name: 'logo_url',
    type: 'image',
    description:
      '투명 PNG, SVG, JPG를 사용할 수 있습니다. public 화면에서는 로고가 잘리지 않도록 contain으로 표시합니다.',
  },
  { name: 'website_url', label: '웹사이트 URL', type: 'url' },
  { name: 'start_date', label: '후원 시작일', type: 'date' },
  { name: 'end_date', label: '후원 종료일', type: 'date' },
  {
    name: 'consent_public',
    label: '공개 동의 확인',
    type: 'switch',
    description:
      '후원사명 또는 개인 후원자명 공개 동의가 확인된 경우에만 켭니다.',
  },
  {
    name: 'is_visible',
    label: '공개 여부',
    type: 'switch',
    description:
      '공개 여부가 켜져 있어도 공개 동의가 꺼져 있으면 방문자 화면에는 표시되지 않습니다.',
  },
  { name: 'show_on_home', label: '홈 노출', type: 'switch' },
  { name: 'show_on_support', label: '후원 페이지 노출', type: 'switch' },
  { name: 'show_on_footer', label: '푸터 노출', type: 'switch' },
  { name: 'display_order', label: '정렬 순서', type: 'number' },
  {
    name: 'internal_notes',
    label: '관리자 메모',
    type: 'textarea',
    rows: 4,
    description: '관리자에게만 보이는 내부 메모입니다. public 화면에는 표시되지 않습니다.',
  },
] satisfies Array<AdminFieldConfig<SponsorRow>>

export function AdminSponsorsPage() {
  return (
    <AdminCrudListPage
      columns={columns}
      defaultValues={{
        category: 'other',
        consent_public: false,
        display_order: 0,
        is_visible: false,
        show_on_footer: false,
        show_on_home: false,
        show_on_support: true,
        tier: 'supporter',
      }}
      description="후원사와 협력기관의 공개 여부, 로고, 노출 위치를 관리합니다."
      emptyMessage="등록된 후원사 또는 협력기관이 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 분류',
          column: 'category',
          label: '분류',
          options: SPONSOR_CATEGORIES,
        },
        {
          allLabel: '전체 등급',
          column: 'tier',
          label: '등급',
          options: SPONSOR_TIERS,
        },
        {
          allLabel: '전체 동의 상태',
          column: 'consent_public',
          label: '공개 동의',
          options: [
            { label: '동의 확인', value: 'true' },
            { label: '동의 미확인', value: 'false' },
          ],
        },
      ]}
      info="후원사명 또는 개인 후원자명은 공개 동의가 확인된 경우에만 홈페이지에 표시하세요. 후원약정 제출 정보는 자동으로 후원사 목록에 공개되지 않습니다."
      order={{ column: 'display_order', ascending: true }}
      searchColumn="name"
      searchPlaceholder="후원사명 검색"
      table="sponsors"
      title="후원사 관리"
    />
  )
}
