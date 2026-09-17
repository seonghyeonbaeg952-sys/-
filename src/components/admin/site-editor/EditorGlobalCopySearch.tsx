import { useEffect, useId, useRef, useState } from 'react'
import { siteCopyDefinitions } from '../../../content/siteCopyCatalog'
import { siteEditorPages } from '../../../content/siteEditorCatalog'
import type { EditorPageId, SiteCopyDefinition, SiteEditorDocuments } from '../../../types/siteEditor'
import { AdminModal } from '../AdminModal'
import { Button } from '../../common/Button'
import type { EditorScope } from './editorSessionModel'
import { copyValue, findCopyMatches } from './editorCopyTools'

type Props = { documents: SiteEditorDocuments; defaults: Record<string, string>; scope: EditorScope; disabled: boolean; defaultsTrusted: boolean
  load: () => Promise<EditorPageId[]>; onChoose: (field: SiteCopyDefinition, scope: EditorScope) => void }
export function EditorGlobalCopySearch({ documents, defaults, scope, disabled, defaultsTrusted, load, onChoose }: Props) {
  const id = useId(), input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState<EditorPageId[]>([]), [reload, setReload] = useState(0)
  const [page, setPage] = useState('all'), [count, setCount] = useState(40)
  const [searchScope, setSearchScope] = useState<EditorScope>(scope)
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!disabled && !event.isComposing && (event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'f') {
        event.preventDefault(); setOpen(true); setSearchScope(scope)
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [disabled, scope])
  useEffect(() => {
    if (!open) return
    let active = true
    queueMicrotask(() => { if (active) setLoading(true) })
    load().then(missing => { if (active) { setFailed(missing); setLoading(false) } }).catch(() => { if (active) { setFailed(siteEditorPages.map(item => item.id)); setLoading(false) } })
    return () => { active = false }
  }, [load, open, reload])
  const results = query ? siteCopyDefinitions.filter(field => {
    const doc = documents[field.page]
    if (!doc || (field.page === 'home' && !defaultsTrusted) || (page !== 'all' && field.page !== page) || (field.sourceDevice && field.sourceDevice !== searchScope)) return false
    return findCopyMatches(`${field.label}\n${field.section}\n${copyValue(field, doc, searchScope, defaults)}`, query, { matchCase: false, wholeWord: false }).length > 0
  }) : []
  return <>
    <Button variant="secondary" size="sm" disabled={disabled} onClick={() => { setOpen(true); setSearchScope(scope) }}>전체 페이지 문구 찾기</Button>
    <AdminModal isOpen={open} title="전체 페이지 문구 찾기" onClose={() => setOpen(false)}>
      <div className="site-editor copy-tools__global">
        <p className="site-editor__help">현재 창의 미저장 입력과 불러온 임시저장본을 검색합니다. 검색은 홈페이지를 바꾸지 않으며, 결과를 선택하면 해당 문구 편집으로 이동합니다.</p>
        <label className="copy-tools__label" htmlFor={`${id}-query`}>찾을 문구<input id={`${id}-query`} ref={input} type="search" value={query} onChange={event => { setQuery(event.target.value); setCount(40) }} placeholder="예: 합창단, 신청, 연락처" /></label>
        <div className="copy-tools__global-filters">
          <label className="copy-tools__label">화면<select value={page} onChange={event => { setPage(event.target.value); setCount(40) }}><option value="all">전체 페이지</option>{siteEditorPages.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="copy-tools__label">기기<select value={searchScope} onChange={event => { setSearchScope(event.target.value as EditorScope); setCount(40) }}><option value="shared">공통</option><option value="desktop">데스크톱</option><option value="tablet">태블릿</option><option value="mobile">모바일</option></select></label>
        </div>
        <p role="status" className="site-editor__help">{loading ? '페이지별 초안을 불러오는 중입니다…' : `${Object.keys(documents).length} / ${siteEditorPages.length}개 페이지 확인`} · {query ? `${results.length}개 문구 일치` : '찾을 문구를 입력하세요.'}</p>
        {failed.length ? <div role="alert" className="site-editor__error"><p>확인하지 못한 페이지: {failed.map(item => siteEditorPages.find(p => p.id === item)?.label).join(', ')}. 이 페이지는 결과에서 제외했습니다.</p><Button variant="secondary" size="sm" disabled={loading} onClick={() => setReload(value => value + 1)}>누락 페이지 다시 확인</Button></div> : null}
        {!defaultsTrusted ? <p className="site-editor__notice">홈의 기존 원문을 아직 확인하지 못해 홈 결과는 제외했습니다.</p> : null}
        <div className="copy-tools__global-results">{results.slice(0, count).map(field => <button key={field.key} type="button" disabled={disabled} onClick={() => { onChoose(field, searchScope); setOpen(false) }}><strong>{field.label}</strong><span>{copyValue(field, documents[field.page]!, searchScope, defaults).slice(0, 220) || '（빈 문구）'}</span><small>{siteEditorPages.find(item => item.id === field.page)?.label} · {field.section}</small></button>)}</div>
        {results.length > count ? <Button variant="secondary" onClick={() => setCount(value => value + 40)}>검색 결과 더 보기</Button> : null}
        <details><summary>찾는 내용이 없나요? 원문 관리 위치</summary><p className="site-editor__help">공연 제목·프로필·FAQ처럼 데이터에서 가져오는 내용은 아래 원본 CMS에서 수정합니다. 신청자·후원자·문의 접수 내용은 이 검색에 포함하지 않습니다.</p><div className="copy-tools__sources">{siteEditorPages.filter(item => page === 'all' || item.id === page).map(item => <div key={item.id}><strong>{item.label}</strong>{item.contentLinks.map(link => <Button key={link.href} size="sm" variant="ghost" href={link.href} target="_blank" rel="noopener noreferrer">{link.label} ↗</Button>)}</div>)}</div></details>
      </div>
    </AdminModal>
  </>
}
