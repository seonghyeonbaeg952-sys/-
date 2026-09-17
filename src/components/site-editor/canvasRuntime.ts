import { acceptCanvasMessage, CANVAS_PROTOCOL_CHANNEL, CANVAS_PROTOCOL_VERSION, parseCanvasMessage, type CanvasAction, type CanvasEnvelope, type CanvasFrameMessage, type CanvasParentMessage } from '../../lib/siteEditorCanvasProtocol'
import { isCanvasBlock, type CanvasBlock } from '../../lib/siteEditorCanvasModel'
import { applyCanvasBufferStyle, beginCanvasBufferComposition, createCanvasEditBuffer, endCanvasBufferComposition, getCanvasBufferChanges, getCanvasBufferSummary, moveCanvasBufferHistory, replaceCanvasBufferText, selectCanvasBuffer, type CanvasEditBuffer } from '../../lib/CanvasEditBuffer'
import { captureCanvasSelection, paintCanvasText, readCanvasPlainText, restoreCanvasSelection } from './canvasDom'
import type { EditorDevice, EditorPageId, EditorTextStyle } from '../../types/siteEditor'
import type { CanvasCopyRegistry, CanvasCopyTarget } from './CanvasCopy'
import { getCanvasOverlayBox } from './canvasLayout'

type Payload = CanvasFrameMessage extends infer T ? T extends CanvasFrameMessage ? Omit<T, keyof CanvasEnvelope> : never : never
type Config = { nonce: string; page: EditorPageId; getDraftSequence: () => number; freeze: (active: boolean) => void }
type Active = { target: CanvasCopyTarget; buffer: CanvasEditBuffer; editor: HTMLDivElement; operation: string | null; visibility: string; resumeSequence: number | null }

