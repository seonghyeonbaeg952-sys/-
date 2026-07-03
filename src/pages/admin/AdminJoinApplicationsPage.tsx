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
  { name: 'applicant_name', label: '지원자 이름', type: 'text', readOnly: true },
  { name: 'applicant_phone', label: '지원자 연락처', type: 'text', readOnly: true },
  { name: 'guardian_name', label: '보호자 이름', type: 'text', readOnly: true },
  { name: 'guardian_phone', label: '보호자 연락처', type: 'text', readOnly: true },
  { name: 'email', label: '이메일', type: 'email', readOnly: true },
  { name: 'school', label: '학교', type: 'text', readOnly: true },
  { name: 'grade', label: '학년', type: 'text', readOnly: true },
  { name: 'desired_part', label: '희망 파트', type: 'text', readOnly: true },
  { name: 'music_experience', label: '음악 경험', type: 'textarea', rows: 5, readOnly: true },
  { name: 'motivation', label: '지원 동기', type: 'textarea', rows: 5, readOnly: true },
  { name: 'vision', label: '비전', type: 'textarea', rows: 5, readOnly: true },
  { name: 'status', label: '처리 상태', type: 'select', options: statusOptions },
  { name: 'admin_notes', label: '관리자 메모', type: 'textarea', rows: 4 },
  { name: 'is_archived', label: '보관 처리', type: 'switch' },
] satisfies Array<AdminFieldConfig<JoinApplicationRow>>

const columns = [
  { header: '지원자', value: 'applicant_name' },
  { header: '학교', value: 'school' },
  { header: '학년', value: 'grade' },
  { header: '보호자', value: 'guardian_name' },
  {
    header: '상태',
    render: (row) => statusLabels[row.status] ?? '상태 확인 필요',
  },
  { header: '접수일', value: 'created_at' },
] satisfies Array<AdminTableColumn<JoinApplicationRow>>

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

function preparePayload(payload: CmsMutationPayload) {
  return {
    admin_notes: payload.admin_notes,
    is_archived: payload.is_archived,
    status: payload.status,
  }
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
      renderBeforeForm={(row) => <JoinApplicationAttachments row={row} />}
      searchColumn="applicant_name"
      searchPlaceholder="지원자 이름 검색"
      showVisibility={false}
      table="join_applications"
      title="입단지원서 관리"
    />
  )
}
