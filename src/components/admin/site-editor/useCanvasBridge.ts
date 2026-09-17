import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { acceptCanvasMessage, CANVAS_PROTOCOL_CHANNEL, CANVAS_PROTOCOL_VERSION, parseCanvasMessage, type CanvasAction, type CanvasEnvelope, type CanvasParentMessage, type CanvasSelectionSummary, type CanvasSourcePatch } from '../../../lib/siteEditorCanvasProtocol'
import type { CanvasBlock, CanvasSelection } from '../../../lib/siteEditorCanvasModel'
import type { EditorTextStyle } from '../../../types/siteEditor'
import { SITE_EDITOR_PROTOCOL_VERSION } from '../../../lib/siteEditorPreview'
import { makeCanvasGrant, type CanvasCommitResult, type CanvasGrantContext, type IssuedCanvasGrant } from './editorCanvasController'

export type CanvasBridgeOptions = {
  context: Omit<CanvasGrantContext, 'baseDraftSequence'>
  onCommit: (issued: IssuedCanvasGrant, changes: CanvasSourcePatch[], sequence: number) => CanvasCommitResult
  onActiveChange: (active: boolean) => void
  onSave: () => void
}
type ParentPayload = CanvasParentMessage extends infer T ? T extends CanvasParentMessage ? Omit<T, keyof CanvasEnvelope> : never : never
type Props = CanvasBridgeOptions & { frame: RefObject<HTMLIFrameElement | null>; nonce: string; draftSequence: RefObject<number>; onCommitted: () => void }

