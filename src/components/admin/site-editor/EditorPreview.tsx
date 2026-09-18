import { useCallback, useEffect, useRef, useState } from 'react'
import { isEditorPageId, validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import { SITE_EDITOR_PROTOCOL_VERSION } from '../../../lib/siteEditorPreview'
import { siteCopyDefinitions } from '../../../content/siteCopyCatalog'
import type { EditorDevice, EditorPageId, EditorTextLayout, SiteEditorDocuments } from '../../../types/siteEditor'
import { Button } from '../../common/Button'
import { readEditorPreviewReply } from './editorPreviewModel'
import { editorViewports } from './editorUiOptions'
import { validateEditorCopyFields } from './editorSessionModel'
import { useCanvasBridge, type CanvasBridgeOptions } from './useCanvasBridge'
import { EditorCanvasToolbar } from './EditorCanvasToolbar'
import { usePlacementBridge, type PlacementChangeResult } from './usePlacementBridge'
import { EditorPlacementToolbar } from './EditorPlacementToolbar'
import { alignLayoutToBlock, constrainLayoutInput } from './editorPlacementGeometry'

type Props = {
  page: EditorPageId
  label: string
  path: string | null
  device: EditorDevice
  documents: SiteEditorDocuments
  loadingPath?: boolean
  onDeviceChange: (device: EditorDevice) => void
  onLayoutChange: (id: string, next: EditorTextLayout | undefined, before: EditorTextLayout, device: EditorDevice) => PlacementChangeResult
} & CanvasBridgeOptions & { locked: boolean }

function PreviewFrame({ page, label, path, device, documents, fit, context, onCommit, onActiveChange, onSave, onLayoutChange }: Omit<Props, 'onDeviceChange'> & { path: string; fit: boolean }) {
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
  const forceRefresh = useCallback(() => setReadyCount(value => value + 1), [])
  const canvas = useCanvasBridge({ frame, nonce, draftSequence: sequence, context, onCommit, onActiveChange: setTextActive, onSave, onCommitted: forceRefresh })
  const placementLocked = canvas.active || !context.defaultsTrusted || context.scope === 'shared' || page === 'common'
  const placement = usePlacementBridge({ frame, nonce, draftSequence: sequence, context: { ...context, locked: placementLocked || placementInputDirty }, onChange: onLayoutChange, onActiveChange: setPlacementActive, onCommitted: forceRefresh })
  const [placementError, setPlacementError] = useState('')
  const [placementStatus, setPlacementStatus] = useState('')
  const placementBusy = placement.active || placementLocked || !applied || pending !== applied
  const editing = textActive || placementActive || placementInputDirty
  useEffect(() => { onActiveChange(editing); return () => onActiveChange(false) }, [editing, onActiveChange])
  const overlapping = placement.selected ? placement.blocks.filter(peer => {
    const selected = placement.selected!
    return peer.id !== selected.id && peer.group === selected.group
      && Math.min(peer.rect.left + peer.rect.width, selected.rect.left + selected.rect.width) - Math.max(peer.rect.left, selected.rect.left) > 2
      && Math.min(peer.rect.top + peer.rect.height, selected.rect.top + selected.rect.height) - Math.max(peer.rect.top, selected.rect.top) > 2
  }) : []
  const viewport = editorViewports.find((item) => item.id === device) ?? editorViewports[0]
  const previewPage = page === 'common' ? 'home' : page
  const scale = fit && available > 0 ? Math.min(1, available / viewport.width) : 1
  const url = new URL(path, window.location.origin)
  const allowedUrl = url.origin === window.location.origin && !url.pathname.startsWith('/admin')
  url.searchParams.set('site-editor-preview', nonce)
  const invalidDraft = Object.entries(documents).some(([key, document]) => !isEditorPageId(key) || validateSiteEditorDocument(document) || validateEditorCopyFields(document, siteCopyDefinitions.filter((field) => field.page === key)))

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
      } else if (reply.sequence === sequence.current) {
        setApplied(reply.sequence)
        setFailure(null)
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [nonce, previewPage])

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
      setPlacementStatus(limited ? '화면과 섹션 안에 보이도록 이동 범위를 조절했습니다.' : '배치를 초안에 적용했습니다. 실행 취소로 되돌릴 수 있습니다.')
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
      <button type="button" disabled={editing} aria-pressed={canvas.mode === 'edit' && placement.mode === 'off'} onClick={() => { placement.setMode('off'); canvas.setMode('edit') }}>화면에서 편집</button>
      <button type="button" disabled={placementBusy || !placement.connected} aria-pressed={placement.mode === 'place'} onClick={() => { canvas.setMode('preview'); placement.setMode('place') }}>배치 조정</button>
      <button type="button" disabled={editing} aria-pressed={canvas.mode === 'preview' && placement.mode === 'off'} onClick={() => { placement.setMode('off'); canvas.setMode('preview') }}>둘러보기</button>
    </div>
    {context.scope === 'shared' || page === 'common' ? <p className="site-editor__help">배치 조정은 개별 화면과 모바일·태블릿·데스크톱 중 한 기기를 선택해 사용하세요.</p> : null}
    <div className={`site-editor__editing-surface${placement.mode === 'place' ? ' site-editor__editing-surface--placing' : ''}`}>
    {placement.mode === 'place' ? <EditorPlacementToolbar key={`${page}:${device}`} selected={placement.selected} blocks={placement.blocks} value={placement.selected?.value}
      disabled={placementBusy} onSelect={placement.select} onChange={changeLayout} onAlign={alignLayout}
      onDirtyChange={setPlacementInputDirty}
      onFinish={() => { placement.setMode('off'); canvas.setMode('preview') }} error={placementError || placement.error || undefined}
      status={overlapping.length ? `다음 문구와 박스가 겹칩니다: ${overlapping.map(item => item.label).join(', ')}. 위치를 조절하거나 실행 취소하세요.` : placementStatus} /> : null}
    {canvas.mode === 'edit' ? <EditorCanvasToolbar blockLabel={canvas.blockLabel} selection={canvas.selection} summary={canvas.summary} active={canvas.active} busy={false} onBegin={canvas.begin} onFormat={canvas.format} onAction={canvas.action} /> : null}
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
    </div>
  </>
}

