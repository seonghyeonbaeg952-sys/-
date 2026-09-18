import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { EditorDevice, EditorPageId, EditorTextLayout, SiteEditorDocument, SiteEditorDocuments } from '../../../types/siteEditor'
import { getTextLayoutDefinition } from '../../../content/textLayoutCatalog'
import { canonicalTextLayout, resolveTextLayout } from '../../../lib/siteEditorLayout'
import { validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import { SITE_EDITOR_PROTOCOL_VERSION } from '../../../lib/siteEditorPreview'
import { acceptPlacementMessage, parsePlacementMessage, PLACEMENT_PROTOCOL_CHANNEL, PLACEMENT_PROTOCOL_VERSION, type PlacementBlock, type PlacementEnvelope, type PlacementGrant, type PlacementParentMessage } from '../../../lib/siteEditorPlacementProtocol'

export type PlacementContext = { editorPage: EditorPageId; previewPage: EditorPageId; device: EditorDevice; documents: SiteEditorDocuments; loadedOwners: ReadonlySet<EditorPageId>; locked: boolean }
export type PlacementChangeResult = { ok: true; document: SiteEditorDocument } | { ok: false; message: string }
export type PlacementBridgeOptions = {
  context: PlacementContext
  /** Must CAS `before` inside the current parent session updater, then return the owning document. */
  onChange: (id: string, next: EditorTextLayout, before: EditorTextLayout, device: EditorDevice) => PlacementChangeResult
  onActiveChange: (active: boolean) => void
}
type Props = PlacementBridgeOptions & { frame: RefObject<HTMLIFrameElement | null>; nonce: string; draftSequence: RefObject<number>; onCommitted: () => void }
type Payload = PlacementParentMessage extends infer T ? T extends PlacementParentMessage ? Omit<T, keyof PlacementEnvelope> : never : never
const same = (a: EditorTextLayout, b: EditorTextLayout) => JSON.stringify(canonicalTextLayout(a)) === JSON.stringify(canonicalTextLayout(b))

export function usePlacementBridge({ frame, nonce, draftSequence, context, onChange, onActiveChange, onCommitted }: Props) {
  const [connected, setConnected] = useState(false), [mode, setModeValue] = useState<'off' | 'place'>('off')
  const [active, setActive] = useState(false), [id, setId] = useState<string | null>(null), [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState<PlacementBlock[]>([])
  const registry = useRef(new Map<string, PlacementBlock>())
  const ledger = useRef<{ grant: PlacementGrant; page: EditorPageId; previewPage: EditorPageId; requestId: string } | null>(null)
  const operations = useRef(new Map<string, Payload>()), completing = useRef(false), sendSequence = useRef(0), receivedSequence = useRef(0)
  const send = useCallback((payload: Payload) => {
    const message = { ...payload, channel: PLACEMENT_PROTOCOL_CHANNEL, version: PLACEMENT_PROTOCOL_VERSION, nonce, previewPage: context.previewPage, sequence: ++sendSequence.current }
    if (parsePlacementMessage(message)) frame.current?.contentWindow?.postMessage(message, window.location.origin)
  }, [nonce, context.previewPage, frame])
  const setMode = useCallback((next: 'off' | 'place') => { if (!active && (next === 'off' || !context.locked)) { setModeValue(next); setError(null) } }, [active, context.locked])
  useEffect(() => {
    if (connected && !active) send({ type: 'placement-mode', operationId: crypto.randomUUID(), mode, device: context.device })
  }, [connected, active, mode, context.device, send])
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!frame.current?.contentWindow) return
      const message = acceptPlacementMessage(event, { origin: window.location.origin, source: frame.current.contentWindow, nonce, previewPage: context.previewPage, lastSequence: receivedSequence.current, direction: 'frame-to-parent' })
      if (!message) return
      receivedSequence.current = message.sequence
      if (message.type === 'placement-ready') setConnected(true)
      else if (message.type === 'placement-mode-result' && !message.accepted) { setModeValue('off'); setError('글자 편집을 마친 뒤 상자 배치를 켜 주세요.') }
      else if (message.type === 'placement-register' && message.appliedDraftSequence === draftSequence.current && !ledger.current) {
        const safe = message.blocks.flatMap(block => {
          const definition = getTextLayoutDefinition(block.id)
          return definition?.page === context.editorPage && definition.group === block.group && context.loadedOwners.has(definition.page) && context.documents[definition.page]
            ? [{ ...block, label: definition.label, group: definition.group }] : []
        })
        registry.current = new Map(safe.map(block => [block.id, block])); setRegistered(safe)
      } else if (message.type === 'placement-selection') {
        if (completing.current && message.editId === null) {
          completing.current = false; ledger.current = null; setActive(false); onActiveChange(false); onCommitted()
        }
        if (message.editId !== (ledger.current?.grant.editId ?? null)) return
        if (message.id === null || registry.current.has(message.id)) setId(message.id)
      } else if (message.type === 'placement-begin') {
        const retry = ledger.current
        if (retry?.requestId === message.requestId && retry.grant.id === message.id && retry.grant.baseDraftSequence === message.appliedDraftSequence && !completing.current) {
          send({ type: 'placement-grant', requestId: message.requestId, accepted: true, grant: structuredClone(retry.grant) }); return
        }
        const definition = getTextLayoutDefinition(message.id), block = registry.current.get(message.id)
        const document = definition ? context.documents[definition.page] : undefined
        const before = resolveTextLayout(document, context.device, message.id) ?? {}
        if (mode !== 'place' || context.locked || ledger.current || !definition || definition.page !== context.editorPage
          || !context.loadedOwners.has(definition.page) || !document || !block || message.appliedDraftSequence !== draftSequence.current || !same(before, block.value)) {
          send({ type: 'placement-grant', requestId: message.requestId, accepted: false, reason: 'stale' }); return
        }
        const grant: PlacementGrant = { editId: crypto.randomUUID(), id: message.id, device: context.device, baseDraftSequence: draftSequence.current, before: structuredClone(before) }
        ledger.current = { grant: structuredClone(grant), page: definition.page, previewPage: context.previewPage, requestId: message.requestId }; operations.current.clear()
        setActive(true); onActiveChange(true); setError(null); setId(message.id)
        send({ type: 'placement-grant', requestId: message.requestId, accepted: true, grant })
      } else if (message.type === 'placement-abort') {
        if (ledger.current?.requestId === message.requestId && !completing.current) { ledger.current = null; setActive(false); onActiveChange(false) }
        send({ type: 'placement-aborted', requestId: message.requestId })
      } else if (message.type === 'placement-commit') {
        const prior = operations.current.get(message.operationId)
        if (prior && 'editId' in prior && prior.editId === message.editId) { send(prior); return }
        const issued = ledger.current
        if (!issued || issued.grant.editId !== message.editId || completing.current) return
        const reject = (text: string) => {
          const reply: Payload = { type: 'placement-result', editId: message.editId, operationId: message.operationId, status: 'rejected', reason: 'stale' }
          operations.current.set(message.operationId, reply); completing.current = true; setError(text); send(reply)
        }
        if (message.outcome === 'apply') {
          const current = resolveTextLayout(context.documents[issued.page], issued.grant.device, issued.grant.id) ?? {}
          if (context.locked || context.editorPage !== issued.page || context.previewPage !== issued.previewPage || context.device !== issued.grant.device
            || !context.loadedOwners.has(issued.page) || !context.documents[issued.page] || message.baseDraftSequence !== issued.grant.baseDraftSequence || !same(current, issued.grant.before)) {
            reject('다른 변경으로 위치가 달라졌습니다. 현재 위치를 다시 확인해 주세요.'); return
          }
          let result: PlacementChangeResult
          try { result = onChange(issued.grant.id, canonicalTextLayout(message.value), structuredClone(issued.grant.before), issued.grant.device) }
          catch { reject('위치를 반영하지 못했습니다. 다시 확인해 주세요.'); return }
          if (!result.ok) { reject(result.message); return }
          if (validateSiteEditorDocument(result.document)) { reject('편집 문서 형식을 다시 확인해 주세요.'); return }
          const sequence = ++draftSequence.current
          frame.current.contentWindow.postMessage({ type: 'smyc-editor:draft', version: SITE_EDITOR_PROTOCOL_VERSION, nonce, page: context.previewPage,
            sequence, documents: { ...context.documents, [issued.page]: result.document } }, window.location.origin)
        }
        const reply: Payload = { type: 'placement-result', editId: message.editId, operationId: message.operationId,
          status: message.outcome === 'cancel' ? 'cancelled' : 'committed', resumeDraftSequence: draftSequence.current }
        operations.current.set(message.operationId, reply); completing.current = true; send(reply)
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [context, frame, nonce, draftSequence, mode, onChange, onActiveChange, onCommitted, send])
  const select = (next: string | null) => {
    if (!active && !context.locked && mode === 'place' && (next === null || registry.current.has(next))) send({ type: 'placement-select', id: next })
  }
  const blocks = registered.map(block => ({ ...block, value: resolveTextLayout(context.documents[context.editorPage], context.device, block.id) ?? {} }))
  return { connected, mode, setMode, active, selected: blocks.find(block => block.id === id) ?? null, blocks, error, select }
}