export function useCanvasBridge({ context, onCommit, onActiveChange, onSave, frame, nonce, draftSequence, onCommitted }: Props) {
  const [connected, setConnected] = useState(false)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [selection, setSelection] = useState<CanvasSelection | null>(null)
  const [summary, setSummary] = useState<CanvasSelectionSummary | null>(null)
  const [blockLabel, setBlockLabel] = useState<string | null>(null)
  const [choices, setChoices] = useState<Array<{ id: string; label: string }>>([])
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const blocks = useRef(new Map<string, CanvasBlock>())
  const issued = useRef<IssuedCanvasGrant | null>(null)
  const sendSequence = useRef(0), receivedSequence = useRef(0), localRevision = useRef(0)
  const operations = useRef(new Map<string, ParentPayload>())
  const completing = useRef(false)
  const send = useCallback((payload: ParentPayload) => {
    const message = { ...payload, channel: CANVAS_PROTOCOL_CHANNEL, version: CANVAS_PROTOCOL_VERSION, nonce, previewPage: context.previewPage, sequence: ++sendSequence.current }
    if (parseCanvasMessage(message)) frame.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [nonce, context.previewPage, frame])
  useEffect(() => {
    if (connected && !active) send({ type: 'canvas-mode', operationId: crypto.randomUUID(), mode, scope: context.scope, device: context.device })
  }, [connected, active, mode, context.scope, context.device, send])

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!frame.current?.contentWindow) return
      const message = acceptCanvasMessage(event, { origin: window.location.origin, source: frame.current.contentWindow, nonce, previewPage: context.previewPage, lastSequence: receivedSequence.current, direction: 'frame-to-parent' })
      if (!message) return
      receivedSequence.current = message.sequence
      if (message.type === 'canvas-ready') setConnected(true)
      else if (message.type === 'canvas-save' && !issued.current) onSave()
      else if (message.type === 'canvas-register' && message.appliedDraftSequence === draftSequence.current && !issued.current) {
        blocks.current = new Map(message.blocks.map(block => [block.id, block]))
        setChoices(message.blocks.filter(block => block.segments.every(segment => !segment.source || segment.source.ownerPage === context.editorPage)).map(block => ({ id: block.id, label: block.label })))
      } else if (message.type === 'canvas-selection') {
        if (message.editId === null && message.selection === null && completing.current) {
          completing.current = false; issued.current = null; setActive(false); onActiveChange(false); onCommitted()
        }
        if (message.editId !== (issued.current?.grant.editId ?? null)) return
        if (!message.editId && message.selection && !blocks.current.has(message.selection.blockId)) return
        localRevision.current = message.localRevision
        setSelection(message.selection); setSummary(message.summary)
        setBlockLabel(message.selection ? blocks.current.get(message.selection.blockId)?.label ?? '선택한 문구' : null)
      } else if (message.type === 'canvas-editbegin') {
        const block = blocks.current.get(message.blockId)
        if (issued.current || mode !== 'edit' || !block || block.revision !== message.blockRevision || message.appliedDraftSequence !== draftSequence.current) {
          send({ type: 'canvas-editgrant', requestId: message.requestId, accepted: false, reason: 'stale' }); return
        }
        const result = makeCanvasGrant({ ...context, baseDraftSequence: draftSequence.current }, block, { editId: crypto.randomUUID(), fieldVersionFactory: () => crypto.randomUUID() })
        if (!result.ok) { setError(result.message); send({ type: 'canvas-editgrant', requestId: message.requestId, accepted: false, reason: result.reason }); return }
        issued.current = result.issued; operations.current.clear(); setError(null); setActive(true); onActiveChange(true)
        send({ type: 'canvas-editgrant', requestId: message.requestId, accepted: true, grant: result.issued.grant })
      } else if (message.type === 'canvas-commit') {
        const ledger = issued.current
        const prior = operations.current.get(message.operationId)
        if (prior) { send(prior); return }
        if (!ledger || ledger.grant.editId !== message.editId || completing.current) return
        if (message.outcome === 'apply') {
          const result = message.baseDraftSequence === ledger.grant.baseDraftSequence ? onCommit(ledger, message.changes, draftSequence.current)
            : { ok: false as const, reason: 'stale' as const, message: '초안 연결이 변경되었습니다. 입력을 유지하며 다시 확인해 주세요.' }
          if (!result.ok) {
            const reply = { type: 'canvas-command-result', action: 'commit', editId: message.editId, operationId: message.operationId, status: 'rejected', reason: result.reason } as const
            operations.current.set(message.operationId, reply); setError(result.message); send(reply); return
          }
          const nextSequence = ++draftSequence.current
          frame.current.contentWindow.postMessage({ type: 'smyc-editor:draft', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page: context.previewPage, sequence: nextSequence, documents: { ...context.documents, [result.ownerPage]: result.document } }, window.location.origin)
        }
        const reply = { type: 'canvas-command-result', action: 'commit', editId: message.editId, operationId: message.operationId, status: message.outcome === 'cancel' ? 'cancelled' as const : 'committed' as const, resumeDraftSequence: draftSequence.current } as const
        operations.current.set(message.operationId, reply); completing.current = true; send(reply); setError(null)
      } else if (message.type === 'canvas-command-result' && 'accepted' in message && !message.accepted) {
        setError(message.reason === 'composing' ? '한글 입력을 마친 뒤 다시 시도해 주세요.' : '선택 상태가 바뀌었습니다. 글자를 다시 선택한 뒤 시도해 주세요.')
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [context, draftSequence, frame, mode, nonce, onActiveChange, onCommit, onCommitted, onSave, send])
  const begin = () => {
    const block = selection && blocks.current.get(selection.blockId)
    if (block && !active) send({ type: 'canvas-begin', operationId: crypto.randomUUID(), blockId: block.id, blockRevision: block.revision })
  }
  const choose = (id: string) => {
    const block = blocks.current.get(id)
    if (block && !active) send({ type: 'canvas-begin', operationId: crypto.randomUUID(), blockId: block.id, blockRevision: block.revision })
  }
  const format = (patch: EditorTextStyle | null) => {
    if (issued.current && selection) send({ type: 'canvas-format', editId: issued.current.grant.editId, operationId: crypto.randomUUID(), expectedLocalRevision: localRevision.current, selection, patch })
  }
  const action = (value: CanvasAction) => {
    if (issued.current) send({ type: 'canvas-action', editId: issued.current.grant.editId, operationId: crypto.randomUUID(), expectedLocalRevision: localRevision.current, action: value })
  }
  return { connected, mode, setMode, active, error, selection, summary, blockLabel, begin, format, action, choices, choose }
}
