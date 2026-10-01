import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AdminModal } from '../../components/admin/AdminModal'
import { ImageUploader, type ImageUploadState } from '../../components/admin/ImageUploader'
import { Button } from '../../components/common/Button'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { invalidatePublicDataCache } from '../../hooks/usePublicData'
import type { EnglishContentRecord } from '../sample-language/sampleContentModel'
import { loadEnglishContent, saveEnglishContentDraft } from '../sample-language/sampleContentApi'
import { publishSitePhoto, saveSitePhotoDraft } from './sitePhotoApi'
import type { SitePhotoAsset } from './sitePhotoCatalog'
import { mergeEnglishPhoto, publishEnglishPhoto, saveContentPhoto, type ContentPhotoItem } from './sitePhotoContent'
import { isSafePhotoUrl, sameSitePhoto, validateSitePhoto, type SitePhotoRecord, type SitePhotoValue } from './sitePhotoModel'

export type PhotoEditTarget = { kind: 'fixed'; asset: SitePhotoAsset; record?: SitePhotoRecord } | { kind: 'content'; item: ContentPhotoItem; language: 'ko' | 'en' }
type Props = { target: PhotoEditTarget; onClose: () => void; onApplied: (record?: SitePhotoRecord) => void }
const valueFor = (src: string, alt = ''): SitePhotoValue => ({ src, altKo: alt, altEn: '', positionX: 50, positionY: 50 })

function PhotoPreview({ src, alt, label, position, onLoaded }: { src: string; alt: string; label: string; position?: string; onLoaded?: (src: string) => void }) {
  const [failedSource, setFailedSource] = useState('')
  const [loadedSource, setLoadedSource] = useState('')
  const safe = isSafePhotoUrl(src)
  return <figure className="site-photo-preview">
    <figcaption>{label}</figcaption>
    <div className="site-photo-preview__image">
      {safe && failedSource !== src ? <img src={src} alt={alt} style={{ objectPosition: position }}
        onLoad={event => { if (event.currentTarget.naturalWidth > 0) { setLoadedSource(src); onLoaded?.(src) } }}
        onError={() => setFailedSource(src)} /> : <p role={src ? 'alert' : undefined}>{src ? '사진을 표시할 수 없습니다. 주소나 파일을 확인해 주세요.' : '연결된 사진이 없습니다.'}</p>}
      {safe && loadedSource !== src && failedSource !== src ? <span role="status">사진을 불러오는 중…</span> : null}
    </div>
  </figure>
}

