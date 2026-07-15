import { useEffect, useState } from 'react'

import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { Button } from '../../components/common/Button'
import { getSignedStorageUrl } from '../../lib/storage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, JoinApplicationRow } from '../../types/cms'

const JOIN_APPLICATION_FILES_BUCKET = 'join-application-files'

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '검토 중', value: 'in_review' },
  { label: '합격', value: 'accepted' },
  { label: '불합격', value: 'rejected' },
  { label: '보관', value: 'archived' },
]

const statusLabels: Record<string, string> = Object.fromEntries(
  statusOptions.map((option) => [option.value, option.label]),
)

const fields = [
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
  { name: 'admin_notes', label: '관리자 메모', type: 'textarea', rows: 4 },
  { name: 'is_archived', label: '보관 처리', type: 'switch' },
] satisfies Array<AdminFieldConfig<JoinApplicationRow>>

const columns = [
  { header: '이름', value: 'applicant_name' },
  { header: '학교', render: (row) => displayText(row.school) },
  { header: '학년', render: (row) => displayText(row.grade) },
  { header: '성별', render: (row) => getGenderLabel(row.gender) },
  { header: '보호자 연락처', render: (row) => displayText(row.guardian_phone) },
  { header: '지원 파트', render: (row) => displayText(row.desired_part) },
  { header: '사진 여부', render: (row) => (row.photo_file_path ? '있음' : '없음') },
  {
    header: '추천서 여부',
    render: (row) => (row.recommendation_file_path ? '있음' : '없음'),
  },
  { header: '접수일', render: (row) => formatDate(row.created_at) },
  {
    header: '상태',
    render: (row) => statusLabels[row.status] ?? '상태 확인 필요',
  },
] satisfies Array<AdminTableColumn<JoinApplicationRow>>

function displayText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized || '미입력'
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '미입력'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
  }).format(date)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return '미입력'
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

function getGenderLabel(value: string | null | undefined) {
  if (value === 'female') {
    return '여'
  }

  if (value === 'male') {
    return '남'
  }

  if (value === 'none') {
    return '응답 안 함'
  }

  return displayText(value)
}

function getBooleanChoiceLabel(value: string | null | undefined) {
  if (value === 'yes') {
    return '있음'
  }

  if (value === 'no') {
    return '없음'
  }

  return displayText(value)
}