/** Exists only inside the nonce-bound administrator iframe, never on public pages. */
export function createCanvasRuntime(config: Config) {
  const targets = new Map<string, { target: CanvasCopyTarget; block: CanvasBlock }>()
  const listeners = new Set<() => void>()
  let active: Active | null = null
  let selected: string | null = null
  let pending: { requestId: string; target: CanvasCopyTarget; block: CanvasBlock } | null = null
  let mode = false, scope: 'shared' | EditorDevice = 'desktop', sendSequence = 0, receiveSequence = 0, revision = 0
  let mounted = false, timer = 0, outline: HTMLDivElement | null = null, status: HTMLDivElement | null = null
  let retryTimer = 0, commitPayload: Payload | null = null, beforeSelection: { start: number; end: number } | undefined
  const uid = () => crypto.randomUUID()
  const send = (payload: Payload) => {
    const message = { ...payload, channel: CANVAS_PROTOCOL_CHANNEL, version: CANVAS_PROTOCOL_VERSION, nonce: config.nonce, previewPage: config.page, sequence: ++sendSequence }
    if (parseCanvasMessage(message)) window.parent.postMessage(message, window.location.origin)
  }
  const notify = () => listeners.forEach(listener => listener())
  const say = (text: string) => {
    if (!status) { status = document.createElement('div'); status.className = 'canvas-editor-status'; status.setAttribute('role', 'status'); document.body.append(status) }
    status.textContent = text; status.hidden = !text
  }
  const selection = () => active ? { blockId: active.buffer.block.id, revision: active.buffer.block.revision, ...active.buffer.selection }
    : selected && targets.has(selected) ? { blockId: selected, revision: targets.get(selected)!.block.revision, start: 0, end: targets.get(selected)!.block.visibleText.length } : null
  const emitSelection = () => send({ type: 'canvas-selection', editId: active?.buffer.grant.editId ?? null, localRevision: active?.buffer.localRevision ?? 0, selection: selection(), summary: active ? getCanvasBufferSummary(active.buffer) : null })
  const rect = (node: HTMLElement) => { const range = document.createRange(); range.selectNodeContents(node); return range.getBoundingClientRect() }
  const position = () => {
    const target = active?.target ?? (selected ? targets.get(selected)?.target : null)
    if (!target?.element.isConnected) { if (outline) outline.hidden = true; return }
    const box = rect(target.element)
    if (!outline) { outline = document.createElement('div'); outline.className = 'canvas-editor-outline'; document.body.append(outline) }
    outline.hidden = !mode || Boolean(active) || box.width === 0
    Object.assign(outline.style, { left: `${box.left + window.scrollX}px`, top: `${box.top + window.scrollY}px`, width: `${box.width}px`, height: `${box.height}px` })
    if (active && target.element.parentElement) {
      const parent = target.element.parentElement, parentRect = parent.getBoundingClientRect(), style = getComputedStyle(parent)
      const inset = (property: string) => Number.parseFloat(style.getPropertyValue(property)) || 0
      const entireLine = readCanvasPlainText(parent) === target.text && !['inline', 'contents'].includes(style.display)
      const flow = getCanvasOverlayBox({ ...parentRect.toJSON(), paddingLeft: inset('padding-left'), paddingRight: inset('padding-right'), paddingTop: inset('padding-top'), borderLeft: inset('border-left-width'), borderRight: inset('border-right-width'), borderTop: inset('border-top-width') }, box, entireLine)
      Object.assign(active.editor.style, { left: `${flow.left + window.scrollX}px`, top: `${flow.top + window.scrollY}px`, width: `${flow.width}px`, textAlign: entireLine ? style.textAlign : 'left' })
      if (flow.calibrate && active.editor.textContent) {
        const editorGlyph = rect(active.editor)
        active.editor.style.top = `${flow.top + window.scrollY - (editorGlyph.top - flow.top)}px`
      }
    }
  }
  const registerNow = () => {
    if (!mounted || !mode || active || !config.getDraftSequence()) return
    send({ type: 'canvas-register', appliedDraftSequence: config.getDraftSequence(), blocks: [...targets.values()].filter(entry => entry.target.element.isConnected).map(entry => entry.block).slice(0, 512) })
    emitSelection(); position()
  }
  const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(registerNow, 40) }
  const makeBlock = (target: CanvasCopyTarget): CanvasBlock => ({ id: target.instanceId, label: target.text.slice(0, 100) || '빈 문구', visibleText: target.text, revision: ++revision,
    capabilities: { format: true, replaceText: true }, segments: [{ source: { ownerPage: target.ownerPage, key: target.key, scope, text: target.fullText }, sourceStart: target.offset, sourceEnd: target.offset + target.text.length, visibleStart: 0, visibleEnd: target.text.length, transform: target.fullText === target.text ? 'exact' : 'slice' }] })
  const registry: CanvasCopyRegistry = {
    register(target) {
      const block = makeBlock(target)
      if (isCanvasBlock(block)) targets.set(target.instanceId, { target, block })
      schedule()
      return () => { if (active?.target.instanceId !== target.instanceId) targets.delete(target.instanceId); schedule() }
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener) } },
    getActiveId: () => active?.target.instanceId ?? null,
  }
  const syncSelection = () => {
    if (!active || active.buffer.composing) return
    const current = captureCanvasSelection(active.editor)
    if (!current) return
    const result = selectCanvasBuffer(active.buffer, current)
    if (result.ok) { active.buffer = result.buffer; emitSelection() }
  }
  const paint = () => {
    if (!active) return
    paintCanvasText(active.editor, active.buffer.text, active.buffer.runs)
    active.editor.focus({ preventScroll: true }); restoreCanvasSelection(active.editor, active.buffer.selection); position(); emitSelection()
  }
  const input = () => {
    if (!active || active.operation) return
    const text = readCanvasPlainText(active.editor)
    const current = captureCanvasSelection(active.editor) ?? { start: text.length, end: text.length }
    const result = replaceCanvasBufferText(active.buffer, text, current, active.buffer.composing, beforeSelection)
    beforeSelection = undefined
    if (result.ok) { active.buffer = result.buffer; emitSelection() }
    else { say(result.reason); if (!active.buffer.composing) paint() }
  }
  const close = () => {
    if (!active) return
    const finishedId = active.target.instanceId
    active.target.element.style.visibility = active.visibility
    active.editor.remove(); active = null; selected = null; commitPayload = null; window.clearTimeout(retryTimer)
    config.freeze(false); notify(); say(''); emitSelection()
    selected = finishedId; schedule()
  }
  const finish = (cancel = false) => {
    if (!active || active.buffer.composing || active.operation) return
    const operationId = uid(); active.operation = operationId; active.editor.contentEditable = 'false'
    commitPayload = cancel ? { type: 'canvas-commit', editId: active.buffer.grant.editId, operationId, outcome: 'cancel' }
      : { type: 'canvas-commit', editId: active.buffer.grant.editId, operationId, baseDraftSequence: active.buffer.grant.baseDraftSequence, outcome: 'apply', changes: getCanvasBufferChanges(active.buffer) }
    send(commitPayload)
    let retries = 0
    const retry = () => {
      if (!active?.operation || !commitPayload || active.resumeSequence !== null) return
      if (++retries <= 3) { send(commitPayload); retryTimer = window.setTimeout(retry, 6000); return }
      say('초안 반영 확인이 지연됩니다. 입력을 유지하고 있습니다. 연결 후 다시 확인하세요.')
      const button = document.createElement('button'); button.type = 'button'; button.textContent = '다시 확인'; button.style.minHeight = '44px'
      button.addEventListener('click', () => { retries = 0; retry(); button.remove() }); status?.append(button)
    }
    retryTimer = window.setTimeout(retry, 6000)
    say('편집 내용을 초안에 반영하는 중입니다. 이 창을 닫지 마세요.')
  }
  const format = (patch: EditorTextStyle | null) => {
    if (!active || active.operation) return false
    const result = applyCanvasBufferStyle(active.buffer, active.buffer.selection, patch)
    if (!result.ok) { say(result.reason); return false }
    active.buffer = result.buffer; paint(); return true
  }
  const action = (value: CanvasAction) => {
    if (!active || active.operation || active.buffer.composing) return false
    if (value === 'finish' || value === 'cancel') { finish(value === 'cancel'); return true }
    if (value === 'selectAll') active.buffer = { ...active.buffer, selection: { start: 0, end: active.buffer.text.length } }
    else { const result = moveCanvasBufferHistory(active.buffer, value); if (!result.ok) return false; active.buffer = result.buffer }
    paint(); return true
  }
  const begin = (id: string) => {
    if (!mode || active || pending) return
    const entry = targets.get(id)
    if (!entry?.target.element.isConnected) return
    const box = rect(entry.target.element)
    if (box.top < 72 || box.bottom > window.innerHeight) entry.target.element.parentElement?.scrollIntoView?.({ block: 'center', behavior: 'instant' })
    pending = { ...entry, requestId: uid() }
    send({ type: 'canvas-editbegin', requestId: pending.requestId, blockId: id, blockRevision: entry.block.revision, appliedDraftSequence: config.getDraftSequence() })
  }
  const activate = (message: Extract<CanvasParentMessage, { type: 'canvas-editgrant' }>) => {
    if (!pending || message.requestId !== pending.requestId) return
    const entry = pending; pending = null
    if (!message.accepted) { say('이 문구는 현재 범위에서 바로 편집할 수 없습니다. 문구 목록 또는 연결된 콘텐츠 관리를 이용해 주세요.'); return }
    const result = createCanvasEditBuffer(entry.block, message.grant)
    if (!result.ok || !entry.target.element.isConnected) { say(result.ok ? '문구를 다시 선택해 주세요.' : result.reason); return }
    const editor = document.createElement('div')
    editor.className = 'canvas-editor-overlay'; editor.contentEditable = 'plaintext-only'; editor.setAttribute('role', 'textbox'); editor.setAttribute('aria-label', `${entry.block.label} 편집`); editor.setAttribute('aria-multiline', 'true'); editor.spellcheck = false
    const computed = getComputedStyle(entry.target.element)
    for (const key of ['font-family', 'font-size', 'font-weight', 'font-style', 'font-kerning', 'font-feature-settings', 'font-variation-settings', 'font-variant', 'line-height', 'letter-spacing', 'word-spacing', 'word-break', 'overflow-wrap', 'white-space', 'text-wrap', 'text-indent', 'text-transform', 'color', 'text-align']) editor.style.setProperty(key, computed.getPropertyValue(key))
    active = { target: entry.target, buffer: result.buffer, editor, operation: null, visibility: entry.target.element.style.visibility, resumeSequence: null }
    config.freeze(true); notify(); entry.target.element.style.visibility = 'hidden'; document.body.append(editor)
    editor.addEventListener('input', input)
    editor.addEventListener('compositionstart', () => { if (active && !active.operation) { syncSelection(); active.buffer = beginCanvasBufferComposition(active.buffer); emitSelection() } })
    editor.addEventListener('compositionend', () => { if (active && !active.operation) { input(); active.buffer = endCanvasBufferComposition(active.buffer); paint() } })
    editor.addEventListener('paste', event => {
      event.preventDefault(); if (!active || active.operation || active.buffer.composing) return
      syncSelection()
      const { start, end } = active.buffer.selection, text = event.clipboardData?.getData('text/plain') ?? ''
      const result = replaceCanvasBufferText(active.buffer, active.buffer.text.slice(0, start) + text + active.buffer.text.slice(end), { start: start + text.length, end: start + text.length }, false, { start, end })
      if (result.ok) { active.buffer = result.buffer; paint() } else say(result.reason)
    })
    editor.addEventListener('drop', event => { event.preventDefault(); say('파일과 서식은 붙여넣지 않습니다. 텍스트를 복사해 붙여넣어 주세요.') })
    editor.addEventListener('beforeinput', event => {
      if (active?.operation) { event.preventDefault(); return }
      beforeSelection = captureCanvasSelection(editor) ?? undefined
      if (event.inputType === 'historyUndo' || event.inputType === 'historyRedo') { event.preventDefault(); action(event.inputType === 'historyUndo' ? 'undo' : 'redo') }
    })
    paint(); say('글자를 선택해 서식을 바꾸세요. Esc는 입력을 유지하고 편집을 마칩니다.')
  }
  const receive = (event: MessageEvent) => {
    const message = acceptCanvasMessage(event, { origin: window.location.origin, source: window.parent, nonce: config.nonce, previewPage: config.page, lastSequence: receiveSequence, direction: 'parent-to-frame' })
    if (!message) return
    receiveSequence = message.sequence
    if (message.type === 'canvas-mode') {
      if (active || pending) { send({ type: 'canvas-command-result', action: 'mode', operationId: message.operationId, accepted: false, reason: 'busy' }); return }
      mode = message.mode === 'edit'; scope = message.scope; document.body.dataset.canvasEditMode = String(mode)
      for (const entry of targets.values()) entry.block = makeBlock(entry.target)
      send({ type: 'canvas-command-result', action: 'mode', operationId: message.operationId, accepted: true }); registerNow()
    } else if (message.type === 'canvas-begin') {
      const block = targets.get(message.blockId)?.block
      if (block?.revision === message.blockRevision) begin(message.blockId)
    } else if (message.type === 'canvas-editgrant') activate(message)
    else if (message.type === 'canvas-command-result' && message.action === 'commit' && active?.buffer.grant.editId === message.editId && active.operation === message.operationId) {
      window.clearTimeout(retryTimer)
      if (message.status === 'rejected') { active.operation = null; commitPayload = null; active.editor.contentEditable = 'plaintext-only'; say('초안 반영을 확인하지 못했습니다. 입력은 유지됩니다. 다시 마치거나 문구를 복사해 보관하세요.'); emitSelection() }
      else { active.resumeSequence = message.resumeDraftSequence; config.freeze(false); if (config.getDraftSequence() >= message.resumeDraftSequence) close() }
    } else if ((message.type === 'canvas-action' || message.type === 'canvas-format') && active?.buffer.grant.editId === message.editId) {
      const valid = message.expectedLocalRevision === active.buffer.localRevision && !active.buffer.composing && !active.operation
      let accepted = false
      if (valid) {
        if (message.type === 'canvas-format' && message.selection.blockId === active.buffer.block.id && message.selection.revision === active.buffer.block.revision) {
          const result = selectCanvasBuffer(active.buffer, message.selection)
          if (result.ok) { active.buffer = result.buffer; accepted = format(message.patch) }
        } else if (message.type === 'canvas-action') accepted = action(message.action)
      }
      send({ type: 'canvas-command-result', action: message.type === 'canvas-format' ? 'format' : message.action, editId: message.editId, operationId: message.operationId, accepted, localRevision: active.buffer.localRevision, selection: selection(), ...(!accepted ? { reason: active.buffer.composing ? 'composing' as const : 'stale' as const } : {}) })
    }
  }
  const click = (event: MouseEvent) => {
    if (!mode || active?.editor.contains(event.target as Node)) return
    const element = event.target instanceof Element ? event.target : null
    const children = element?.querySelectorAll('[data-canvas-target]')
    const id = element?.closest('[data-canvas-target]')?.getAttribute('data-canvas-target')
      ?? (children?.length === 1 ? children[0].getAttribute('data-canvas-target') : null)
    if (!id || !targets.has(id)) return
    event.preventDefault(); event.stopImmediatePropagation()
    if (active) { say('현재 문구의 편집을 먼저 마쳐 주세요.'); return }
    selected = id; emitSelection(); position(); if (event.detail >= 2) begin(id)
  }
  const keydown = (event: KeyboardEvent) => {
    if (!mode || event.isComposing || active?.buffer.composing || event.keyCode === 229) return
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's') {
      event.preventDefault(); event.stopImmediatePropagation()
      if (active) say('편집 마침 또는 Esc를 누른 뒤 Ctrl+S로 임시저장하세요. 공개 홈페이지에는 게시하지 않습니다.')
      else send({ type: 'canvas-save' })
      return
    }
    if (!active) { if (event.key === 'F2' && selected) { event.preventDefault(); begin(selected) } return }
    if (event.key === 'Escape' || event.key === 'F2') { event.preventDefault(); event.stopImmediatePropagation(); finish(); return }
    if (!(event.ctrlKey || event.metaKey)) return
    const key = event.key.toLowerCase()
    if (['b', 'i', 'u', 'z', 'y'].includes(key)) {
      event.preventDefault(); event.stopImmediatePropagation(); syncSelection()
      const style = getCanvasBufferSummary(active.buffer).style
      if (key === 'b') format({ fontWeight: style.fontWeight === 700 ? 400 : 700 })
      else if (key === 'i') format({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })
      else if (key === 'u') format({ textDecoration: style.textDecoration === 'underline' ? 'none' : 'underline' })
      else action(key === 'y' || event.shiftKey ? 'redo' : 'undo')
    }
  }
  return {
    registry,
    deferred(sequence: number) { if (active) send({ type: 'canvas-draft-status', editId: active.buffer.grant.editId, draftSequence: sequence, status: 'deferred' }) },
    refreshed() { if (active?.resumeSequence !== null && active?.resumeSequence !== undefined && config.getDraftSequence() >= active.resumeSequence) close(); schedule() },
    mount() {
      mounted = true
      window.addEventListener('message', receive); document.addEventListener('click', click, true); document.addEventListener('keydown', keydown, true); document.addEventListener('selectionchange', syncSelection); window.addEventListener('scroll', position, true); window.addEventListener('resize', position)
      send({ type: 'canvas-ready' })
      return () => {
        mounted = false; window.clearTimeout(timer); window.clearTimeout(retryTimer); window.removeEventListener('message', receive); document.removeEventListener('click', click, true); document.removeEventListener('keydown', keydown, true); document.removeEventListener('selectionchange', syncSelection); window.removeEventListener('scroll', position, true); window.removeEventListener('resize', position)
        if (active) { active.target.element.style.visibility = active.visibility; active.editor.remove() }
        active = null; outline?.remove(); status?.remove(); delete document.body.dataset.canvasEditMode
      }
    },
  }
}
