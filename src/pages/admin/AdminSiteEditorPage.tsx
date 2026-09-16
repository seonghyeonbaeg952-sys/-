import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { siteEditorPages } from '../../content/siteEditorCatalog'
import { getSiteCopyDefaults, siteCopyDefinitions } from '../../content/siteCopyCatalog'
import { FilterSelect } from '../../components/common/FilterSelect'
import { AdminModal } from '../../components/admin/AdminModal'
import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { EditorAppearancePanel } from '../../components/admin/site-editor/EditorAppearancePanel'
import { EditorCopyPanel } from '../../components/admin/site-editor/EditorCopyPanel'
import { EditorPreview } from '../../components/admin/site-editor/EditorPreview'
import { EditorPublishHistory } from '../../components/admin/site-editor/EditorPublishHistory'
import { editorViewports, formatEditorTime } from '../../components/admin/site-editor/editorUiOptions'
import { editSessionAppearance, editSessionCopy, getEditorChanges, getEditorExitGuard, getEditorStatus, replaceEditorDocument, resetEditorScope, resolveEditorConflict, validateEditorCopyFields, type EditorScope } from '../../components/admin/site-editor/editorSessionModel'
import { useEditorWorkspace } from '../../components/admin/site-editor/useEditorWorkspace'
import { Button } from '../../components/common/Button'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { getPublicConcerts, getPublicNotices, getPublicSiteTexts } from '../../lib/publicData'
import { emptySiteEditorDocument, isEditorPageId, validateSiteEditorDocument } from '../../lib/siteEditorModel'
import type { EditorDevice, EditorPageId, SiteEditorDocuments, SiteEditorRevision } from '../../types/siteEditor'
import '../../styles/admin-site-editor.css'

type Confirmation = { kind: 'publish' | 'reset-page' | 'reset-scope' | 'reset-appearance' } | { kind: 'restore'; revision: SiteEditorRevision }
const scopeLabels: Record<EditorScope, string> = { shared: '공통', mobile: '모바일', tablet: '태블릿', desktop: '데스크톱' }
const appearanceLabels: Record<string, string> = { fontFamily: '본문 글꼴', headingFontFamily: '제목 글꼴', fontSize: '본문 크기', h1Size: '큰 제목 크기', h2Size: '중간 제목 크기', h3Size: '작은 제목 크기', labelSize: '라벨 크기', fontWeight: '글자 굵기', lineHeight: '줄간격', letterSpacing: '자간', textColor: '본문 색', headingColor: '제목 색', mutedColor: '보조문구 색', accentColor: '강조 색', backgroundColor: '배경 색' }

