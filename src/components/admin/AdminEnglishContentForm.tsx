import { useEffect, useMemo, useRef, useState } from 'react'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { ENGLISH_CONTENT_FIELDS, validateEnglishContent, type EnglishContentFields, type EnglishContentRecord, type SampleContentResource } from '../../features/sample-language/sampleContentModel'
import { loadEnglishContent, publishEnglishContent, saveEnglishContentDraft } from '../../features/sample-language/sampleContentApi'
import type { CmsMutationPayload, CmsRecord } from '../../types/cms'
import { Button } from '../common/Button'
import { AdminModal } from './AdminModal'
import { AdminRecordForm, type AdminFieldConfig } from './AdminRecordForm'
import { OptimizedImage } from '../common/OptimizedImage'
import { getEnglishChanges, getEnglishInputProgress, getEnglishTextStats, recommendedEnglishCharacters } from '../../features/sample-language/sampleContentGuidance'

type Props = { resource: SampleContentResource; row: CmsRecord; onClose: () => void; onEditBase?: () => void }
function asFields(payload: CmsMutationPayload): EnglishContentFields {
  return Object.fromEntries(Object.entries(payload).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1].trim())).map(([key, value]) => [key, value.trim()]))
}

export function AdminEnglishContentForm({ resource, row, onClose, onEditBase }: Props) {
  const [record, setRecord] = useState<EnglishContentRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const lock = useRef(false)
  useUnsavedChangesGuard({ enabled: dirty || busy })
  const fields = useMemo<AdminFieldConfig<CmsRecord>[]>(() => ENGLISH_CONTENT_FIELDS[resource].map(field => {
    const recommendation = recommendedEnglishCharacters(resource, field.name)
    return { ...field,
      label: `${field.label} · English`, folder: `${resource}/english`, rows: field.type === 'textarea' ? 6 : undefined,
      uploadCommitHint: '업로드 → 영문 임시저장 → 영어 버전 게시 순서로 반영됩니다.',
      description: field.type === 'image' ? '영문 이미지가 없으면 한국어 원본 이미지를 사용합니다. 업로드 후 임시저장하세요.' : '비워 두면 현재 원본을 사용합니다.',
      getTextFeedback: field.type === 'text' || field.type === 'textarea' ? (value: string) => {
        const stats = getEnglishTextStats(value, recommendation)
        return { count: `${stats.characters}자 · ${stats.words}단어`, warning: stats.aboveRecommendation ? `이 위치는 약 ${recommendation}자 이내가 읽기 쉽습니다. 게시 전 미리보기에서 줄바꿈을 확인하세요.` : undefined }
      } : undefined,
    }
  }), [resource])

  useEffect(() => {
    let disposed = false
    void loadEnglishContent(resource, row.id).then(result => {
      if (disposed) return
      setLoading(false)
      setError(result.error)
      if (result.data) setRecord(result.data)
    })
    return () => { disposed = true }
  }, [resource, row.id, reload])

  const close = () => {
    if (lock.current) return
    if (dirty && !window.confirm('저장하지 않은 영문 입력이 있습니다. 편집을 종료할까요?')) return
    onClose()
  }
  const editBase = () => {
    if (lock.current) return
    if (dirty && !window.confirm('저장하지 않은 영문 입력이 있습니다. 단원 기본정보로 이동할까요?')) return
    onEditBase?.()
  }
  const save = async (payload: CmsMutationPayload) => {
    if (!record || lock.current) return false
    const draft = asFields(payload)
    const validation = validateEnglishContent(resource, draft)
    if (validation) { setError(validation); return false }
    lock.current = true
    setBusy(true); setError(null); setFeedback(null)
    try {
      const result = await saveEnglishContentDraft(resource, row.id, draft, record.version)
      if (!result.data) { setError(result.error); return false }
      setRecord(result.data); setDirty(false)
      setFeedback('영문 초안을 임시저장했습니다. 영어 화면에 표시하려면 게시하세요.')
      return true
    } finally { lock.current = false; setBusy(false) }
  }
  const publish = async () => {
    if (!record || dirty || lock.current || record.version === 0) return
    lock.current = true; setBusy(true); setError(null); setFeedback(null)
    try {
      const result = await publishEnglishContent(resource, row.id, record.version)
      if (!result.data) { setError(result.error); return }
      setRecord(result.data)
      setFeedback(row.is_visible === false ? '영어 버전을 게시했습니다. 한국어 원본을 공개하면 영어 화면에도 표시됩니다.' : '영어 버전을 게시했습니다. 공개 홈페이지의 English 화면과 /sample/에 반영됩니다.')
    } finally { lock.current = false; setBusy(false) }
  }
  const initialData = useMemo(() => record ? { id: row.id, ...record.draft } : null, [record, row.id])
  const progress = record ? getEnglishInputProgress(resource, row, record.draft) : null
  const changes = record ? getEnglishChanges(resource, record.draft, record.published) : []
  const changed = changes.length > 0
  return (
    <AdminModal isOpen onClose={close} title="English 버전 작성·수정" footer={record ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted" role="status">{dirty ? '수정 중 · 먼저 임시저장하세요.' : record.version === 0 ? '아직 저장한 영문 버전이 없습니다.' : changed || !record.published ? '저장된 초안 · 게시 전' : '저장된 초안과 게시본이 같습니다.'}</p>
        <Button disabled={busy || dirty || record.version === 0 || (Boolean(record.published) && !changed)} onClick={() => void publish()} variant="gold">{busy ? '처리 중…' : '영어 버전 게시'}</Button>
      </div>
    ) : null}>
      <p className="mb-5 text-sm leading-6 text-text-muted">한국어와 English를 각각 작성할 수 있습니다. 날짜·분류·연결된 공연·공개 여부는 한국어 항목에서 함께 관리합니다. 게시한 영어 버전은 공개 홈페이지와 /sample/의 English 화면에 표시됩니다.</p>
      {resource === 'members' && onEditBase ? <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-button border border-line-default bg-bg-ivory p-4">
        <p className="max-w-xl text-sm leading-6 text-text-muted">영문 이름은 공개 설명과 별개로 단원 기본정보에서 입력합니다. 기존 이름 공개 방식이 영문 이름에도 적용됩니다.</p>
        <Button onClick={editBase} variant="secondary">영문 이름 입력하기</Button>
      </div> : null}
      {error ? <div className="mb-4 rounded-button bg-state-error/10 p-4 text-sm text-state-error" role="alert"><p>{error}</p>{!record ? <Button onClick={() => { setLoading(true); setError(null); setReload(value => value + 1) }} variant="secondary">다시 불러오기</Button> : null}</div> : null}
      {feedback ? <p className="mb-4 rounded-button bg-state-success/10 p-4 text-sm text-state-success" role="status">{feedback}</p> : null}
      {progress ? <p className="mb-5 rounded-button border border-line-default bg-bg-ivory px-4 py-3 text-sm text-navy-deep" role="status">저장된 영어 문구 {progress.completed}/{progress.total}{progress.missingLabels.length ? ` · 원본 사용: ${progress.missingLabels.join(', ')}` : ''}</p> : null}
      {record && record.version > 0 && changed ? <section aria-label="게시 전 변경사항" className="mb-5 rounded-button border border-line-default bg-bg-ivory p-4">
        <h3 className="font-semibold text-navy-deep">게시 전 변경사항 · {changes.length}개</h3>
        <p className="mt-1 text-xs leading-5 text-text-muted">아래 저장된 초안이 게시됩니다. 비운 항목은 한국어 원본으로 돌아갑니다.</p>
        <ul className="mt-3 space-y-3">{changes.map(change => <li className="rounded-button border border-line-default bg-bg-warm-white p-3 text-sm" key={change.name}>
          <p className="font-semibold text-navy-deep">{change.label} · {change.kind === 'added' ? '새 영문' : change.kind === 'removed' ? '원본으로 복귀' : '변경'}</p>
          {change.before ? <p className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all text-text-muted">기존 게시: {change.before}</p> : null}
          {change.after ? <p className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all">새 게시: {change.after}</p> : null}
        </li>)}</ul>
      </section> : null}
      <details className="mb-5 rounded-button border border-line-default p-4" open>
        <summary className="cursor-pointer font-semibold">한국어 원본 확인</summary>
        <dl className="mt-3 grid gap-3 text-sm">
          {ENGLISH_CONTENT_FIELDS[resource].filter(field => field.type !== 'image').map(field => <div key={field.name}><dt className="font-semibold">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-text-muted">{typeof row[field.name] === 'string' && row[field.name] ? String(row[field.name]) : '원본 없음'}</dd></div>)}
        </dl>
      </details>
      {loading ? <p role="status">영문 초안을 불러오는 중입니다.</p> : record ? (
        <AdminRecordForm key={record.version} initialData={initialData} fields={fields} disabled={busy} onCancel={close} onDirtyChange={setDirty} onSubmit={save} submitLabel="영문 임시저장" stickyActions />
      ) : null}
      {record && record.version > 0 ? <details className="mt-5 rounded-button border border-line-default p-4">
        <summary className="cursor-pointer font-semibold">저장된 영문 콘텐츠 미리보기</summary>
        <div className="mt-4 grid gap-4">
          {ENGLISH_CONTENT_FIELDS[resource].map(field => {
            const value = record.draft[field.name]?.trim() || (typeof row[field.name] === 'string' ? String(row[field.name]) : '')
            if (!value) return null
            return <div key={field.name}><p className="mb-2 text-xs font-semibold text-text-muted">{field.label}{record.draft[field.name]?.trim() ? ' · English' : ' · 원본 사용'}</p>{field.type === 'image'
              ? <OptimizedImage alt={record.draft.title || String(row.title ?? field.label)} className="aspect-[4/3] w-full rounded-button" src={value} objectFit="contain" fallbackVariant="gallery" sizes="640px" />
              : <p className="whitespace-pre-wrap break-words text-navy-deep" lang={/[가-힣]/.test(value) ? 'ko' : 'en'}>{value}</p>}</div>
          })}
        </div>
      </details> : null}
    </AdminModal>
  )
}
