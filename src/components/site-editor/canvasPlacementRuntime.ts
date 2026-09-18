import type { EditorDevice, EditorPageId, EditorTextLayout } from '../../types/siteEditor'
import { getTextLayoutDefinition } from '../../content/textLayoutCatalog'
import { canonicalTextLayout, isEditorTextLayout } from '../../lib/siteEditorLayout'
import { acceptPlacementMessage, parsePlacementMessage, PLACEMENT_PROTOCOL_CHANNEL, PLACEMENT_PROTOCOL_VERSION, type PlacementBlock, type PlacementEnvelope, type PlacementFrameMessage, type PlacementGrant, type PlacementRect } from '../../lib/siteEditorPlacementProtocol'

const same = (a: EditorTextLayout, b: EditorTextLayout) => JSON.stringify(canonicalTextLayout(a)) === JSON.stringify(canonicalTextLayout(b))
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)))
/** Frame CSS coordinates only; neighbours are explicit same-group registry entries. */
export function constrainPlacement(block: PlacementBlock, dx: number, dy: number, peers: readonly PlacementBlock[]): EditorTextLayout {
  const snap = (delta: number, axis: 'left' | 'top', size: 'width' | 'height') => {
    const centre = block.rect[axis] + block.rect[size] / 2 + delta
    const distance = peers.filter(peer => peer.id !== block.id && peer.group === block.group)
      .map(peer => peer.rect[axis] + peer.rect[size] / 2 - centre).filter(value => Math.abs(value) <= 6).sort((a, b) => Math.abs(a) - Math.abs(b))[0]
    return delta + (distance ?? 0)
  }
  const x = clamp(snap(dx, 'left', 'width'), block.bounds.left - block.rect.left, block.bounds.left + block.bounds.width - block.rect.left - block.rect.width)
  const y = clamp(snap(dy, 'top', 'height'), block.bounds.top - block.rect.top, block.bounds.top + block.bounds.height - block.rect.top - block.rect.height)
  return { ...block.value, offsetX: clamp(Math.round(((block.value.offsetX ?? 0) + x) * 10) / 10, -2000, 2000), offsetY: clamp(Math.round(((block.value.offsetY ?? 0) + y) * 10) / 10, -2000, 2000) }
}
type Payload = PlacementFrameMessage extends infer T ? T extends PlacementFrameMessage ? Omit<T, keyof PlacementEnvelope> : never : never
type Entry = { element: HTMLElement; block: PlacementBlock }
type Gesture = { entry: Entry; renderedBase: EditorTextLayout; requestId: string; pointerId: number | null; x: number; y: number; scrollX: number; scrollY: number; dx: number; dy: number; ended: boolean; cancelled: boolean; sequence: number }
type Active = Gesture & { grant: PlacementGrant; originalTranslate: string; restored: boolean; ownsFreeze: boolean; value: EditorTextLayout; operation: string | null; resume: number | null }
type Config = { nonce: string; page: EditorPageId; getAppliedSequence: () => number; freeze: (active: boolean) => void }
const box = (value: DOMRect): PlacementRect => ({ left: value.left, top: value.top, width: value.width, height: value.height })
function readRenderedOffsets(element: HTMLElement, stored: EditorTextLayout): PlacementBlock['renderedOffsets'] | null {
  const raw = element.style.translate.trim()
  if (!raw) return { x: stored.offsetX ?? 0, y: stored.offsetY ?? 0 }
  const match = /^(-?(?:\d+(?:\.\d+)?|\.\d+))px(?:\s+(-?(?:\d+(?:\.\d+)?|\.\d+))px)?$/.exec(raw)
  if (!match) return null
  const x = Number(match[1]), y = Number(match[2] ?? 0)
  return isEditorTextLayout({ offsetX: x, offsetY: y }) ? { x, y } : null
}