export function AdminSiteEditorPage({ initialPage = 'home' }: { initialPage?: EditorPageId }) {
  const [params, setParams] = useSearchParams()
  const pageParam = params.get('page')
  const page = isEditorPageId(pageParam) ? pageParam : initialPage
  const pageDefinition = siteEditorPages.find((item) => item.id === page)!
  const workspace = useEditorWorkspace(page)
  const [scope, setScope] = useState<EditorScope>('mobile')
  const [device, setDevice] = useState<EditorDevice>('mobile')
  const [panel, setPanel] = useState<'copy' | 'appearance' | 'history'>('copy')
  const [view, setView] = useState<'editor' | 'preview'>('editor')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [defaults, setDefaults] = useState<Record<string, string>>({})
  const [defaultError, setDefaultError] = useState<string | null>(null)
  const [defaultLoading, setDefaultLoading] = useState(true)
  const [defaultReload, setDefaultReload] = useState(0)
  const [detailPaths, setDetailPaths] = useState<Partial<Record<EditorPageId, string | null>>>({})
  const [detailErrors, setDetailErrors] = useState<Partial<Record<EditorPageId, string | null>>>({})
  const session = workspace.session
  const status = session ? getEditorStatus(session) : { unsavedCount: 0, unpublishedCount: 0, canPublish: false }
  const changes = session ? getEditorChanges(session.baseline, session.document) : []
  const publishChanges = session ? getEditorChanges(session.record.published ?? emptySiteEditorDocument(), session.baseline) : []
  const allDirty = Object.values(workspace.sessions).filter((item) => item && getEditorStatus(item).unsavedCount > 0).length
  const busy = workspace.action !== null
  const validation = session ? validateSiteEditorDocument(session.document) || validateEditorCopyFields(session.document, siteCopyDefinitions.filter((field) => field.page === page)) : null
  const definitions = useMemo(() => siteCopyDefinitions.filter((field) => field.page === page && (!field.sourceDevice || field.sourceDevice === scope)), [page, scope])
  const allPageDefinitions = siteCopyDefinitions.filter((field) => field.page === page)
  const changeLabel = (key: string) => allPageDefinitions.find((field) => field.key === key)?.label ?? appearanceLabels[key] ?? '문구 설정'
  const documents = useMemo<SiteEditorDocuments>(() => Object.fromEntries(Object.entries(workspace.sessions).map(([key, value]) => [key, value?.document])), [workspace.sessions])
  const needsDetail = page === 'concert-detail' || page === 'notice-detail'
  const previewPath = needsDetail ? detailPaths[page] ?? null : pageDefinition.previewPath

  useUnsavedChangesGuard(getEditorExitGuard(allDirty, busy))

  useEffect(() => {
    let active = true
    getPublicSiteTexts().then((result) => {
      if (!active) return
      if (result.error || !result.data) setDefaultError('기존 홈페이지 문구를 불러오지 못했습니다. 원문을 확인한 뒤 편집해 주세요.')
      else { setDefaults(getSiteCopyDefaults(Object.fromEntries(result.data.filter((row) => row.is_active).map((row) => [row.key, row.value ?? ''])))); setDefaultError(null) }
    }).catch(() => { if (active) setDefaultError('기존 홈페이지 문구를 불러오지 못했습니다. 다시 시도해 주세요.') })
      .finally(() => { if (active) setDefaultLoading(false) })
    return () => { active = false }
  }, [defaultReload])

  useEffect(() => {
    if (page !== 'concert-detail' && page !== 'notice-detail') return
    let active = true
    const query = page === 'concert-detail' ? getPublicConcerts({ limit: 1 }) : getPublicNotices({ limit: 1 })
    query.then((result) => {
      if (!active) return
      const item = result.data?.[0]
      setDetailPaths((current) => ({ ...current, [page]: item ? `${page === 'concert-detail' ? '/concerts' : '/notices'}/${encodeURIComponent(item.id)}` : null }))
      setDetailErrors((current) => ({ ...current, [page]: result.error }))
    }).catch(() => { if (active) { setDetailPaths((current) => ({ ...current, [page]: null })); setDetailErrors((current) => ({ ...current, [page]: '공개 항목을 불러오지 못했습니다. 연결 상태를 확인하세요.' })) } })
    return () => { active = false }
  }, [page])

  const choosePage = (id: EditorPageId) => {
    const next = new URLSearchParams(params)
    next.set('page', id)
    setParams(next, { replace: true })
    setConfirmation(null)
  }
  const chooseScope = (next: EditorScope) => { setScope(next); if (next !== 'shared') setDevice(next) }
  const confirm = async () => {
    if (!confirmation || !session || busy) return
    if (confirmation.kind === 'publish') { if (await workspace.publish()) setConfirmation(null); return }
    if (confirmation.kind === 'restore') { if (await workspace.restore(confirmation.revision)) setConfirmation(null); return }
    workspace.edit(page, (current) => {
      if (confirmation.kind === 'reset-page') return replaceEditorDocument(current, emptySiteEditorDocument())
      if (confirmation.kind === 'reset-scope') return resetEditorScope(current, scope)
      const appearance = { ...current.document.appearance }
      delete appearance[scope]
      return replaceEditorDocument(current, { ...current.document, appearance })
    })
    setConfirmation(null)
  }
  const isHomeDefaultsUnavailable = page === 'home' && (defaultLoading || Boolean(defaultError))

  return <div className="site-editor" data-editor-view={view}>
    <AdminPageTitle title="홈페이지 편집" description="문구와 디자인을 수정한 뒤 미리보기에서 확인하세요. 임시저장과 게시는 별도입니다." />
    <div className="site-editor__layout">
      <div className="site-editor__selectors">
      <section className="site-editor__pages" aria-label="편집할 화면 선택">
        <p className="site-editor__selector-label">편집할 화면</p>
        <FilterSelect label="편집할 화면" value={page} onChange={(id) => { if (isEditorPageId(id)) choosePage(id) }} options={siteEditorPages.map((item) => {
          const saved = workspace.sessions[item.id]
          const dirty = saved ? getEditorStatus(saved).unsavedCount : 0
          return { value: item.id, label: `${item.label}${dirty ? ` · 미저장 ${dirty}개` : ''}` }
        })} />
        {allDirty > 0 ? <p className="site-editor__help">작성 중인 초안은 이 창에 유지됩니다. 닫기 전 임시저장하세요.</p> : null}
      </section>
      <section className="site-editor__devices" aria-label="기기별 편집">
        <p className="site-editor__selector-label">이 변경을 적용할 기기</p>
        <div className="site-editor__scope-tabs" role="group" aria-label="편집 적용 범위">{(['shared', 'mobile', 'tablet', 'desktop'] as const).map((item) => <button type="button" key={item} aria-pressed={scope === item} onClick={() => chooseScope(item)}><span>{scopeLabels[item]}</span><small>{item === 'shared' ? '모든 기기의 기본값' : `${editorViewports.find((viewport) => viewport.id === item)?.width}px`}{changes.some((change) => change.scope === item) ? ` · 미저장 ${changes.filter((change) => change.scope === item).length}` : ''}</small></button>)}</div>
      </section>
      </div>
      <div className="site-editor__main">
        <details className="site-editor__metadata"><summary>게시 상태와 공개 화면</summary>
        <div className="site-editor__page-heading"><div><h2 className="sr-only">{pageDefinition.label}</h2><p className="site-editor__help">마지막 임시저장 {formatEditorTime(session?.record.updated_at ?? null)} · 게시 {formatEditorTime(session?.record.published_at ?? null)}</p></div>{previewPath ? <Button href={previewPath} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">공개 화면 보기</Button> : null}</div>
        </details>
        {workspace.message ? <p className="site-editor__success" role="status">{workspace.message}</p> : null}
        {workspace.error ? <div className="site-editor__error" role="alert"><p>{workspace.error}</p><Button variant="secondary" disabled={workspace.loading || busy} onClick={() => void workspace.refresh()}>{session ? '입력 유지하며 최신 초안과 비교' : '다시 불러오기'}</Button></div> : null}
        {defaultError ? <div className="site-editor__notice"><p>{defaultError}</p><Button variant="secondary" size="sm" onClick={() => { setDefaultLoading(true); setDefaultReload((value) => value + 1) }}>기존 문구 다시 불러오기</Button></div> : null}
        {session?.conflicts.length ? <section className="site-editor__conflicts" aria-label="겹친 변경 확인"><h3>다른 관리자와 같은 항목을 수정했습니다</h3><p>입력은 유지됩니다. 각 항목에서 사용할 값을 선택하면 저장할 수 있습니다.</p>{session.conflicts.map((conflict) => <div key={conflict.id}><strong>{scopeLabels[conflict.scope]} · {changeLabel(conflict.key)}</strong><dl><dt>서버에 저장된 값</dt><dd>{conflict.before === undefined ? '기본값 사용' : String(conflict.before) || '(빈 문구)'}</dd><dt>내 입력</dt><dd>{conflict.after === undefined ? '기본값 사용' : String(conflict.after) || '(빈 문구)'}</dd></dl><div className="site-editor__inline-actions"><Button size="sm" variant="secondary" onClick={() => workspace.edit(page, (current) => resolveEditorConflict(current, conflict.id, 'server'))}>서버값 사용</Button><Button size="sm" variant="secondary" onClick={() => workspace.edit(page, (current) => resolveEditorConflict(current, conflict.id, 'local'))}>내 입력 유지</Button></div></div>)}</section> : null}
        <div className="site-editor__mobile-view" role="group" aria-label="작업 화면"><button type="button" aria-pressed={view === 'editor'} onClick={() => setView('editor')}>편집</button><button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>미리보기</button></div>
        {session ? <div className="site-editor__workbench">
          <div className="site-editor__edit-pane">
            <div className="site-editor__panel-tabs" role="group" aria-label="편집 종류">{([{ id: 'copy', label: '문구' }, { id: 'appearance', label: '글꼴·색' }, { id: 'history', label: '게시 이력' }] as const).map((item) => <button key={item.id} type="button" aria-pressed={panel === item.id} onClick={() => setPanel(item.id)}>{item.label}</button>)}</div>
{panel === 'copy' ? isHomeDefaultsUnavailable ? <p role="status" className="site-editor__empty">기존 홈 문구를 확인한 뒤 편집할 수 있습니다.</p> : <EditorCopyPanel key={`${page}:${scope}`} definitions={definitions} document={session.document} scope={scope} defaults={defaults} emptyMessage={page === 'home' && scope === 'shared' ? '기존 홈 문구는 기기별로 관리됩니다. 모바일·태블릿·데스크톱을 골라 수정하세요. 모든 기기의 글꼴과 색상은 공통 디자인에서 설정할 수 있습니다.' : undefined} onChange={(key, value) => workspace.edit(page, (current) => editSessionCopy(current, scope, key, value))} /> : panel === 'appearance' ? <EditorAppearancePanel value={session.document.appearance[scope] ?? {}} onChange={(key, value) => workspace.edit(page, (current) => editSessionAppearance(current, scope, key, value))} onReset={() => setConfirmation({ kind: 'reset-appearance' })} /> : <EditorPublishHistory revisions={workspace.revisions} loading={workspace.historyLoading} error={workspace.historyError} disabled={busy || status.unsavedCount > 0 || session.conflicts.length > 0} onReload={() => void workspace.refreshHistory()} onRestore={(revision) => setConfirmation({ kind: 'restore', revision })} />}
            {panel === 'history' && status.unsavedCount ? <p className="site-editor__notice">현재 입력을 먼저 임시저장하면 이전 게시본을 불러올 수 있습니다.</p> : null}
            <div className="site-editor__reset-actions"><Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmation({ kind: 'reset-scope' })}>{scopeLabels[scope]} 편집값 초기화</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmation({ kind: 'reset-page' })}>이 화면 전체 초기화</Button></div>
          </div>
          <div className="site-editor__preview-pane">{detailErrors[page] ? <p role="alert" className="site-editor__error">{detailErrors[page]}</p> : null}<EditorPreview page={page} label={pageDefinition.label} path={previewPath} loadingPath={needsDetail && !Object.hasOwn(detailPaths, page)} device={device} documents={documents} onDeviceChange={setDevice} /></div>
        </div> : !workspace.error ? <p role="status" className="site-editor__empty">안전하게 저장된 초안을 불러오고 있습니다.</p> : null}
        {pageDefinition.contentLinks.length ? <section className="site-editor__content-links"><h3>실제 내용은 여기에서 관리합니다</h3><p className="site-editor__help">공연·프로필·입단 안내·후원 원문과 사진은 기존 콘텐츠 관리가 원본입니다.</p><div>{pageDefinition.contentLinks.map((link) => <Button key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm">{link.label} · 새 탭</Button>)}</div></section> : null}
      </div>
    </div>
    <div className="site-editor__save-bar"><div><strong>{pageDefinition.label}</strong><span role="status">{busy ? '처리 중입니다. 추가 입력은 보존됩니다.' : !session ? workspace.error ? '초안을 불러오지 못했습니다' : '초안을 불러오는 중' : status.unsavedCount ? `미저장 ${status.unsavedCount}개 · 저장 후 게시할 수 있습니다` : status.unpublishedCount ? `임시저장 완료 · 게시 전 변경 ${status.unpublishedCount}개` : '저장된 초안과 게시본이 같습니다'}</span>{allDirty > (status.unsavedCount ? 1 : 0) ? <span>다른 화면에도 미저장 초안이 있습니다.</span> : null}{validation ? <span className="site-editor__error" role="alert">{validation}</span> : null}</div><div className="site-editor__inline-actions"><Button variant="secondary" disabled={!session || busy || !status.unsavedCount || Boolean(validation) || Boolean(session.conflicts.length)} onClick={() => void workspace.save()}>{workspace.action?.kind === 'save' ? '임시저장 중…' : '임시저장'}</Button><Button disabled={!session || busy || !status.canPublish || Boolean(validation)} onClick={() => setConfirmation({ kind: 'publish' })}>이 화면 게시</Button></div></div>
    <AdminModal isOpen={Boolean(confirmation)} onClose={() => { if (!busy) setConfirmation(null) }} title={confirmation?.kind === 'publish' ? `${pageDefinition.label} · 홈페이지에 게시` : confirmation?.kind === 'restore' ? '이전 게시본을 초안으로 불러오기' : '편집값 초기화'} footer={<div className="site-editor__inline-actions"><Button variant="secondary" disabled={busy} onClick={() => setConfirmation(null)}>취소</Button><Button disabled={busy || !session || (confirmation?.kind === 'publish' && !status.canPublish)} onClick={() => void confirm()}>{busy ? '처리 중…' : confirmation?.kind === 'publish' ? `${pageDefinition.label} 게시하기` : confirmation?.kind === 'restore' ? '초안으로 불러오기' : '초기화하기'}</Button></div>}>
      {confirmation?.kind === 'publish' ? <><p>저장된 <strong>{pageDefinition.label}</strong> 초안을 공개 홈페이지에 적용합니다. 다른 화면의 초안은 게시하지 않습니다.</p><ul className="site-editor__change-summary">{publishChanges.map((change) => <li key={change.id}><strong>{scopeLabels[change.scope]} · {changeLabel(change.key)}</strong><span>{change.after === undefined ? '기존 원문·디자인 사용' : String(change.after) || '(빈 문구)'}</span></li>)}</ul></> : confirmation?.kind === 'restore' ? <p>{formatEditorTime(confirmation.revision.published_at)}의 문구·디자인 설정을 초안으로 불러옵니다. 현재 공개 홈페이지와 전용 콘텐츠 원문은 그대로 유지됩니다. 확인 후 별도로 게시해 주세요.</p> : <p>{confirmation?.kind === 'reset-page' ? '이 화면의 모든 공통·기기별 문구와 디자인' : confirmation?.kind === 'reset-appearance' ? `${scopeLabels[scope]} 디자인` : `${scopeLabels[scope]} 문구와 디자인`}의 편집값을 지우고 기존 원문과 디자인을 사용합니다. 임시저장·게시 전에는 공개 홈페이지가 바뀌지 않습니다.</p>}
      {workspace.error ? <p className="site-editor__error" role="alert">{workspace.error}</p> : null}
    </AdminModal>
  </div>
}