export function EditorPreview({ page, label, path, device, documents, loadingPath = false, onDeviceChange, locked, ...canvasOptions }: Props) {
  const [fit, setFit] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [open, setOpen] = useState(true)
  return <section className="site-editor__preview" aria-label="실제 화면 미리보기">
    <div className="site-editor__section-heading"><h2>홈페이지 화면에서 편집</h2><Button size="sm" variant="ghost" disabled={locked} aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? '접기' : '펼치기'}</Button></div>
    <p className="site-editor__help">이 창은 관리자 초안입니다. 임시저장이나 미리보기는 공개 홈페이지를 바꾸지 않습니다.</p>
    <div hidden={!open}>
      <div className="site-editor__preview-tools" role="group" aria-label="미리보기 크기">{editorViewports.map((viewport) => <button key={viewport.id} type="button" disabled={locked} aria-pressed={device === viewport.id} onClick={() => onDeviceChange(viewport.id)}>{viewport.label} {viewport.width}</button>)}</div>
      <div className="site-editor__preview-tools" role="group" aria-label="미리보기 표시"><button type="button" disabled={locked} aria-pressed={fit} onClick={() => setFit(true)}>화면에 맞춤</button><button type="button" disabled={locked} aria-pressed={!fit} onClick={() => setFit(false)}>실제 크기</button><button type="button" disabled={locked} onClick={() => setRefresh((value) => value + 1)}>새로고침</button></div>
      {loadingPath ? <p role="status">미리볼 공개 항목을 찾는 중입니다.</p> : path ? <PreviewFrame key={`${page}-${path}-${refresh}`} page={page} label={label} path={path} device={device} documents={documents} fit={fit} locked={locked} {...canvasOptions} /> : <p className="site-editor__empty">미리볼 공개 항목이 없습니다. 연결된 콘텐츠 관리에서 항목을 등록하고 공개한 뒤 다시 열어 주세요.</p>}
    </div>
  </section>
}
