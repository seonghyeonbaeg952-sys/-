import { useCallback, useEffect, useState } from 'react'

import { siteTextDefinitions } from '../../constants/siteTextDefaults'
import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { getCurrentUser } from '../../lib/auth'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, SiteTextRow } from '../../types/cms'

type SiteTextUsage = 'current' | 'legacy' | 'optional' | 'unknown'

const groupLabels: Record<string, string> = {
  'common.button': '공통 버튼',
  'home.about': '홈 소개',
  'home.concert': '공연·공지',
  'home.footer': '푸터',
  'home.gallery': '갤러리',
  'home.hero': '히어로',
  'home.join': '입단 CTA',
  'home.quick': '빠른 진입',
  'home.score': 'Motet Score',
  'home.support': '후원·문의',
}

const groupOptions = Object.entries(groupLabels).map(([value, label]) => ({
  label,
  value,
}))

const inputTypeOptions = [
  { label: '짧은 문구', value: 'text' },
  { label: '긴 문구', value: 'textarea' },
  { label: 'URL', value: 'url' },
  { label: '라벨', value: 'label' },
]

const defaultDefinition = siteTextDefinitions[0]
const legacyKeyPrefixes = [
  'home.quick.1.',
  'home.quick.2.',
  'home.quick.3.',
  'home.scorebook.',
] as const
const legacyKeys = new Set([
  'home.hero.title',
  'home.hero.description',
  'home.concert.concertButton',
  'home.concert.noticeButton',
  'home.concert.sectionTitle',
  'home.gallery.eyebrow',
  'home.gallery.sectionTitle',
  'home.gallery.sectionDescription',
  'home.support.button',
  'home.support.secondaryButton',
  'home.support.cardTitle',
  'home.support.cardDescription',
])
const optionalKeys = new Set([
  'home.quick.gallery.title',
  'home.quick.gallery.description',
])

const usageOptions = [
  { label: '현재 홈 문구', value: 'current' },
  { label: '전체 문구', value: 'all' },
  { label: '선택 사용 문구', value: 'optional' },
  { label: '미사용·호환 문구', value: 'legacy' },
  { label: '정의 없는 문구', value: 'unknown' },
]

function getDefinition(row: SiteTextRow) {
  return siteTextDefinitions.find((item) => item.key === row.key)
}

function getUsage(row: SiteTextRow): SiteTextUsage {
  if (optionalKeys.has(row.key)) {
    return 'optional'
  }

  if (
    legacyKeys.has(row.key) ||
    legacyKeyPrefixes.some((prefix) => row.key.startsWith(prefix))
  ) {
    return 'legacy'
  }

  return getDefinition(row) ? 'current' : 'unknown'
}

function getUsageLabel(row: SiteTextRow) {
  const usage = getUsage(row)

  if (!row.is_active) {
    return '미사용'
  }

  if (usage === 'legacy') {
    return '미사용·호환'
  }

  if (usage === 'optional') {
    return '선택 사용'
  }

  if (usage === 'unknown') {
    return '정의 없음'
  }

  return '현재 사용'
}

const fields = [
  {
    description: '관리자 화면에서 묶어 볼 문구 그룹입니다.',
    label: '그룹',
    name: 'group_name',
    options: groupOptions,
    required: true,
    type: 'select',
  },
  { label: '관리 라벨', name: 'label', type: 'text' },
  {
    description: '빈 값으로 저장하면 public 화면에서는 기본 문구가 표시됩니다.',
    label: '현재 문구',
    name: 'value',
    rows: 5,
    type: 'textarea',
  },
  {
    label: '입력 유형',
    name: 'input_type',
    options: inputTypeOptions,
    required: true,
    type: 'select',
  },
  { label: '관리 설명', name: 'description', rows: 3, type: 'textarea' },
  { label: '정렬 순서', name: 'sort_order', type: 'number' },
  { label: '사용 여부', name: 'is_active', type: 'switch' },
] satisfies Array<AdminFieldConfig<SiteTextRow>>

function getGroupLabel(row: SiteTextRow) {
  const group = row.group_name || row.section || row.page || ''

  return groupLabels[group] ?? group ?? '-'
}

function shortText(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return '기본 문구 사용'
  }

  return normalized.length > 64 ? `${normalized.slice(0, 64)}...` : normalized
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getEditorName(
  editorId: string | null | undefined,
  currentUserId: string | null,
  currentUserEmail: string | null,
) {
  if (!editorId) {
    return '수정자 정보 없음'
  }

  if (editorId === currentUserId && currentUserEmail) {
    return currentUserEmail
  }

  return '관리자'
}