export function SitePhotoEditor({ target, onClose, onApplied }: Props) {
  const fixed = target.kind === 'fixed'
  const english = !fixed && target.language === 'en'
  const fallbackSrc = fixed ? target.asset.sources[0] : target.item.src
  const originalAlt = fixed ? target.asset.title : target.item.alt
  const title = fixed ? target.asset.title : target.item.title
  const [fixedRecord, setFixedRecord] = useState(fixed ? target.record : undefined)
  const [englishRecord, setEnglishRecord] = useState<EnglishContentRecord | null>(null)
  const [photo, setPhoto] = useState<SitePhotoValue | null>(() => fixed ? target.record?.draft ?? null : target.item.src ? valueFor(target.item.src, target.item.alt) : null)
  const [saved, setSaved] = useState(photo)
  const [uploadState, setUploadState] = useState<ImageUploadState>('idle')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(english)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reload, setReload] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [verifiedSource, setVerifiedSource] = useState('')
  const lock = useRef(false)
  const uploadRef = useRef(uploadState)
  const pending = ['selected', 'uploading', 'error'].includes(uploadState)
  const dirty = pending || !sameSitePhoto(photo, saved)
  useUnsavedChangesGuard({ enabled: dirty || busy })

  useEffect(() => {
    if (target.kind !== 'content' || target.language !== 'en') return
    let active = true
    void loadEnglishContent(target.item.target.table, target.item.target.id).then(result => {
      if (!active) return
      setLoading(false); setLoadError(result.error)
      if (result.data) {
        setEnglishRecord(result.data)
        const src = result.data.draft[target.item.target.field]
        const next = src ? valueFor(src) : null
        setPhoto(next); setSaved(next)
      }
    })
    return () => { active = false }
  }, [target, reload])

  const candidateSrc = photo?.src || (fixed || english ? fallbackSrc : '')
  const publishedSrc = fixed ? fixedRecord?.published?.src || fallbackSrc : english ? englishRecord?.published?.[target.item.target.field] || fallbackSrc : fallbackSrc
  const candidateValid = !photo || !validateSitePhoto(photo)
  const canSave = !busy && !loading && !loadError && !pending && candidateValid && (!photo || verifiedSource === photo.src) && (dirty || fixed && !fixedRecord)
  const publishedDifferent = fixed ? !fixedRecord?.published_at || !sameSitePhoto(fixedRecord.draft, fixedRecord.published) : english ? (englishRecord?.draft[target.item.target.field] || '') !== (englishRecord?.published?.[target.item.target.field] || '') : false
  const canPublish = !busy && !dirty && !pending && !loadError && candidateValid && (!photo || verifiedSource === photo.src) && publishedDifferent && (fixed ? Boolean(fixedRecord) : Boolean(englishRecord?.version))

  const close = () => {
    if (lock.current) return
    if (dirty && !window.confirm('저장하지 않은 사진 변경이 있습니다. 편집을 종료할까요? 업로드한 파일은 삭제하지 않습니다.')) return
    onClose()
  }
  const update = (changes: Partial<SitePhotoValue>) => { setPhoto({ ...(photo ?? valueFor(fallbackSrc, originalAlt)), ...changes }); setFeedback(null) }
  const save = async () => {
    if (!canSave || lock.current || ['selected', 'uploading', 'error'].includes(uploadRef.current)) return
    lock.current = true; setBusy(true); setError(null); setFeedback(null)
    try {
      if (fixed) {
        const result = await saveSitePhotoDraft(target.asset.key, photo, fixedRecord?.version ?? 0)
        if (!result.data) { setError(result.error); return }
        setFixedRecord(result.data); setSaved(result.data.draft); onApplied(result.data)
        setFeedback('사진 초안을 저장했습니다. 공개 홈페이지에는 아직 반영되지 않았습니다. 사진 게시를 눌러 주세요.')
      } else if (english) {
        if (!englishRecord) return
        const draft = mergeEnglishPhoto(englishRecord.draft, target.item.target.field, photo?.src || null)
        const result = await saveEnglishContentDraft(target.item.target.table, target.item.target.id, draft, englishRecord.version)
        if (!result.data) { setError(result.error); return }
        setEnglishRecord(result.data); setSaved(photo)
        setFeedback('영어 사진 초안을 저장했습니다. 기존 번역 문구는 그대로 유지했습니다. 영어 사진 게시를 눌러 주세요.')
      } else {
        const result = await saveContentPhoto(target.item, photo?.src || '', photo?.altKo ?? '')
        if (result.error) { setError(result.error); return }
        invalidatePublicDataCache(); onApplied(); onClose()
      }
    } catch { setError('사진을 저장하지 못했습니다. 현재 입력은 유지됩니다. 다시 시도해 주세요.') }
    finally { lock.current = false; setBusy(false) }
  }
  const publish = async () => {
    if (!canPublish || lock.current) return
    lock.current = true; setBusy(true); setError(null); setFeedback(null)
    try {
      if (fixed && fixedRecord) {
        const result = await publishSitePhoto(target.asset.key, fixedRecord.version)
        if (!result.data) { setError(result.error); return }
        setFixedRecord(result.data); onApplied(result.data)
        setFeedback(result.data.published ? '사진을 게시했습니다. 한국어·영어 홈페이지에 적용됩니다.' : '기본 사진으로 복원했습니다. 이전 업로드 파일은 삭제하지 않았습니다.')
      } else if (english && englishRecord && target.kind === 'content') {
        const result = await publishEnglishPhoto(target.item.target.table, target.item.target.id, target.item.target.field, englishRecord.version)
        if (result.error) { setError(result.error); return }
        onApplied(); onClose()
      }
    } catch { setError('사진을 게시하지 못했습니다. 저장한 초안은 유지됩니다.') }
    finally { lock.current = false; setBusy(false) }
  }

  return <AdminModal isOpen onClose={close} title={`${title} · ${english ? '영어 사진' : '사진 교체'}`} footer={<div className="site-photo-editor__footer">
    <p role="status">{pending ? '업로드를 완료하거나 선택을 취소해 주세요.' : dirty ? '저장하지 않은 변경사항' : fixed || english ? publishedDifferent ? '초안과 게시본이 다릅니다.' : '공개 사진과 같습니다.' : '저장하면 기존 콘텐츠 사진에 바로 반영됩니다.'}</p>
    <div><Button disabled={busy} onClick={close} variant="secondary">닫기</Button>
      <Button disabled={!canSave} onClick={() => void save()} variant="primary">{busy ? '처리 중…' : fixed || english ? '사진 초안 저장' : '사진 저장·적용'}</Button>
      {fixed || english ? <Button disabled={!canPublish} onClick={() => void publish()} variant="gold">{english ? '영어 사진 게시' : '사진 게시'}</Button> : null}
    </div>
  </div>}>
    <p className="site-photo-editor__guide">{fixed ? target.asset.description : `${target.item.sourceTitle} 원본의 사진만 변경합니다. 제목·본문·공개 여부는 변경하지 않습니다.`}</p>
    {english ? <p className="site-photo-editor__guide">영어 사진이 없으면 원본 사진을 사용합니다. 사진 게시 시에는 선택한 사진만 반영하며, 번역 문구 초안을 함께 게시하지 않습니다.</p> : null}
    {loading ? <p role="status">저장된 영어 사진을 불러오는 중…</p> : null}
    {loadError ? <div role="alert"><p>{loadError}</p><Button onClick={() => { setLoading(true); setLoadError(null); setReload(value => value + 1) }} variant="secondary">다시 불러오기</Button></div> : null}
    {!loading && !loadError ? <>
      <div className="site-photo-editor__comparison">
        <PhotoPreview src={publishedSrc} alt={originalAlt} label="현재 공개 사진" />
        <PhotoPreview src={candidateSrc} alt={photo?.altKo || originalAlt} label="교체 미리보기" position={photo ? `${photo.positionX}% ${photo.positionY}%` : undefined} onLoaded={setVerifiedSource} />
      </div>
      <ImageUploader folder={fixed ? 'settings/photos' : target.item.folder} value={photo?.src || (fixed || english ? fallbackSrc : null)} disabled={busy}
        label="새 사진" description="JPG·PNG·WebP, 최대 5MB. 기존 사진 파일은 삭제하거나 덮어쓰지 않습니다."
        commitHint={fixed || english ? '업로드 → 사진 초안 저장 → 사진 게시 순서로 적용합니다.' : '업로드 후 사진 저장·적용을 눌러야 반영됩니다.'}
        onChange={src => { setPhoto(src ? { ...(photo ?? valueFor(src, originalAlt)), src } : null); setFeedback(null) }}
        onUploadStateChange={state => { uploadRef.current = state; setUploadState(state) }} />
      {photo && (fixed || !english && (target.item.target.altField || target.item.target.field === 'activity_images')) ? <div className="site-photo-editor__fields">
        <label>사진 대체 설명 · 한국어<input maxLength={500} value={photo.altKo} disabled={busy} onChange={event => update({ altKo: event.target.value })} /></label>
        {fixed ? <label>사진 대체 설명 · English<input maxLength={500} value={photo.altEn} disabled={busy} onChange={event => update({ altEn: event.target.value })} /></label> : null}
        <p>보이는 내용을 간결하게 설명해 주세요. 비우면 화면의 기본 설명을 사용합니다. 배경·장식 이미지는 공개 화면에서 장식으로 유지됩니다.</p>
      </div> : null}
      {fixed && photo && !target.asset.cssVariable ? <details className="site-photo-editor__position"><summary>사진 중심 위치 조절</summary><p>화면을 가득 채우는 사진 영역에서 중심 위치만 조절합니다. 원본 파일이나 인물·포스터 비율은 바뀌지 않습니다.</p>
        <label>가로 중심 {photo.positionX}%<input aria-label="사진 가로 중심" type="range" min={0} max={100} step={1} value={photo.positionX} disabled={busy} onChange={event => update({ positionX: Number(event.target.value) })} /></label>
        <label>세로 중심 {photo.positionY}%<input aria-label="사진 세로 중심" type="range" min={0} max={100} step={1} value={photo.positionY} disabled={busy} onChange={event => update({ positionY: Number(event.target.value) })} /></label>
      </details> : null}
      <div className="site-photo-editor__actions">
        {fixed || english ? <Button disabled={busy || pending} onClick={() => { setPhoto(null); setFeedback(null) }} variant="secondary">{fixed ? '기본 사진으로 복원' : '원본 사진 함께 사용'}</Button> : null}
        <Button disabled={busy || pending || !dirty} onClick={() => { setPhoto(saved); setError(null); setFeedback(null) }} variant="secondary">저장 전 변경 취소</Button>
        {!fixed ? <Link to={target.item.manager} onClick={event => { if (busy || dirty) event.preventDefault() }}>원본 콘텐츠 관리 ↗</Link> : null}
      </div>
      {photo && !candidateValid ? <p className="site-photo-editor__error" role="alert">{validateSitePhoto(photo)}</p> : null}
      {photo && candidateValid && verifiedSource !== photo.src ? <p role="status">사진이 정상적으로 표시되면 저장할 수 있습니다.</p> : null}
    </> : null}
    {error ? <p className="site-photo-editor__error" role="alert">{error}</p> : null}
    {feedback ? <p className="site-photo-editor__feedback" role="status">{feedback}</p> : null}
  </AdminModal>
}
