import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { AdminCrudListPage } from '../../components/admin/AdminCrudListPage'
import { Button } from '../../components/common/Button'
import { getJoinApplicationAttachment, joinApplicationAttachmentMarkers } from '../../lib/joinApplications'
import { getSignedStorageUrl } from '../../lib/storage'
import type { AdminFieldConfig } from '../../components/admin/AdminRecordForm'
import type { AdminTableColumn } from '../../components/admin/AdminTable'
import type { CmsMutationPayload, JoinApplicationRow } from '../../types/cms'
import '../../components/admin/join/join-application-print.css'

const JOIN_APPLICATION_FILES_BUCKET = 'join-application-files'
const photoPathKeys = ['photo_file_path', 'photo_path', 'photo_url']
const recommendationPathKeys = ['recommendation_file_path', 'recommendation_path', 'recommendation_file_url']

const statusOptions = [
  { label: '신규', value: 'new' },
  { label: '연락 완료', value: 'contacted' },
  { label: '오디션 안내', value: 'audition_guided' },
  { label: '보류', value: 'on_hold' },
  { label: '처리 완료', value: 'done' },
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
  {
    header: '학교',
    render: (row) => {
      const department = getUniversityDepartment(row)
      if (!department) return displayText(row.school)

      return <span className="block wrap-anywhere">
        {displayText(row.school)}
        <span className="mt-1 block text-xs text-text-muted">학과 {department}</span>
      </span>
    },
  },
  { header: '학년', render: (row) => row.form_version === 2 ? '—' : displayText(row.grade) },
  { header: '성별', render: (row) => row.form_version === 2 ? '—' : getGenderLabel(row.gender) },
  { header: '보호자 연락처', render: (row) => displayText(row.guardian_phone) },
  { header: '지원 파트', render: (row) => getDesiredPartsLabel(row) },
  { header: '사진 여부', render: (row) => getFirstTextValue(row, photoPathKeys) ? '있음' : row.form_version === 2 ? '—' : '없음' },
  {
    header: '추천서 여부',
    render: (row) => getFirstTextValue(row, recommendationPathKeys) ? '있음' : row.form_version === 2 ? '—' : '없음',
  },
  { header: '접수일', render: (row) => formatDate(row.created_at) },
  {
    header: '상태',
    render: (row) => statusLabels[row.status] ?? '상태 확인 필요',
  },
] satisfies Array<AdminTableColumn<JoinApplicationRow>>

function displayText(value: string | null | undefined) {
  return value?.trim() ? value : '미입력'
}

const schoolLevelLabels: Record<string, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학교',
  other: '기타',
}

function getSchoolLevelLabel(value: string | null | undefined) {
  return value && Object.hasOwn(schoolLevelLabels, value) ? schoolLevelLabels[value] : displayText(value)
}

function getUniversityDepartment(row: JoinApplicationRow) {
  return row.form_version === 3 && row.school_level === 'university' ? row.department?.trim() : undefined
}

const partLabels: Record<string, string> = {
  soprano: '소프라노', alto: '알토', tenor: '테너', bass: '베이스', other: '기타',
}

function getDesiredPartsLabel(row: JoinApplicationRow) {
  const parts = row.desired_parts?.filter(part => typeof part === 'string' && part.trim()) ?? []
  const values = parts.length ? parts : row.desired_part ? [row.desired_part] : []
  return [...new Set(values.map(part => part.trim()))]
    .map(part => Object.hasOwn(partLabels, part) ? partLabels[part] : part)
    .join(', ') || '미입력'
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
    timeZone: 'Asia/Seoul',
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
    timeZone: 'Asia/Seoul',
  }).format(date)
}

function getGenderLabel(value: string | null | undefined) {
  if (value === 'female') {
    return '여'
  }

  if (value === 'male') {
    return '남'
  }

  if (value === 'none' || value === 'not_specified') {
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
      rel="noopener noreferrer"
      showArrow={false}
      target="_blank"
      variant="secondary"
    >
      {label}
    </Button>
  )
}