/** Only explicit native layout markers can enter this preview-only registry. */
export function createCanvasPlacementRuntime(config: Config) {
  let entries = new Map<string, Entry>(), selected: string | null = null, mode = false, device: EditorDevice = 'desktop'
  let pending: Gesture | null = null, active: Active | null = null, mounted = false, sent = 0, received = 0, retryTimer = 0, beginTimer = 0
  let geometryFrame = 0, registration = '', resizeObserver: ResizeObserver | null = null, mutationObserver: MutationObserver | null = null
  const observed = new Set<Element>()
  let handle: HTMLButtonElement | null = null, outline: HTMLDivElement | null = null, status: HTMLDivElement | null = null
  const guides: Partial<Record<'x' | 'y', HTMLDivElement>> = {}
  const hideGuides = () => { Object.values(guides).forEach(guide => { guide.hidden = true }) }
  let lastCommit: Payload | null = null
  const blocked = () => document.body.dataset.canvasEditMode === 'true' || Boolean(document.querySelector('.canvas-editor-overlay'))
  const send = (payload: Payload) => {
    const message = { ...payload, channel: PLACEMENT_PROTOCOL_CHANNEL, version: PLACEMENT_PROTOCOL_VERSION, nonce: config.nonce, previewPage: config.page, sequence: ++sent }
    if (parsePlacementMessage(message)) window.parent.postMessage(message, window.location.origin)
  }
  const say = (message: string) => {
    if (!status) { status = document.createElement('div'); status.className = 'canvas-editor-status'; status.setAttribute('role', 'status'); document.body.append(status) }
    status.textContent = message; status.hidden = !message
  }
  const selection = () => send({ type: 'placement-selection', id: selected, editId: active?.grant.editId ?? null })
  const queueGeometry = () => {
    if (!mounted || geometryFrame) return
    geometryFrame = window.requestAnimationFrame(() => { geometryFrame = 0; refreshRegistry() })
  }
  const observeGeometry = (next: Set<Element>) => {
    for (const element of observed) if (!next.has(element)) { resizeObserver?.unobserve(element); observed.delete(element) }
    for (const element of next) if (!observed.has(element)) { resizeObserver?.observe(element); observed.add(element) }
  }
  const position = () => {
    const entry = active?.entry ?? (selected ? entries.get(selected) : null)
    const visible = mode && entry?.element.isConnected
    if (handle) handle.hidden = !visible
    if (outline) outline.hidden = !visible
    if (!visible || !entry) { hideGuides(); return }
    const rect = entry.element.getBoundingClientRect()
    if (!outline) { outline = document.createElement('div'); outline.className = 'canvas-editor-outline'; document.body.append(outline) }
    Object.assign(outline.style, { left: `${rect.left + window.scrollX}px`, top: `${rect.top + window.scrollY}px`, width: `${rect.width}px`, height: `${Math.max(1, rect.height)}px` })
    if (!handle) {
      handle = document.createElement('button'); handle.type = 'button'; handle.textContent = '↕ 이동'; handle.setAttribute('data-placement-handle', 'true'); handle.setAttribute('aria-label', '문구 상자 이동: 드래그 또는 방향키, Shift는 10px')
      Object.assign(handle.style, { position: 'absolute', zIndex: '2147483002', minWidth: '64px', minHeight: '44px', touchAction: 'none', background: '#68233a', color: '#fff', border: '1px solid #fff', borderRadius: '4px', cursor: 'move', font: '14px system-ui' })
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.isPrimary === false) return
        event.preventDefault(); event.stopImmediatePropagation()
        handle?.focus({ preventScroll: true })
        handle?.setPointerCapture?.(event.pointerId)
        begin(event.pointerId, event.clientX, event.clientY, 0, 0, false)
      })
      document.body.append(handle)
    }
    Object.assign(handle.style, { left: `${Math.max(0, rect.left + window.scrollX)}px`, top: `${Math.max(window.scrollY, rect.top + window.scrollY - 44)}px` })
  }
  const refreshRegistry = () => {
    if (!mounted || active || pending) return
    const found = new Map<string, Entry>(), duplicates = new Set<string>(), nextObserved = new Set<Element>()
    for (const element of document.querySelectorAll<HTMLElement>('[data-site-layout]')) {
      const id = element.getAttribute('data-site-layout') ?? '', definition = getTextLayoutDefinition(id)
      if (!definition || definition.page !== config.page || !element.isConnected || element.getAttribute('data-site-layout-group') !== definition.group) continue
      let value: unknown
      try { const raw = element.getAttribute('data-site-layout-value') ?? '{}'; if (raw.length > 1000) continue; value = JSON.parse(raw) } catch { continue }
      if (!isEditorTextLayout(value)) continue
      const renderedOffsets = readRenderedOffsets(element, value)
      if (!renderedOffsets) continue
      nextObserved.add(element)
      if (element.parentElement) nextObserved.add(element.parentElement)
      const section = element.closest('section, main')
      if (section) nextObserved.add(section)
      const rect = box(element.getBoundingClientRect())
      if (rect.width <= 0 || rect.height <= 0) continue
      if (found.has(id)) { duplicates.add(id); continue }
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      const sectionBox = section ? section.getBoundingClientRect() : { left: 0, width: viewportWidth, top: -window.scrollY, height: document.documentElement.scrollHeight }
      const left = Math.max(0, sectionBox.left), right = Math.min(viewportWidth, sectionBox.left + sectionBox.width)
      const block: PlacementBlock = { id, label: definition.label, group: definition.group, value: canonicalTextLayout(value), rect, renderedOffsets,
        bounds: { left, top: sectionBox.top, width: Math.max(0, right - left), height: sectionBox.height } }
      if (rect.width > 0 && rect.height > 0) found.set(id, { element, block })
    }
    for (const id of duplicates) found.delete(id)
    entries = found
    observeGeometry(nextObserved)
    if (selected && !entries.has(selected)) selected = null
    if (config.getAppliedSequence()) {
      const payload = { type: 'placement-register' as const, appliedDraftSequence: config.getAppliedSequence(), blocks: [...entries.values()].map(entry => entry.block).slice(0, 500) }
      const signature = JSON.stringify(payload)
      if (signature !== registration) { registration = signature; send(payload) }
    }
    selection(); position()
  }
  const close = () => {
    if (!active) return
    hideGuides()
    if (!active.restored) active.entry.element.style.translate = active.originalTranslate
    const ownsFreeze = active.ownsFreeze
    active = null; lastCommit = null; window.clearTimeout(retryTimer); window.clearTimeout(beginTimer); delete document.body.dataset.canvasPlacementActive
    if (ownsFreeze) config.freeze(false)
    selection(); refreshRegistry()
  }
  const finish = (cancel = false) => {
    if (!active || active.operation) return
    hideGuides()
    cancel ||= same(active.value, active.grant.before)
    if (cancel) active.entry.element.style.translate = active.originalTranslate
    active.operation = crypto.randomUUID()
    lastCommit = cancel ? { type: 'placement-commit', editId: active.grant.editId, operationId: active.operation, outcome: 'cancel' }
      : { type: 'placement-commit', editId: active.grant.editId, operationId: active.operation, baseDraftSequence: active.grant.baseDraftSequence, outcome: 'apply', value: active.value }
    send(lastCommit)
    let retries = 0
    const retry = () => {
      if (!active || !lastCommit || active.resume !== null) return
      if (retries++ < 3) { send(lastCommit); retryTimer = window.setTimeout(retry, 6000) }
      else {
        say('위치 반영 확인이 지연됩니다. 현재 위치를 유지합니다.')
        const button = document.createElement('button'); button.type = 'button'; button.textContent = '다시 확인'; button.style.minHeight = '44px'
        button.addEventListener('click', () => { retries = 0; retry(); button.remove() }); status?.append(button)
      }
    }
    retryTimer = window.setTimeout(retry, 6000); position()
  }
  const move = () => {
    if (!active || active.operation) return
    hideGuides()
    if (active.dx === 0 && active.dy === 0) {
      active.value = active.grant.before; active.entry.element.style.translate = active.originalTranslate; position(); return
    }
    active.value = constrainPlacement({ ...active.entry.block, value: active.renderedBase }, active.dx, active.dy, active.pointerId === null ? [] : [...entries.values()].map(entry => entry.block))
    active.entry.element.style.translate = `${active.value.offsetX ?? 0}px ${active.value.offsetY ?? 0}px`
    if (active.pointerId !== null) {
      const moved = { ...active.entry.block.rect, left: active.entry.block.rect.left + (active.value.offsetX ?? 0) - (active.renderedBase.offsetX ?? 0),
        top: active.entry.block.rect.top + (active.value.offsetY ?? 0) - (active.renderedBase.offsetY ?? 0) }
      for (const axis of ['x', 'y'] as const) {
        const positionKey = axis === 'x' ? 'left' : 'top', size = axis === 'x' ? 'width' : 'height'
        const centre = moved[positionKey] + moved[size] / 2
        const peer = [...entries.values()].map(entry => entry.block).find(entry => entry.id !== active!.entry.block.id && entry.group === active!.entry.block.group && Math.abs(entry.rect[positionKey] + entry.rect[size] / 2 - centre) < 0.1)
        if (!peer) continue
        const guide = guides[axis] ?? document.createElement('div'); guides[axis] = guide
        guide.setAttribute('data-placement-guide', axis); guide.setAttribute('aria-hidden', 'true'); guide.hidden = false
        const left = Math.min(moved.left, peer.rect.left), top = Math.min(moved.top, peer.rect.top)
        Object.assign(guide.style, { position: 'absolute', zIndex: '2147483001', pointerEvents: 'none',
          left: `${(axis === 'x' ? centre : left) + active.scrollX}px`, top: `${(axis === 'y' ? centre : top) + active.scrollY}px`,
          width: axis === 'x' ? '0' : `${Math.max(moved.left + moved.width, peer.rect.left + peer.rect.width) - left}px`,
          height: axis === 'y' ? '0' : `${Math.max(moved.top + moved.height, peer.rect.top + peer.rect.height) - top}px`,
          borderLeft: axis === 'x' ? '1px dashed #68233a' : '0', borderTop: axis === 'y' ? '1px dashed #68233a' : '0' })
        if (!guide.isConnected) document.body.append(guide)
      }
    }
    position()
  }
  function begin(pointerId: number | null, x: number, y: number, dx: number, dy: number, ended: boolean) {
    if (!mode || blocked() || active || pending || !selected || !config.getAppliedSequence()) return
    refreshRegistry()
    const entry = entries.get(selected)
    if (!entry) return
    const rendered = entry.block.renderedOffsets
    const renderedBase = { ...entry.block.value, offsetX: rendered?.x ?? entry.block.value.offsetX ?? 0, offsetY: rendered?.y ?? entry.block.value.offsetY ?? 0 }
    pending = { entry, renderedBase, requestId: crypto.randomUUID(), pointerId, x, y, scrollX: window.scrollX, scrollY: window.scrollY, dx, dy, ended, cancelled: false, sequence: config.getAppliedSequence() }
    const request = pending
    let retries = 0
    const retry = () => {
      if (pending?.requestId !== request.requestId || pending.cancelled) return
      send({ type: 'placement-begin', requestId: request.requestId, id: request.entry.block.id, appliedDraftSequence: request.sequence })
      if (retries++ < 3) beginTimer = window.setTimeout(retry, 6000)
      else {
        say('이동 권한 확인이 지연됩니다. 다시 확인하거나 Esc로 취소해 주세요.')
        const button = document.createElement('button'); button.type = 'button'; button.textContent = '다시 확인'; button.style.minHeight = '44px'
        button.addEventListener('click', () => { retries = 0; retry(); button.remove() }); status?.append(button)
      }
    }
    retry()
  }
  const abortPending = () => {
    if (!pending) return
    pending.cancelled = true; pending.ended = true; window.clearTimeout(beginTimer)
    const requestId = pending.requestId
    const retry = () => {
      const gesture = active ?? pending
      if (!gesture?.cancelled || gesture.requestId !== requestId) return
      send({ type: 'placement-abort', requestId }); beginTimer = window.setTimeout(retry, 6000)
    }
    retry(); say('이동 시작 요청을 취소하는 중입니다. 원래 위치는 그대로입니다.')
  }
  const receive = (event: MessageEvent) => {
    const message = acceptPlacementMessage(event, { origin: window.location.origin, source: window.parent, nonce: config.nonce, previewPage: config.page, lastSequence: received, direction: 'parent-to-frame' })
    if (!message) return
    received = message.sequence
    if (message.type === 'placement-mode') {
      if (active || pending || (message.mode === 'place' && blocked())) { send({ type: 'placement-mode-result', operationId: message.operationId, accepted: false, reason: 'busy' }); return }
      mode = message.mode === 'place'; device = message.device; document.body.dataset.canvasPlacementMode = String(mode)
      send({ type: 'placement-mode-result', operationId: message.operationId, accepted: true }); refreshRegistry()
    } else if (message.type === 'placement-select' && !active && !pending && mode) {
      selected = message.id && entries.has(message.id) ? message.id : null; selection(); position()
    } else if (message.type === 'placement-grant' && pending?.requestId === message.requestId) {
      window.clearTimeout(beginTimer)
      const gesture = pending; pending = null
      if (!message.accepted) { say('현재 위치를 확인하지 못했습니다. 초안을 갱신하고 다시 선택해 주세요.'); return }
      const ownsFreeze = !blocked() && gesture.entry.element.isConnected && message.grant.id === gesture.entry.block.id && message.grant.device === device
        && message.grant.baseDraftSequence === gesture.sequence && same(message.grant.before, gesture.entry.block.value) && !gesture.cancelled
      active = { ...gesture, grant: message.grant, originalTranslate: gesture.entry.element.style.translate, restored: false, ownsFreeze, value: message.grant.before, operation: null, resume: null }
      if (ownsFreeze) { document.body.dataset.canvasPlacementActive = 'true'; config.freeze(true) }
      selection()
      if (!ownsFreeze) { finish(true); return }
      move(); if (gesture.ended) finish()
    } else if (message.type === 'placement-aborted') {
      if (pending?.requestId === message.requestId && pending.cancelled) { window.clearTimeout(beginTimer); pending = null; say('이동을 취소했습니다.'); refreshRegistry() }
      else if (active?.requestId === message.requestId && active.cancelled) { say('이동을 취소했습니다.'); close() }
    } else if (message.type === 'placement-result' && active?.grant.editId === message.editId && active.operation === message.operationId) {
      window.clearTimeout(retryTimer)
      if (message.status === 'rejected') { say('다른 변경으로 위치를 반영하지 않았습니다. 원래 위치로 돌아갑니다.'); close() }
      else {
        active.resume = message.resumeDraftSequence
        // Remove the transient override before React applies the queued draft.
        // close() must not then overwrite that newly rendered persisted value.
        active.entry.element.style.translate = active.originalTranslate; active.restored = true
        if (active.ownsFreeze) { active.ownsFreeze = false; config.freeze(false) }
        if (active && config.getAppliedSequence() >= active.resume!) close()
      }
    }
  }
  const pointer = (event: PointerEvent) => {
    const gesture = active ?? pending
    if (!gesture || gesture.pointerId !== event.pointerId || active?.operation) return
    event.preventDefault()
    gesture.dx = event.clientX - gesture.x + window.scrollX - gesture.scrollX; gesture.dy = event.clientY - gesture.y + window.scrollY - gesture.scrollY
    if (event.type === 'pointercancel') { gesture.cancelled = true; gesture.ended = true; if (active) finish(true); else abortPending() }
    else if (event.type === 'pointerup') { gesture.ended = true; if (active) { move(); finish() } }
    else move()
  }
  const click = (event: MouseEvent) => {
    if (!mode || blocked() || active || pending || !(event.target instanceof Element)) return
    const element = event.target.closest<HTMLElement>('[data-site-layout]'), id = element?.getAttribute('data-site-layout')
    if (!id || entries.get(id)?.element !== element) return
    event.preventDefault(); event.stopImmediatePropagation(); selected = id; selection(); position()
  }
  const keydown = (event: KeyboardEvent) => {
    if (!mode || event.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape' && (active || pending)) { event.preventDefault(); if (active) finish(true); else abortPending(); return }
    if (event.target !== handle || event.altKey || event.ctrlKey || event.metaKey) return
    const step = event.shiftKey ? 10 : 1, offsets: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const delta = offsets[event.key]
    if (delta) { event.preventDefault(); begin(null, 0, 0, delta[0], delta[1], true) }
  }
  return {
    refreshed() { if (active?.resume !== null && active?.resume !== undefined && config.getAppliedSequence() >= active.resume) close(); else refreshRegistry() },
    deferred(sequence: number) { if (active) send({ type: 'placement-draft-status', editId: active.grant.editId, draftSequence: sequence, status: 'deferred' }) },
    mount() {
      mounted = true; registration = ''
      if (typeof ResizeObserver === 'function') resizeObserver = new ResizeObserver(queueGeometry)
      if (typeof MutationObserver === 'function') {
        const containsLayout = (node: Node) => node instanceof Element && (node.getAttribute('data-site-layout') !== null || Boolean(node.querySelector('[data-site-layout]')))
        mutationObserver = new MutationObserver(records => {
          if (records.some(record => record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].some(containsLayout))) queueGeometry()
        })
        mutationObserver.observe(document.body, { childList: true, subtree: true })
      }
      window.addEventListener('message', receive); document.addEventListener('click', click, true); document.addEventListener('keydown', keydown, true)
      for (const type of ['pointermove', 'pointerup', 'pointercancel']) document.addEventListener(type, pointer as EventListener)
      window.addEventListener('resize', refreshRegistry); window.addEventListener('scroll', position, true); send({ type: 'placement-ready' }); refreshRegistry()
      return () => {
        resizeObserver?.disconnect(); mutationObserver?.disconnect(); resizeObserver = null; mutationObserver = null; observed.clear()
        window.cancelAnimationFrame(geometryFrame); geometryFrame = 0
        mounted = false; window.clearTimeout(retryTimer); window.clearTimeout(beginTimer); window.removeEventListener('message', receive); document.removeEventListener('click', click, true); document.removeEventListener('keydown', keydown, true)
        for (const type of ['pointermove', 'pointerup', 'pointercancel']) document.removeEventListener(type, pointer as EventListener)
        window.removeEventListener('resize', refreshRegistry); window.removeEventListener('scroll', position, true)
        if (active) { if (!active.restored) active.entry.element.style.translate = active.originalTranslate; if (active.ownsFreeze) config.freeze(false) }
        active = null; pending = null; handle?.remove(); outline?.remove(); status?.remove(); Object.values(guides).forEach(guide => guide.remove()); delete document.body.dataset.canvasPlacementMode; delete document.body.dataset.canvasPlacementActive
      }
    },
  }
}
