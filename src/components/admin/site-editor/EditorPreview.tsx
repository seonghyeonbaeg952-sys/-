import { useCallback, useEffect, useRef, useState } from 'react'
import { isEditorPageId, validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import { getSiteEditorPage, SITE_EDITOR_PROTOCOL_VERSION, type PreviewPageIntent } from '../../../lib/siteEditorPreview'
import { siteCopyDefinitions } from '../../../content/siteCopyCatalog'
import type { EditorDevice, EditorPageId, EditorTextLayout, SiteCopyDefinition, SiteEditorDocument, SiteEditorDocuments } from '../../../types/siteEditor'
import type { EditorStorageScope } from '../../../lib/siteEditorApi'
import { Button } from '../../common/Button'
import { readEditorPreviewReply } from './editorPreviewModel'
import { editorViewports, getEditorPreviewScale } from './editorUiOptions'
import { validateEditorCopyFields } from './editorSessionModel'
import { useCanvasBridge, type CanvasBridgeOptions } from './useCanvasBridge'
import { EditorCanvasToolbar } from './EditorCanvasToolbar'
import { usePlacementBridge, type PlacementChangeResult } from './usePlacementBridge'
import { EditorPlacementToolbar } from './EditorPlacementToolbar'
import { EditorWorkSurface } from './EditorWorkSurface'
import { alignLayoutToBlock, constrainLayoutInput } from './editorPlacementGeometry'

type Props = {
  page: EditorPageId
  label: string
  path: string | null
  device: EditorDevice
  documents: SiteEditorDocuments
  copyDefinitions?: readonly SiteCopyDefinition[]
  storageScope?: EditorStorageScope
  loadingPath?: boolean
  onDeviceChange: (device: EditorDevice) => void
  onNavigate?: (target: PreviewPageIntent) => void
  onLayoutChange: (id: string, next: EditorTextLayout | undefined, before: EditorTextLayout, device: EditorDevice) => PlacementChangeResult
  onBoxAdd: (anchor: string, text: string) => { ok: true; id: string } | { ok: false; message: string }
  onBoxRemove: (id: string) => { ok: true; document: SiteEditorDocument } | { ok: false; message: string }
} & CanvasBridgeOptions & { locked: boolean }

function PreviewFrame({ page, label, path, device, documents, copyDefinitions = siteCopyDefinitions, storageScope = 'original', fit, context, onCommit, onActiveChange, onSave, onLayoutChange, onBoxAdd, onBoxRemove, onNavigate }: Omit<Props, 'onDeviceChange'> & { path: string; fit: boolean }) {
  const [nonce] = useState(() => crypto.randomUUID())
  const frame = useRef<HTMLIFrameElement>(null)
  const holder = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(0)
  const [readyCount, setReadyCount] = useState(0)
  const [failure, setFailure] = useState<string | null>(null)
  const [pending, setPending] = useState(0)
  const [applied, setApplied] = useState(0)
  const [textActive, setTextActive] = useState(false)
  const [placementActive, setPlacementActive] = useState(false)
  const [placementInputDirty, setPlacementInputDirty] = useState(false)
  const sequence = useRef(0)
  const lastNavigation = useRef('')
  const forceRefresh = useCallback(() => setReadyCount(value => value + 1), [])
  const canvas = useCanvasBridge({ frame, nonce, draftSequence: sequence, context, onCommit, onActiveChange: setTextActive, onSave, onCommitted: forceRefresh })
  const placementLocked = !context.defaultsTrusted || context.scope === 'shared' || page === 'common'
  const placement = usePlacementBridge({ frame, nonce, draftSequence: sequence, context: { ...context, locked: placementLocked || placementInputDirty }, onChange: onLayoutChange, onActiveChange: setPlacementActive, onCommitted: forceRefresh })
  const { blocks: placementBlocks, select: selectPlacement, connected: placementConnected, mode: placementMode, setMode: setPlacementMode } = placement
  const [placementError, setPlacementError] = useState('')
  const [placementStatus, setPlacementStatus] = useState('')
  const [addingBox, setAddingBox] = useState(false)
  const [newBoxText, setNewBoxText] = useState('')
  const [boxAnchor, setBoxAnchor] = useState('')
  const [boxAnchors, setBoxAnchors] = useState<Array<{ id: string; label: string }>>([])
  const [boxFeedback, setBoxFeedback] = useState('')
  const [newBoxId, setNewBoxId] = useState('')
  const placementBusy = placement.active || canvas.active || placementLocked || !applied || pending !== applied
  const editing = textActive || placementActive || placementInputDirty
  useEffect(() => { onActiveChange(editing); return () => onActiveChange(false) }, [editing, onActiveChange])
  useEffect(() => {
    if (!newBoxId || !placementBlocks.some(block => block.id === newBoxId) || placementBusy) return
    const frameId = window.requestAnimationFrame(() => {
      selectPlacement(newBoxId)
      setNewBoxId(current => current === newBoxId ? '' : current)
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [newBoxId, placementBlocks, selectPlacement, placementBusy])
  useEffect(() => {
    if (canvas.mode === 'edit' && canvas.connected && placementConnected && placementMode === 'off' && !placementLocked) setPlacementMode('place')
  }, [canvas.mode, canvas.connected, placementConnected, placementMode, setPlacementMode, placementLocked])
  const overlapping = placement.selected ? placement.blocks.filter(peer => {
    const selected = placement.selected!
    return peer.id !== selected.id && peer.group === selected.group
      && Math.min(peer.rect.left + peer.rect.width, selected.rect.left + selected.rect.width) - Math.max(peer.rect.left, selected.rect.left) > 2
      && Math.min(peer.rect.top + peer.rect.height, selected.rect.top + selected.rect.height) - Math.max(peer.rect.top, selected.rect.top) > 2
  }) : []
  const viewport = editorViewports.find((item) => item.id === device) ?? editorViewports[0]
  const previewPage = page === 'common' ? 'home' : page
  const scale = getEditorPreviewScale(device, available, fit)
  const url = new URL(path, window.location.origin)
  const allowedUrl = url.origin === window.location.origin && !url.pathname.startsWith('/admin')
    && !/^\/sample(?:\/|$)/.test(url.pathname)
    && getSiteEditorPage(url.pathname, url.search) === previewPage
    && url.searchParams.get('lang') === (storageScope === 'sample-english' ? 'en' : 'ko')
  url.searchParams.set('site-editor-preview', nonce)
  const invalidDraft = Object.entries(documents).some(([key, document]) => !isEditorPageId(key) || validateSiteEditorDocument(document) || validateEditorCopyFields(document, copyDefinitions.filter((field) => field.page === key)))

  useEffect(() => {
    const node = holder.current
    if (!node) return
    const measure = () => setAvailable(node.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const source = frame.current?.contentWindow
      if (!source) return
      const reply = readEditorPreviewReply(event, { source, origin: window.location.origin, nonce, page: previewPage })
      if (!reply) return
      if (reply.type === 'smyc-editor:ready') {
        setReadyCount((value) => value + 1)
        setFailure(null)
      } else if (reply.type === 'smyc-editor:anchors' && reply.sequence <= sequence.current) {
        const available = reply.anchors.length ? reply.anchors : [{ id: 'main-content', label: '본문 아래' }]
        setBoxAnchors(available)
        setBoxAnchor(current => available.some(section => section.id === current) ? current : available[0].id)
      } else if (reply.type === 'smyc-editor:applied' && reply.sequence === sequence.current) {
        setApplied(reply.sequence)
        setFailure(null)
      } else if (reply.type === 'smyc-editor:navigate' && reply.sequence === sequence.current && reply.requestId !== lastNavigation.current) {
        if (editing || pending !== applied || !applied) { setFailure('문구 편집과 초안 반영을 마친 뒤 이동하세요. 입력은 유지됩니다.'); return }
        lastNavigation.current = reply.requestId
        onNavigate?.(reply.target)
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [nonce, previewPage, editing, pending, applied, onNavigate])

  useEffect(() => {
    if (readyCount) return
    const timer = window.setTimeout(() => setFailure('미리보기 연결이 지연되고 있습니다. 새로고침하거나 네트워크를 확인해 주세요.'), 12000)
    return () => window.clearTimeout(timer)
  }, [readyCount])

  useEffect(() => {
    if (!readyCount || invalidDraft || !allowedUrl) return
    const timer = window.setTimeout(() => {
      const nextSequence = ++sequence.current
      setPending(nextSequence)
      frame.current?.contentWindow?.postMessage({ type: 'smyc-editor:draft', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page: previewPage, sequence: nextSequence, documents }, window.location.origin)
    }, 120)
    return () => window.clearTimeout(timer)
  }, [readyCount, invalidDraft, allowedUrl, documents, nonce, previewPage])

  useEffect(() => {
    if (!pending || pending === applied || canvas.active || placement.active) return
    const timer = window.setTimeout(() => setFailure('초안 반영을 확인하지 못했습니다. 미리보기를 새로고침해 주세요.'), 10000)
    return () => window.clearTimeout(timer)
  }, [pending, applied, canvas.active, placement.active])

  const changeLayout = (next: EditorTextLayout | undefined) => {
    const block = placement.selected
    if (!block || placementBusy) return
    const { value, limited } = constrainLayoutInput(block, next)
    const result = onLayoutChange(block.id, value, block.value, device)
    setPlacementError(result.ok ? '' : result.message)
    if (result.ok) {
      setPlacementStatus(limited ? '화면과 섹션 안에 보이도록 위치·너비를 조절했습니다.' : '배치를 초안에 적용했습니다. 실행 취소로 되돌릴 수 있습니다.')
      const nextSequence = ++sequence.current
      setPending(nextSequence)
      frame.current?.contentWindow?.postMessage({ type: 'smyc-editor:draft', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page: previewPage,
        sequence: nextSequence, documents: { ...documents, [page]: result.document } }, window.location.origin)
    }
  }
  const alignLayout = (referenceId: string, axis: 'x' | 'y') => {
    const block = placement.selected, reference = placement.blocks.find(item => item.id === referenceId)
    if (!block || !reference) return
    const next = alignLayoutToBlock(block, reference, axis)
    if (next) changeLayout(next)
  }

  return <>
    <div className="site-editor__preview-tools" role="group" aria-label="화면에서 편집 또는 둘러보기">
      <button type="button" disabled={editing} aria-pressed={canvas.mode === 'edit'} onClick={() => { canvas.setMode('edit'); if (!placementLocked) placement.setMode('place') }}>문구 편집 · 상자 배치</button>
      <button type="button" disabled={editing} aria-pressed={canvas.mode === 'preview' && placement.mode === 'off'} onClick={() => { placement.setMode('off'); canvas.setMode('preview') }}>둘러보기</button>
    </div>
    {page !== 'common' ? <section className="site-editor__added-box-tools" aria-label="문구 상자 추가">
      <button type="button" disabled={editing || !context.defaultsTrusted || !boxAnchors.length} aria-expanded={addingBox} onClick={() => setAddingBox(value => !value)}>＋ 문구 상자 추가</button>
      {addingBox ? <form onSubmit={event => {
        event.preventDefault()
        if (!newBoxText.trim() || !boxAnchor || editing) { setBoxFeedback('문구와 배치할 영역을 선택해 주세요.'); return }
        const result = onBoxAdd(boxAnchor, newBoxText)
        if (!result.ok) { setBoxFeedback(result.message); return }
        setNewBoxId(result.id); setNewBoxText(''); setAddingBox(false); setBoxFeedback('')
      }}>
        <label>새 상자 문구<input value={newBoxText} maxLength={1000} required onChange={event => setNewBoxText(event.target.value)} placeholder="표시할 문구를 입력하세요" /></label>
        <label>배치할 영역<select value={boxAnchor} required onChange={event => setBoxAnchor(event.target.value)}>{boxAnchors.map(anchor => <option key={anchor.id} value={anchor.id}>{anchor.label}</option>)}</select></label>
        <Button type="submit" size="sm" disabled={!newBoxText.trim() || !boxAnchor || editing}>상자 만들기</Button>
      </form> : null}
      {boxFeedback ? <p role="status">{boxFeedback}</p> : null}
      {!boxAnchors.length && applied ? <p role="status">이 화면에서 배치할 영역을 찾지 못했습니다. 미리보기를 새로고침해 주세요.</p> : null}
    </section> : null}
    {context.scope === 'shared' || page === 'common' ? <p className="site-editor__help">배치 조정은 개별 화면과 모바일·태블릿·데스크톱 중 한 기기를 선택해 사용하세요.</p> : null}
    <EditorWorkSurface placing={placement.mode === 'place'} panel={placement.mode === 'place' ? <EditorPlacementToolbar key={`${page}:${device}`} selected={placement.selected} blocks={placement.blocks} value={placement.selected?.value}
      disabled={placementBusy} onSelect={placement.select} onChange={changeLayout} onAlign={alignLayout}
      onEditText={placement.selected && canvas.canEditSource(placement.selected.id) ? () => canvas.editSource(placement.selected!.id) : undefined}
      onDirtyChange={setPlacementInputDirty}
      onDelete={id => {
        const result = onBoxRemove(id)
        if (!result.ok) { setPlacementError(result.message); return }
        setPlacementError(''); setPlacementStatus('문구 상자를 초안에서 삭제했습니다. 실행 취소로 되돌릴 수 있습니다.')
        const nextSequence = ++sequence.current
        setPending(nextSequence)
        frame.current?.contentWindow?.postMessage({ type: 'smyc-editor:draft', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page: previewPage,
          sequence: nextSequence, documents: { ...documents, [page]: result.document } }, window.location.origin)
      }}
      onFinish={() => { placement.setMode('off'); canvas.setMode('preview') }} error={placementError || placement.error || undefined}
      status={overlapping.length ? `다음 문구와 박스가 겹칩니다: ${overlapping.map(item => item.label).join(', ')}. 위치를 조절하거나 실행 취소하세요.` : placementStatus} /> : null}>
    {canvas.mode === 'edit' ? <EditorCanvasToolbar blockLabel={canvas.blockLabel} selection={canvas.selection} summary={canvas.summary} active={canvas.active} busy={false} canPlace={placement.mode === 'place' && !placementLocked} onBegin={canvas.begin} onFormat={canvas.format} onAction={canvas.action} /> : null}
    {canvas.mode === 'edit' && !canvas.active ? <p className="site-editor__help">버튼·탭은 클릭하면 동작합니다. 버튼 안 문구는 Alt+클릭으로 선택한 뒤 글자·글꼴 편집을 누르거나, 아래 문구 선택 목록을 이용하세요.</p> : null}
    {canvas.mode === 'edit' && !canvas.active ? <details className="site-editor__canvas-find"><summary>키보드로 문구 선택 · 화면에서 찾기</summary>
      <label>화면에 표시된 문구<select aria-label="화면에 표시된 문구" value="" disabled={!canvas.connected} onChange={event => canvas.choose(event.target.value)}><option value="">수정할 문구를 고르세요</option>{canvas.choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label>
    </details> : null}
    {canvas.error ? <p role="alert" className="site-editor__error">{canvas.error}</p> : null}
    {canvas.active ? <p className="site-editor__notice">문구를 수정 중입니다. 편집을 마친 뒤 임시저장하세요. Esc는 입력을 버리지 않습니다.</p> : null}
    <p className={failure || invalidDraft ? 'site-editor__error' : 'site-editor__help'} role={failure || invalidDraft ? 'alert' : 'status'}>
      {invalidDraft ? '입력 범위를 벗어난 값이 있어 마지막 미리보기를 유지합니다. 입력을 확인해 주세요.' : failure ?? (!readyCount ? '공개 화면에 미리보기를 연결하는 중입니다.' : pending === applied && applied > 0 ? '현재 초안을 반영했습니다. 실제 접수는 차단됩니다.' : '초안을 반영하는 중입니다.')}
    </p>
    <div className="site-editor__preview-scroll" ref={holder}>
      <div className="site-editor__preview-stage" style={{ width: viewport.width * scale, height: viewport.height * scale }}>
        {allowedUrl ? <iframe ref={frame} className="site-editor__frame" title={`${label} 초안 · ${viewport.label} ${viewport.width}px 미리보기`} src={url.pathname + url.search + url.hash} onError={() => setFailure('미리보기를 불러오지 못했습니다. 새로고침해 주세요.')} style={{ width: viewport.width, height: viewport.height, transform: `scale(${scale})` }} /> : <p role="alert">허용된 홈페이지 경로만 미리볼 수 있습니다.</p>}
      </div>
    </div>
    </EditorWorkSurface>
  </>
}

export function EditorPreview({ page, label, path, device, documents, copyDefinitions = siteCopyDefinitions, storageScope = 'original', loadingPath = false, onDeviceChange, locked, ...canvasOptions }: Props) {
  const [fit, setFit] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [open, setOpen] = useState(true)
  const [source, setSource] = useState<'published' | 'draft'>('draft')
  const publishedHolder = useRef<HTMLDivElement>(null)
  const [publishedWidth, setPublishedWidth] = useState(0)
  useEffect(() => {
    const node = publishedHolder.current
    if (!node) return
    const measure = () => setPublishedWidth(node.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [source, open])
  const viewport = editorViewports.find((item) => item.id === device) ?? editorViewports[0]
  const publishedScale = getEditorPreviewScale(device, publishedWidth, fit)
  const languageLabel = storageScope === 'sample-english' ? '영어' : '한국어'
  return <section className="site-editor__preview" aria-label="실제 화면 미리보기">
    <div className="site-editor__section-heading"><h2>{languageLabel} 홈페이지 화면</h2><Button size="sm" variant="ghost" disabled={locked} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? '접기' : '펼치기'}</Button></div>
    <div className="site-editor__preview-tools" role="group" aria-label="표시할 페이지">
      <button type="button" disabled={locked} aria-pressed={source === 'published'} onClick={() => setSource('published')}>{languageLabel} 공개 페이지</button>
      <button type="button" disabled={locked} aria-pressed={source === 'draft'} onClick={() => setSource('draft')}>{languageLabel} 초안 편집·미리보기</button>
    </div>
    <p className="site-editor__help" role="status">{source === 'published' ? '지금 방문자에게 보이는 게시본입니다. 수정하려면 초안 편집·미리보기를 선택하세요.' : '현재 초안입니다. 임시저장만으로는 공개 페이지가 바뀌지 않습니다.'}</p>
    <div hidden={!open}>
      <div className="site-editor__preview-tools" role="group" aria-label="미리보기 크기">{editorViewports.map((viewport) => <button key={viewport.id} type="button" disabled={locked} aria-pressed={device === viewport.id} onClick={() => onDeviceChange(viewport.id)}>{viewport.label} {viewport.width}</button>)}</div>
      <div className="site-editor__preview-tools" role="group" aria-label="미리보기 표시"><button type="button" disabled={locked} aria-pressed={fit} onClick={() => setFit(true)}>화면에 맞춤</button><button type="button" disabled={locked} aria-pressed={!fit} onClick={() => setFit(false)}>실제 크기</button><button type="button" disabled={locked} onClick={() => setRefresh((value) => value + 1)}>새로고침</button></div>
      {loadingPath ? <p role="status">미리볼 공개 항목을 찾는 중입니다.</p> : path ? source === 'draft'
        ? <PreviewFrame key={`${storageScope}-${page}-${path}-${refresh}`} page={page} label={label} path={path} device={device} documents={documents} copyDefinitions={copyDefinitions} storageScope={storageScope} fit={fit} locked={locked} {...canvasOptions} />
        : <div className="site-editor__preview-scroll" ref={publishedHolder}><div className="site-editor__preview-stage" style={{ width: viewport.width * publishedScale, height: viewport.height * publishedScale }}><iframe key={`${path}-${refresh}`} className="site-editor__frame" title={`${label} 현재 공개 페이지 · ${viewport.label}`} src={path} sandbox="allow-same-origin allow-scripts" style={{ width: viewport.width, height: viewport.height, transform: `scale(${publishedScale})` }} /></div></div>
        : <p className="site-editor__empty">{storageScope === 'sample-english' ? '영문 화면에 사용할 공개 항목이 없습니다.' : '미리볼 공개 항목이 없습니다. 연결된 콘텐츠 관리에서 항목을 등록하고 공개한 뒤 다시 열어 주세요.'}</p>}
    </div>
  </section>
}