function getFirstTextValue(row: JoinApplicationRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function isExternalUrl(value: string) {
  return value.startsWith('https://') || value.startsWith('http://')
}

function JoinAttachmentAction({
  emptyText,
  label,
  path,
}: {
  emptyText: string
  label: string
  path: string | null
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadSignedUrl() {
      if (!path) {
        setSignedUrl(null)
        setError(null)
        setIsLoading(false)
        return
      }

      if (isExternalUrl(path)) {
        setSignedUrl(path)
        setError(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      const result = await getSignedStorageUrl(
        path,
        JOIN_APPLICATION_FILES_BUCKET,
      )

      if (!isMounted) {
        return
      }

      setIsLoading(false)

      if (!result.data) {
        setSignedUrl(null)
        setError(result.error)
        return
      }

      setSignedUrl(result.data)
    }

    void loadSignedUrl()

    return () => {
      isMounted = false
    }
  }, [path])

  if (!path) {
    return (
      <p className="rounded-button border border-line-default bg-bg-ivory px-4 py-3 text-sm text-text-muted">
        {emptyText}
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
        {error}
      </p>
    )
  }

  if (!signedUrl || isLoading) {
    return (
      <p className="rounded-button border border-line-default bg-bg-ivory px-4 py-3 text-sm text-text-muted" role="status">
        첨부파일 링크를 준비하는 중입니다.
      </p>
    )
  }

  return (
    <Button
      href={signedUrl}
      rel="noreferrer"
      showArrow={false}
      target="_blank"
      variant="secondary"
    >
      {label}
    </Button>
  )
}

function JoinApplicationAttachments({ row }: { row: JoinApplicationRow }) {
  const photoPath = getFirstTextValue(row, [
    'photo_file_path',
    'photo_path',
    'photo_url',
  ])
  const recommendationPath = getFirstTextValue(row, [
    'recommendation_file_path',
    'recommendation_path',
    'recommendation_file_url',
  ])

  return (
    <section className="rounded-formal border border-line-default bg-bg-warm-white p-5">
      <h3 className="text-sm font-semibold text-navy-deep">첨부파일 확인</h3>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        첨부파일 링크는 관리자 권한으로만 짧은 시간 동안 열립니다. public 화면에는 표시되지 않습니다.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">사진 파일</p>
          <JoinAttachmentAction
            emptyText="사진 파일 없음"
            label="사진 보기"
            path={photoPath}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">추천서 파일</p>
          <JoinAttachmentAction
            emptyText="추천서 없음"
            label="추천서 확인"
            path={recommendationPath}
          />
        </div>
      </div>
    </section>
  )
}

type DetailItem = {
  label: string
  value: string
  multiline?: boolean
}

function DetailSection({
  items,
  title,
}: {
  items: DetailItem[]
  title: string
}) {
  return (
    <section className="rounded-formal border border-line-default bg-bg-warm-white p-5">
      <h3 className="text-sm font-semibold text-navy-deep">{title}</h3>
      <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
        {items.map((item) => (
          <div
            className={item.multiline ? 'md:col-span-2' : undefined}
            key={item.label}
          >
            <dt className="text-xs font-semibold text-text-muted">
              {item.label}
            </dt>
            <dd
              className={
                item.multiline
                  ? 'mt-1 whitespace-pre-line break-keep leading-6 text-navy-deep'
                  : 'mt-1 break-keep text-navy-deep'
              }
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function preparePayload(payload: CmsMutationPayload) {
  const isArchived = payload.status === 'archived' || payload.is_archived === true

  return {
    admin_notes: payload.admin_notes,
    is_archived: isArchived,
    status: isArchived ? 'archived' : payload.status,
  } satisfies CmsMutationPayload
}

function JoinApplicationDetails({ row }: { row: JoinApplicationRow }) {
  return (
    <div className="space-y-5">
      <DetailSection
        items={[
          { label: '지원자 이름', value: displayText(row.applicant_name) },
          { label: '성별', value: getGenderLabel(row.gender) },
          { label: '생년월일', value: formatDate(row.birth_date) },
          { label: '지역/주소', value: displayText(row.region) },
          {
            label: '개인정보 동의',
            value: row.privacy_agreed ? '동의' : '미동의',
          },
          { label: '접수일', value: formatDateTime(row.created_at) },
        ]}
        title="지원자 기본 정보"
      />
      <DetailSection
        items={[
          { label: '학교', value: displayText(row.school) },
          { label: '학년', value: displayText(row.grade) },
        ]}
        title="학교 및 학력 정보"
      />
      <DetailSection
        items={[
          { label: '지원자 연락처', value: displayText(row.applicant_phone) },
          { label: '이메일', value: displayText(row.email) },
          { label: '연락 가능 시간', value: displayText(row.contact_time) },
          { label: '보호자 이름', value: displayText(row.guardian_name) },
          { label: '보호자 연락처', value: displayText(row.guardian_phone) },
        ]}
        title="연락처 및 보호자 정보"
      />
      <DetailSection
        items={[
          { label: '지원 파트', value: displayText(row.desired_part) },
          {
            label: '합창 경험',
            value: getBooleanChoiceLabel(row.choir_experience),
          },
          {
            label: '레슨 경험',
            value: getBooleanChoiceLabel(row.lesson_experience),
          },
          {
            label: '음악 경험',
            multiline: true,
            value: displayText(row.music_experience),
          },
          {
            label: '수상 및 활동',
            multiline: true,
            value: displayText(row.awards),
          },
          { label: '추천인 이름', value: displayText(row.recommender_name) },
          {
            label: '추천인 소속',
            value: displayText(row.recommender_affiliation),
          },
          {
            label: '추천 사유',
            multiline: true,
            value: displayText(row.recommender_reason),
          },
        ]}
        title="지원 파트와 음악 경험"
      />
      <DetailSection
        items={[
          {
            label: '자기소개와 지원 동기',
            multiline: true,
            value: displayText(row.motivation),
          },
          {
            label: '비전',
            multiline: true,
            value: displayText(row.vision),
          },
        ]}
        title="자기소개와 지원 동기"
      />
      <JoinApplicationAttachments row={row} />
      <DetailSection
        items={[
          {
            label: '현재 상태',
            value: statusLabels[row.status] ?? '상태 확인 필요',
          },
          { label: '보관 여부', value: row.is_archived ? '보관' : '보관 안 함' },
          {
            label: '관리자 메모',
            multiline: true,
            value: displayText(row.admin_notes),
          },
        ]}
        title="관리자 메모/상태"
      />
    </div>
  )
}

export function AdminJoinApplicationsPage() {
  return (
    <AdminCrudListPage
      canCreate={false}
      columns={columns}
      description="입단지원서 제출 내용을 확인하고 처리 상태를 관리합니다."
      emptyMessage="접수된 입단지원서가 없습니다."
      fields={fields}
      filters={[
        {
          allLabel: '전체 상태',
          column: 'status',
          label: '처리 상태',
          options: statusOptions,
        },
        {
          allLabel: '전체 보관 상태',
          column: 'is_archived',
          label: '보관 여부',
          options: [
            { label: '보관', value: 'true' },
            { label: '보관 안 함', value: 'false' },
          ],
        },
      ]}
      info="지원서 원문은 관리자 화면에서만 확인합니다. public 화면에는 노출하지 않습니다."
      order={{ column: 'created_at', ascending: false }}
      preparePayload={preparePayload}
      renderBeforeForm={(row) => <JoinApplicationDetails row={row} />}
      searchColumn="applicant_name"
      searchPlaceholder="지원자 이름 검색"
      showVisibility={false}
      table="join_applications"
      title="입단지원서 관리"
    />
  )
}