const columns = [
  { header: '그룹', render: getGroupLabel },
  {
    header: '문구',
    render: (row) => (
      <div>
        <p className="font-semibold text-navy-deep">
          {row.label || getDefinition(row)?.label || row.key}
        </p>
        <p className="mt-1 text-xs text-text-muted">{row.key}</p>
      </div>
    ),
  },
  { header: '현재 문구', render: (row) => shortText(row.value) },
  {
    header: '기본 문구',
    render: (row) => shortText(getDefinition(row)?.defaultValue || row.default_value),
  },
  {
    header: '사용 위치',
    render: getUsageLabel,
  },
  { header: '수정일', render: (row) => row.updated_at?.slice(0, 10) ?? '-' },
  {
    header: '수정자',
    render: (row) => (row.updated_by ? '관리자' : '수정자 정보 없음'),
  },
] satisfies Array<AdminTableColumn<SiteTextRow>>

function hasHtmlTag(value: string) {
  return /<\s*\/?\s*[a-z][^>]*>/i.test(value)
}

function hasScriptLikeValue(value: string) {
  return /javascript:|on\w+\s*=|<\s*(script|iframe|style)\b/i.test(value)
}

function hasForbiddenLiteral(value: string) {
  return [
    /href\s*=\s*["']?#["']?/i,
    /\bTODO\b/i,
    /placeholder/i,
    /undefined/i,
    /\bnull\b/i,
    /미정/,
    /준비중/,
    /테스트/,
    /임시/,
    /등록 예정/,
    /관리자 등록 예정/,
  ].some((pattern) => pattern.test(value))
}

function isValidOptionalUrl(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return true
  }

  try {
    const url = new URL(trimmed)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function prepareSiteTextPayload(
  payload: CmsMutationPayload,
  row: SiteTextRow | null,
  currentUserId: string | null,
) {
  const key =
    typeof payload.key === 'string' && payload.key.trim()
      ? payload.key.trim()
      : row?.key ?? ''
  const groupName =
    typeof payload.group_name === 'string' ? payload.group_name.trim() : ''
  const definition = siteTextDefinitions.find((item) => item.key === key)
  const inputType =
    typeof payload.input_type === 'string' && payload.input_type
      ? payload.input_type
      : definition?.inputType ?? 'text'
  const value = typeof payload.value === 'string' ? payload.value.trim() : ''
  const defaultValue =
    typeof payload.default_value === 'string'
      ? payload.default_value.trim()
      : definition?.defaultValue ?? row?.default_value ?? ''

  const nextPayload: CmsMutationPayload = {
    ...payload,
    default_value: defaultValue,
    description:
      typeof payload.description === 'string'
        ? payload.description.trim()
        : definition?.description ?? '',
    group_name: groupName || definition?.groupName || 'home.hero',
    input_type: inputType,
    is_active: payload.is_active ?? true,
    key,
    label:
      typeof payload.label === 'string' && payload.label.trim()
        ? payload.label.trim()
        : definition?.label ?? key,
    page: groupName.split('.')[0] || definition?.groupName.split('.')[0] || 'home',
    section: groupName || definition?.groupName || 'home.hero',
    sort_order:
      typeof payload.sort_order === 'number'
        ? payload.sort_order
        : definition?.sortOrder ?? 0,
    value,
    value_type: inputType === 'textarea' ? 'textarea' : 'text',
  }

  if (currentUserId) {
    nextPayload.updated_by = currentUserId
  }

  return nextPayload
}

function validateSiteTextPayload(payload: CmsMutationPayload) {
  const key = typeof payload.key === 'string' ? payload.key.trim() : ''
  const value = typeof payload.value === 'string' ? payload.value : ''
  const defaultValue =
    typeof payload.default_value === 'string' ? payload.default_value : ''
  const inputType = typeof payload.input_type === 'string' ? payload.input_type : 'text'

  if (!key) {
    return '문구 키를 입력해 주세요.'
  }

  if (hasHtmlTag(value) || hasHtmlTag(defaultValue)) {
    return 'HTML 태그는 저장할 수 없습니다. 줄바꿈이 필요하면 textarea 줄바꿈을 사용해 주세요.'
  }

  if (hasScriptLikeValue(value) || hasScriptLikeValue(defaultValue)) {
    return 'script, iframe, style 또는 javascript: 형식의 문구는 저장할 수 없습니다.'
  }

  if (hasForbiddenLiteral(value) || hasForbiddenLiteral(defaultValue)) {
    return 'TODO, placeholder, undefined, null, 미정, 준비중, 테스트, 임시, 등록 예정, href="#" 같은 임시 문구는 저장할 수 없습니다.'
  }

  if (inputType === 'url' && !isValidOptionalUrl(value)) {
    return 'URL 문구는 http:// 또는 https://로 시작하는 주소만 저장할 수 있습니다.'
  }

  return null
}

function SiteTextMeta({
  currentUserEmail,
  currentUserId,
  row,
}: {
  currentUserEmail: string | null
  currentUserId: string | null
  row: SiteTextRow
}) {
  return (
    <section className="rounded-formal border border-line-default bg-bg-warm-white p-5">
      <h3 className="text-sm font-semibold text-navy-deep">수정 이력</h3>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-text-muted">문구 key</dt>
          <dd className="mt-1 break-all text-navy-deep">{row.key}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-text-muted">사용 위치</dt>
          <dd className="mt-1 text-navy-deep">{getUsageLabel(row)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-text-muted">기본 문구</dt>
          <dd className="mt-1 whitespace-pre-line rounded-button bg-bg-ivory px-3 py-2 text-navy-deep">
            {getDefinition(row)?.defaultValue || row.default_value || '-'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-text-muted">마지막 수정일</dt>
          <dd className="mt-1 text-navy-deep">
            {formatDateTime(row.updated_at) ?? '수정일 정보 없음'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-text-muted">수정자</dt>
          <dd className="mt-1 text-navy-deep">
            {getEditorName(row.updated_by, currentUserId, currentUserEmail)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

export function AdminSiteTextsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [usageFilter, setUsageFilter] = useState('current')

  useEffect(() => {
    let isMounted = true

    async function loadCurrentUser() {
      const result = await getCurrentUser()

      if (isMounted) {
        setCurrentUserId(result.data?.id ?? null)
        setCurrentUserEmail(result.data?.email ?? null)
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  const prepareRows = useCallback(
    (rows: SiteTextRow[]) =>
      rows.filter((row) => {
        if (usageFilter === 'all') {
          return true
        }

        if (!row.is_active) {
          return usageFilter === 'legacy'
        }

        return getUsage(row) === usageFilter
      }),
    [usageFilter],
  )

  return (
    <AdminCrudListPage
      canCreate={false}
      canDelete={false}
      columns={columns}
      defaultValues={{
        default_value: defaultDefinition.defaultValue,
        description: defaultDefinition.description,
        group_name: defaultDefinition.groupName,
        input_type: defaultDefinition.inputType,
        is_active: true,
        key: defaultDefinition.key,
        label: defaultDefinition.label,
        page: 'home',
        section: defaultDefinition.groupName,
        sort_order: defaultDefinition.sortOrder,
        value: '',
        value_type: 'text',
      }}
      description="홈페이지에 표시되는 주요 문구를 수정합니다."
      emptyMessage="조건에 맞는 문구가 없습니다. 전체 문구 또는 미사용·호환 문구 필터를 확인하세요."
      fields={fields}
      filters={[
        {
          allLabel: '전체 그룹',
          column: 'group_name',
          label: '문구 그룹',
          options: groupOptions,
        },
        {
          allLabel: '전체 상태',
          column: 'is_active',
          label: '사용 여부',
          options: [
            { label: '사용', value: 'true' },
            { label: '미사용', value: 'false' },
          ],
        },
      ]}
      info="빈 값으로 저장하면 기본 문구가 사용됩니다. HTML 태그는 사용할 수 없고, public 화면에는 TODO/undefined/null 같은 임시 문구가 노출되지 않습니다. 문구를 숨기려면 삭제 대신 사용 여부를 끄세요."
      order={{ column: 'sort_order', ascending: true }}
      prepareInitialData={(row) => {
        const definition = getDefinition(row)

        return {
          ...row,
          default_value: row.default_value || definition?.defaultValue || '',
          description: row.description || definition?.description || '',
          group_name: row.group_name || definition?.groupName || 'home.hero',
          input_type: row.input_type || definition?.inputType || 'text',
          label: row.label || definition?.label || row.key,
          sort_order: row.sort_order || definition?.sortOrder || 0,
        }
      }}
      preparePayload={(payload, row) =>
        prepareSiteTextPayload(payload, row, currentUserId)
      }
      prepareRows={prepareRows}
      renderBeforeForm={(row) => (
        <SiteTextMeta
          currentUserEmail={currentUserEmail}
          currentUserId={currentUserId}
          row={row}
        />
      )}
      searchColumn="key"
      searchPlaceholder="문구 key 검색"
      showVisibility={false}
      table="site_texts"
      title="홈 문구 관리"
      toolbarFilters={[
        {
          label: '사용 위치',
          onChange: setUsageFilter,
          options: usageOptions,
          value: usageFilter,
        },
      ]}
      validatePayload={validateSiteTextPayload}
    />
  )
}
