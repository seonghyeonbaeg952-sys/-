import { useEffect, useState } from 'react'

import { siteTextDefinitions } from '../../constants/siteTextDefaults'
import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { getCurrentUser } from '../../lib/auth'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, SiteTextRow } from '../../types/cms'

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

const fields = [
  {
    description: 'public 컴포넌트가 참조하는 고유 key입니다. 기존 key는 신중하게 변경하세요.',
    label: '문구 키',
    name: 'key',
    required: true,
    type: 'text',
  },
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
    description: '기본 fallback 문구입니다. public 화면이 비어 보이지 않도록 사용됩니다.',
    label: '기본 문구',
    name: 'default_value',
    rows: 4,
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
  { header: '라벨', render: (row) => row.label || row.key },
  { header: '키', value: 'key' },
  { header: '현재 문구', render: (row) => shortText(row.value) },
  { header: '기본 문구', render: (row) => shortText(row.default_value) },
  {
    header: '상태',
    render: (row) => (row.is_active ? '사용' : '미사용'),
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
  currentUserId: string | null,
) {
  const key = typeof payload.key === 'string' ? payload.key.trim() : ''
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
      : definition?.defaultValue ?? ''

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

  return (
    <AdminCrudListPage
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
      emptyMessage="등록된 사이트 문구가 없습니다. 2026_add_site_texts.sql migration을 실행하면 기본 문구가 준비됩니다."
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
      preparePayload={(payload) => prepareSiteTextPayload(payload, currentUserId)}
      renderBeforeForm={(row) => (
        <SiteTextMeta
          currentUserEmail={currentUserEmail}
          currentUserId={currentUserId}
          row={row}
        />
      )}
      searchColumn="key"
      searchPlaceholder="문구 키 검색"
      showVisibility={false}
      table="site_texts"
      title="홈 문구 관리"
      validatePayload={validateSiteTextPayload}
    />
  )
}
