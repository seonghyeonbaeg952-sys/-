import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { Button } from '../../components/common/Button'
import { OptimizedImage } from '../../components/common/OptimizedImage'
import { loadAdminSitePhotos } from '../../features/site-photos/sitePhotoApi'
import { SITE_PHOTO_ASSETS } from '../../features/site-photos/sitePhotoCatalog'
import { loadContentPhotos, type ContentPhotoItem } from '../../features/site-photos/sitePhotoContent'
import { SitePhotoEditor, type PhotoEditTarget } from '../../features/site-photos/SitePhotoEditor'
import { canEditEnglishPhoto } from '../../features/site-photos/sitePhotoEnglish'
import { sameSitePhoto, type SitePhotoRecord } from '../../features/site-photos/sitePhotoModel'
import '../../styles/site-photos.css'

type Filter = 'all' | 'fixed' | 'content' | 'brand' | 'background'
const categoryNames = { photo: '페이지 사진', brand: '로고', background: '배경', decoration: '장식' }
export function AdminSitePhotosPage() {
  const [records, setRecords] = useState<Record<string, SitePhotoRecord>>({})
  const [content, setContent] = useState<ContentPhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [fixedAvailable, setFixedAvailable] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [visibility, setVisibility] = useState('all')
  const [edit, setEdit] = useState<PhotoEditTarget | null>(null)
  const [reload, setReload] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const refresh = useCallback(() => setReload(value => value + 1), [])
  useEffect(() => {
    let active = true
    void Promise.all([loadAdminSitePhotos(), loadContentPhotos()]).then(([fixed, data]) => {
      if (!active) return
      setRecords(Object.fromEntries((fixed.data ?? []).map(row => [row.asset_key, row])))
      setFixedAvailable(Boolean(fixed.data))
      setContent(data.data); setErrors([...(fixed.error ? [fixed.error] : []), ...data.errors]); setLoading(false)
    }).catch(() => { if (active) { setErrors(['사진 목록을 불러오지 못했습니다. 다시 불러오기를 눌러 주세요.']); setLoading(false) } })
    return () => { active = false }
  }, [reload])
  const needle = search.trim().toLowerCase()
  const fixedRows = useMemo(() => SITE_PHOTO_ASSETS.filter(asset => {
    if (filter === 'content') return false
    if (filter === 'fixed' && asset.category !== 'photo') return false
    if (filter === 'brand' && asset.category !== 'brand') return false
    if (filter === 'background' && !['background', 'decoration'].includes(asset.category)) return false
    if (visibility === 'hidden') return false
    return !needle || `${asset.title} ${asset.description} ${asset.usages.map(use => use.label).join(' ')} ${asset.sources.join(' ')}`.toLowerCase().includes(needle)
  }), [filter, visibility, needle])
  const contentRows = useMemo(() => content.filter(item => ['all', 'content'].includes(filter)
    && (visibility === 'all' || item.visible === (visibility === 'visible'))
    && (!needle || `${item.title} ${item.sourceTitle} ${item.src}`.toLowerCase().includes(needle))), [content, filter, visibility, needle])
  const onApplied = (record?: SitePhotoRecord) => {
    if (record) setRecords(current => ({ ...current, [record.asset_key]: record }))
    else refresh()
    setFeedback(record ? record.published_at && sameSitePhoto(record.draft, record.published)
      ? record.published ? '사진을 게시했습니다.' : '기본 사진으로 복원했습니다.'
      : '사진 초안을 저장했습니다. 공개 화면에 적용하려면 사진을 게시해 주세요.'
      : '사진 변경을 저장·반영했습니다. 비공개 콘텐츠의 공개 여부는 그대로 유지했습니다.')
  }
  return <div className="site-photos">
    <AdminPageTitle title="홈페이지 사진 관리" description="페이지 사진부터 히어로·인물·공연·갤러리·로고·배경까지, 사용 위치를 확인하고 교체합니다. 문구 편집·번역과는 별도로 저장합니다."
      action={<Button disabled={loading || Boolean(edit)} onClick={() => { setLoading(true); refresh() }} variant="secondary">다시 불러오기</Button>} />
    <div className="site-photos__guide">
      <p><strong>페이지에 고정된 사진</strong>은 초안 저장 후 게시합니다. <strong>콘텐츠 사진</strong>은 기존 관리 원본에 저장합니다. 파일을 업로드하는 것만으로는 공개 사진이 바뀌지 않습니다.</p>
      <p>공개된 합창단 사진만 관리합니다. 단원 개별사진·입단지원 사진·접수 서명 등 개인정보는 이 목록에 포함하지 않습니다.</p>
    </div>
    <div className="site-photos__toolbar">
      <label>사진 찾기<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="사진 이름 · 사용 페이지 · 파일 경로" /></label>
      <label>사진 종류<select value={filter} onChange={event => setFilter(event.target.value as Filter)}>
        <option value="all">모든 사진</option><option value="fixed">페이지 고정사진</option><option value="content">콘텐츠 사진</option><option value="brand">로고</option><option value="background">배경·장식</option>
      </select></label>
      <label>공개 상태<select value={visibility} onChange={event => setVisibility(event.target.value)}><option value="all">전체</option><option value="visible">공개</option><option value="hidden">비공개 콘텐츠</option></select></label>
    </div>
    {errors.length ? <div className="site-photos__errors" role="alert"><strong>일부 목록을 불러오지 못했습니다.</strong>{errors.map(error => <p key={error}>{error}</p>)}<p>불러온 사진은 계속 편집할 수 있습니다. 불러오지 못한 고정사진은 저장을 막아 기존 설정을 보호합니다.</p></div> : null}
    {feedback ? <p className="site-photo-editor__feedback" role="status">{feedback}</p> : null}
    <p className="site-photos__count" role="status">{loading ? '사진과 사용 위치를 불러오는 중…' : `${fixedRows.length + contentRows.length}개 표시 · 고정 자산 ${SITE_PHOTO_ASSETS.length}개 · 콘텐츠 사진 ${content.length}개`}</p>
    <div className="site-photos__grid">
      {fixedRows.map(asset => {
        const record = records[asset.key]
        const src = record?.published?.src || asset.sources[0]
        const hasDraft = record && !sameSitePhoto(record.draft, record.published)
        return <article className="site-photo-card" key={asset.key}>
          <button type="button" className="site-photo-card__thumbnail" disabled={!fixedAvailable || loading} aria-label={`${asset.title} 사진 교체`} onClick={() => setEdit({ kind: 'fixed', asset, record })}>
            <OptimizedImage src={src} alt={asset.title} objectFit="contain" fallbackVariant="gallery" />
          </button>
          <div className="site-photo-card__body"><div className="site-photo-card__meta"><span>{categoryNames[asset.category]}</span><span>{hasDraft ? '게시 전 초안' : record?.published ? '교체 사진 게시됨' : '기본 사진'}</span></div>
            <h2>{asset.title}</h2><p>{asset.description}</p>
            <div className="site-photo-card__usages">{asset.usages.map(use => <a key={`${use.href}:${use.label}`} href={use.href} target="_blank" rel="noreferrer">{use.label} ↗</a>)}</div>
            <Button disabled={!fixedAvailable || loading} onClick={() => setEdit({ kind: 'fixed', asset, record })} variant="secondary">사진 교체</Button>
          </div>
        </article>
      })}
      {contentRows.map(item => <article className="site-photo-card" key={item.key}>
        <button type="button" className="site-photo-card__thumbnail" aria-label={`${item.title} 원본 사진 교체`} onClick={() => setEdit({ kind: 'content', item, language: 'ko' })}>
          <OptimizedImage src={item.src} alt={item.alt} objectFit="contain" fallbackVariant="gallery" />
        </button>
        <div className="site-photo-card__body"><div className="site-photo-card__meta"><span>{item.sourceTitle}</span><span>{item.visible ? '공개 콘텐츠' : '비공개 · 저장해도 공개 안 됨'}</span></div>
          <h2>{item.title}</h2><p>{item.src ? '원본 콘텐츠의 사진입니다. 교체하면 사진을 함께 사용하는 모든 화면에 반영됩니다.' : '아직 사진이 없습니다. 업로드해 연결할 수 있습니다.'}</p>
          <div className="site-photo-card__usages"><a href={item.href} target="_blank" rel="noreferrer">사용 화면 ↗</a><Link to={item.manager}>원본 관리 ↗</Link></div>
          <div className="site-photo-card__actions"><Button onClick={() => setEdit({ kind: 'content', item, language: 'ko' })} variant="secondary">원본 사진 교체</Button>
            {canEditEnglishPhoto(item) ? <Button onClick={() => setEdit({ kind: 'content', item, language: 'en' })} variant="ghost">영어 사진</Button> : <span>한국어·영어 공통 사진</span>}
          </div>
        </div>
      </article>)}
    </div>
    {!loading && !fixedRows.length && !contentRows.length ? <div className="site-photos__empty"><p>조건에 맞는 사진이 없습니다.</p><Button onClick={() => { setSearch(''); setFilter('all'); setVisibility('all') }} variant="secondary">검색·필터 초기화</Button></div> : null}
    {edit ? <SitePhotoEditor key={edit.kind === 'fixed' ? edit.asset.key : `${edit.item.key}:${edit.language}`} target={edit} onClose={() => setEdit(null)} onApplied={onApplied} /> : null}
  </div>
}