function attachmentFileName(path: string | null) {
  if (!path) return '없음'
  const fileName = path.split(/[?#]/, 1)[0].split(/[\\/]/).pop() || '첨부파일 있음'
  try {
    return decodeURIComponent(fileName)
  } catch {
    return fileName
  }
}

type AttachmentKind = keyof typeof joinApplicationAttachmentMarkers

function IntakeAttachmentAction({ applicationId, kind, label }: {
  applicationId: string
  kind: AttachmentKind
  label: string
}) {
  const previewId = useId()
  const [preview, setPreview] = useState<{ url: string; filename: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const mounted = useRef(false)
  const pending = useRef(false)
  const isPhoto = kind === 'photo'

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url) }
  }, [preview])

  async function openAttachment() {
    if (pending.current) return
    if (preview) {
      setPreview(null)
      return
    }

    pending.current = true
    setLoading(true)
    setError(null)
    try {
      const result = await getJoinApplicationAttachment(applicationId, kind)
      if (!mounted.current) return
      if (!result.data) {
        setError(result.error ?? '첨부파일을 불러오지 못했습니다. 다시 시도해 주세요.')
        return
      }
      const { blob, filename } = result.data
      const url = URL.createObjectURL(blob)
      if (isPhoto) {
        setPreview({ url, filename })
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.append(link)
        try {
          link.click()
        } finally {
          link.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
      }
    } catch {
      if (mounted.current) setError('첨부파일을 불러오지 못했습니다. 다시 시도해 주세요.')
    } finally {
      pending.current = false
      if (mounted.current) setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        aria-controls={isPhoto ? previewId : undefined}
        aria-disabled={loading}
        aria-expanded={isPhoto ? Boolean(preview) : undefined}
        onClick={() => { void openAttachment() }}
        showArrow={false}
        type="button"
        variant="secondary"
      >
        {loading ? '첨부파일 불러오는 중…' : preview ? '사진 닫기' : label}
      </Button>
      {error ? <p className="text-sm leading-6 text-state-error" role="alert">{error}</p> : null}
      {isPhoto ? (
        <div hidden={!preview} id={previewId}>
          {preview ? (
            <>
              <img
                alt="지원자가 제출한 반명함판 사진"
                className="aspect-[3/4] w-32 rounded-button border border-line-default object-contain"
                src={preview.url}
              />
              <a className="mt-2 inline-flex min-h-11 items-center text-sm underline" download={preview.filename} href={preview.url}>사진 다운로드</a>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function attachmentReference(path: string | null, kind: AttachmentKind) {
  return path === joinApplicationAttachmentMarkers[kind] ? '첨부됨' : attachmentFileName(path)
}

function JoinApplicationAttachments({ row, forPrint = false }: { row: JoinApplicationRow; forPrint?: boolean }) {
  const photoPath = getFirstTextValue(row, photoPathKeys)
  const recommendationPath = getFirstTextValue(row, recommendationPathKeys)
  const photoLabel = row.form_version === 3 ? '반명함판 사진' : '사진 파일'

  if (forPrint) {
    return (
      <DetailSection
        title="첨부파일 참조"
        items={[
          { label: photoLabel, value: attachmentReference(photoPath, 'photo') },
          { label: '추천서 파일', value: attachmentReference(recommendationPath, 'recommendation') },
          { label: '원본 확인', value: '첨부파일 원본은 CMS 상세 화면에서 별도로 확인합니다.', multiline: true },
        ]}
      />
    )
  }

  return (
    <section className="rounded-formal border border-line-default bg-bg-warm-white p-5">
      <h3 className="text-sm font-semibold text-navy-deep">첨부파일 확인</h3>
      <p className="mt-1 text-xs leading-5 text-text-muted">
        {row.form_version === 3
          ? '관리자 권한으로 지원자가 첨부한 파일을 열 수 있습니다.'
          : '첨부파일 링크는 관리자 권한으로만 짧은 시간 동안 열립니다.'}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">{photoLabel}</p>
          {photoPath === joinApplicationAttachmentMarkers.photo
            ? <IntakeAttachmentAction applicationId={row.id} kind="photo" label="반명함판 사진 보기" />
            : <JoinAttachmentAction emptyText="사진 파일 없음" key={photoPath} label="사진 보기" path={photoPath} />}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-text-muted">추천서 파일</p>
          {recommendationPath === joinApplicationAttachmentMarkers.recommendation
            ? <IntakeAttachmentAction applicationId={row.id} kind="recommendation" label="추천서 다운로드" />
            : <JoinAttachmentAction emptyText="추천서 없음" key={recommendationPath} label="추천서 확인" path={recommendationPath} />}
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
            className={item.multiline ? 'join-application-detail-long md:col-span-2' : undefined}
            key={item.label}
          >
            <dt className="text-xs font-semibold text-text-muted">
              {item.label}
            </dt>
            <dd
              className={
                item.multiline
                  ? 'mt-1 whitespace-pre-wrap wrap-anywhere leading-6 text-navy-deep'
                  : 'mt-1 whitespace-pre-wrap wrap-anywhere text-navy-deep'
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
  return {
    admin_notes: payload.admin_notes,
    is_archived: payload.is_archived === true,
    status: payload.status,
  } satisfies CmsMutationPayload
}

function validatePayload(payload: CmsMutationPayload) {
  return statusOptions.some(option => option.value === payload.status)
    ? null
    : '처리 상태를 다시 선택해 주세요.'
}

function LegacyJoinApplicationDetails({ row, forPrint = false }: { row: JoinApplicationRow; forPrint?: boolean }) {
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
          { label: '지원 파트', value: getDesiredPartsLabel(row) },
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
      <JoinApplicationAttachments row={row} forPrint={forPrint} />
      <JoinApplicationReceiptMetadata row={row} />
      {!forPrint ? <JoinApplicationReview row={row} /> : null}
    </div>
  )
}

function JoinApplicationReview({ row }: { row: JoinApplicationRow }) {
  return (
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
  )
}

function JoinApplicationReceiptMetadata({ row }: { row: JoinApplicationRow }) {
  const versionLabel = row.form_version === 2 || row.form_version === 3
    ? `온라인 입단지원서 (v${row.form_version})`
    : '기존 입단지원서 (v1)'

  return (
    <DetailSection
      title="접수 식별 정보"
      items={[
        { label: '접수 번호', value: row.id },
        { label: '지원서 양식', value: versionLabel },
        ...(row.submission_id ? [{ label: '제출 식별자', value: row.submission_id }] : []),
        ...(row.join_info_id ? [{ label: '모집 안내 식별자', value: row.join_info_id }] : []),
      ]}
    />
  )
}

function JoinApplicationContent({ row, forPrint = false }: { row: JoinApplicationRow; forPrint?: boolean }) {
  const expanded = row.form_version === 3
  if (!expanded && row.form_version !== 2) return <LegacyJoinApplicationDetails row={row} forPrint={forPrint} />

  const education: DetailItem[] = expanded ? [
    { label: '성별', value: getGenderLabel(row.gender) },
    { label: '학교 구분', value: getSchoolLevelLabel(row.school_level) },
    { label: '학교', value: displayText(row.school) },
    { label: '학년', value: displayText(row.grade) },
    ...(row.school_level === 'university' ? [{ label: '학과', value: displayText(getUniversityDepartment(row)) }] : []),
  ] : [{ label: '학교·학년', value: displayText(row.school) }]
  const hasAttachments = getFirstTextValue(row, photoPathKeys) || getFirstTextValue(row, recommendationPathKeys)

  return (
    <div className="space-y-5">
      <DetailSection
        title="입단지원서"
        items={[
          { label: '이름', value: displayText(row.applicant_name) },
          { label: '생년월일', value: formatDate(row.birth_date) },
          ...education,
          { label: '지원자 연락처', value: displayText(row.applicant_phone) },
          { label: '보호자 연락처', value: displayText(row.guardian_phone) },
          { label: '지원 파트', value: getDesiredPartsLabel(row) },
          { label: '지원 동기', value: displayText(row.motivation), multiline: true },
        ]}
      />
      <DetailSection
        title="접수 정보"
        items={[
          { label: '개인정보 동의', value: row.privacy_agreed ? '동의' : '미동의' },
          { label: '접수일', value: formatDateTime(row.created_at) },
        ]}
      />
      {expanded || hasAttachments
        ? <JoinApplicationAttachments row={row} forPrint={forPrint} /> : null}
      <JoinApplicationReceiptMetadata row={row} />
      {!forPrint ? <JoinApplicationReview row={row} /> : null}
    </div>
  )
}

export function JoinApplicationPrintDocument({ row }: { row: JoinApplicationRow }) {
  return (
    <article className="join-application-print-sheet">
      <header>
        <p>서울모테트청소년합창단</p>
        <h1>입단지원서</h1>
        <p>접수 원문 · 관리자 확인용</p>
      </header>
      <JoinApplicationContent row={row} forPrint />
      <footer>개인정보가 포함된 문서입니다. 출력물과 PDF 파일을 안전하게 보관해 주세요.</footer>
    </article>
  )
}

function JoinApplicationDetails({ row }: { row: JoinApplicationRow }) {
  const [printError, setPrintError] = useState<string | null>(null)
  const printButtonRef = useRef<HTMLButtonElement>(null)

  function handlePrint() {
    setPrintError(null)
    try {
      window.print()
    } catch {
      setPrintError('인쇄 창을 열지 못했습니다. 브라우저의 인쇄 기능(Ctrl+P 또는 ⌘P)을 이용해 주세요.')
    } finally {
      printButtonRef.current?.focus({ preventScroll: true })
    }
  }

  return (
    <div className="space-y-5">
      <div className="join-application-print-toolbar">
        <button className="join-application-print-button" onClick={handlePrint} ref={printButtonRef} type="button">입단지원서 인쇄</button>
        <p>저장된 지원서 원문을 인쇄하거나 PDF로 저장합니다. 관리자 메모와 편집 중인 내용은 인쇄하지 않습니다.</p>
        {printError ? <p role="alert">{printError}</p> : null}
      </div>
      <JoinApplicationContent row={row} />
      {typeof document !== 'undefined' ? createPortal(<JoinApplicationPrintDocument row={row} />, document.body) : null}
    </div>
  )
}

export function AdminJoinApplicationsPage() {
  return (
    <AdminCrudListPage
      canCreate={false}
      canDelete={false}
      columns={columns}
      description="입단지원서 제출 내용을 확인하고 처리 상태를 관리합니다."
      editActionLabel="상세·인쇄"
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
      info="지원서 원문은 관리자만 확인합니다. 기록과 첨부파일 보호를 위해 여기서는 영구 삭제하지 않습니다. 상세의 ‘보관 처리’를 켜서 보관하고, 다시 끄면 복원됩니다."
      order={{ column: 'created_at', ascending: false }}
      preparePayload={preparePayload}
      validatePayload={validatePayload}
      renderBeforeForm={(row) => <JoinApplicationDetails key={row.id} row={row} />}
      searchColumn="applicant_name"
      searchPlaceholder="지원자 이름 검색"
      showVisibility={false}
      table="join_applications"
      title="입단지원서 관리"
    />
  )
}
