import type { EditorDevice, EditorPageId, EditorTextLayout } from '../../types/siteEditor'
import { getTextLayoutDefinition } from '../../content/textLayoutCatalog'
import { canonicalTextLayout, isEditorTextLayout, EDITOR_TEXT_WIDTH_MIN, EDITOR_TEXT_WIDTH_MAX } from '../../lib/siteEditorLayout'
import { acceptPlacementMessage, parsePlacementMessage, PLACEMENT_PROTOCOL_CHANNEL, PLACEMENT_PROTOCOL_VERSION, type PlacementBlock, type PlacementEnvelope, type PlacementFrameMessage, type PlacementGrant, type PlacementRect } from '../../lib/siteEditorPlacementProtocol'
import { getCanvasScaleMetrics } from './canvasLayout'
import { getTextBoxWidthBasis } from './textBoxGeometry'
import { isPreviewControlActivation } from './previewInteraction'
import { placementTravelRange } from '../../lib/siteEditorPlacementBounds'

const same = (a: EditorTextLayout, b: EditorTextLayout) => JSON.stringify(canonicalTextLayout(a)) === JSON.stringify(canonicalTextLayout(b))
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, Math.max(min, max)))
/** Frame CSS coordinates only; neighbours are explicit same-group registry entries. */
export function constrainPlacement(block: PlacementBlock, dx: number, dy: number, peers: readonly PlacementBlock[], scale = { x: 1, y: 1 }): EditorTextLayout {
  const snap = (delta: number, axis: 'left' | 'top', size: 'width' | 'height') => {
    const centre = block.rect[axis] + block.rect[size] / 2 + delta
    const distance = peers.filter(peer => peer.id !== block.id && peer.group === block.group)
      .map(peer => peer.rect[axis] + peer.rect[size] / 2 - centre).filter(value => Math.abs(value) <= 6).sort((a, b) => Math.abs(a) - Math.abs(b))[0]
    return delta + (distance ?? 0)
  }
  const horizontal = placementTravelRange(block.rect, block.bounds, 'left', 'width')
  const vertical = placementTravelRange(block.rect, block.bounds, 'top', 'height')
  const x = clamp(snap(dx, 'left', 'width'), horizontal.min, horizontal.max)
  const y = clamp(snap(dy, 'top', 'height'), vertical.min, vertical.max)
  return { ...block.value, offsetX: clamp(Math.round(((block.value.offsetX ?? 0) + x / scale.x) * 10) / 10, -2000, 2000), offsetY: clamp(Math.round(((block.value.offsetY ?? 0) + y / scale.y) * 10) / 10, -2000, 2000) }
}
/** A width drag stays inside the current section/viewport and uses the same percent contract as the toolbar. */
export function constrainPlacementWidth(block: PlacementBlock, delta: number, containerWidth: number): EditorTextLayout {
  if (!Number.isFinite(delta) || !Number.isFinite(containerWidth) || containerWidth <= 0) return block.value
  const available = block.bounds.left + block.bounds.width - block.rect.left
  const pixels = clamp(block.rect.width + delta, containerWidth * EDITOR_TEXT_WIDTH_MIN / 100, available)
  const percent = clamp(pixels / containerWidth * 100, EDITOR_TEXT_WIDTH_MIN, EDITOR_TEXT_WIDTH_MAX)
  const maximum = Math.max(EDITOR_TEXT_WIDTH_MIN, Math.min(EDITOR_TEXT_WIDTH_MAX, available / containerWidth * 100))
  return { ...block.value, width: Math.min(Math.round(percent * 10) / 10, Math.floor(maximum * 10 + 1e-7) / 10) }
}
type Payload = PlacementFrameMessage extends infer T ? T extends PlacementFrameMessage ? Omit<T, keyof PlacementEnvelope> : never : never
type Entry = { element: HTMLElement; block: PlacementBlock }
type ScreenOrigin = { x: number; y: number; scaleX: number; scaleY: number }
type Gesture = { entry: Entry; renderedBase: EditorTextLayout; scale: { x: number; y: number }; requestId: string; pointerId: number | null; kind: 'move' | 'resize'; x: number; y: number; scrollX: number; scrollY: number; ignoreScrollChange: boolean; screenOrigin: ScreenOrigin | null; dx: number; dy: number; ended: boolean; cancelled: boolean; sequence: number; originalTranslate: string; originalWidth: string; originalMaxWidth: string; originalDisplay: string; originalManualWidth: boolean }
type Active = Gesture & { grant: PlacementGrant; restored: boolean; ownsFreeze: boolean; value: EditorTextLayout; operation: string | null; resume: number | null }
type Handoff = { id: string; pointerId: number; kind: Gesture['kind']; x: number; y: number; screenOrigin: ScreenOrigin | null; dx: number; dy: number; ended: boolean; attempts: number }
type Config = { nonce: string; page: EditorPageId; getAppliedSequence: () => number; freeze: (active: boolean) => void; finishTextEdit?: () => boolean }
const box = (value: DOMRect): PlacementRect => ({ left: value.left, top: value.top, width: value.width, height: value.height })
function measuredBox(element: HTMLElement): DOMRect {
  const own = element.getBoundingClientRect()
  if (own.width > 0 && own.height > 0 || typeof document.createRange !== 'function') return own
  const range = document.createRange()
  range.selectNodeContents(element)
  return range.getBoundingClientRect()
}
function placementScale(element: HTMLElement) {
  let node: HTMLElement | null = element
  while (node) {
    const rect = node.getBoundingClientRect()
    if (node.offsetWidth > 0 && node.offsetHeight > 0 && rect.width > 0 && rect.height > 0) {
      return getCanvasScaleMetrics(rect, { width: node.offsetWidth, height: node.offsetHeight })
    }
    node = node.parentElement
  }
  return { x: 1, y: 1 }
}
function pointerScreenOrigin(event: PointerEvent): ScreenOrigin | null {
  if (!Number.isFinite(event.screenX) || !Number.isFinite(event.screenY)) return null
  const frame = window.frameElement as HTMLElement | null
  const rect = frame?.getBoundingClientRect()
  return { x: event.screenX, y: event.screenY,
    scaleX: frame?.offsetWidth && rect?.width ? rect.width / frame.offsetWidth : 1,
    scaleY: frame?.offsetHeight && rect?.height ? rect.height / frame.offsetHeight : 1 }
}
function screenTravel(event: PointerEvent, origin: ScreenOrigin | null) {
  return origin && Number.isFinite(event.screenX) && Number.isFinite(event.screenY)
    ? { x: (event.screenX - origin.x) / origin.scaleX, y: (event.screenY - origin.y) / origin.scaleY } : null
}
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
  let pending: Gesture | null = null, active: Active | null = null, handoff: Handoff | null = null, mounted = false, sent = 0, received = 0, retryTimer = 0, beginTimer = 0
  let directDrag: { pointerId: number; x: number; y: number; screenOrigin: ScreenOrigin | null } | null = null
  let suppressDragClick = false
  let geometryFrame = 0, registration = '', resizeObserver: ResizeObserver | null = null, mutationObserver: MutationObserver | null = null
  const observed = new Set<Element>()
  let handle: HTMLButtonElement | null = null, resizeHandle: HTMLButtonElement | null = null, outline: HTMLDivElement | null = null, status: HTMLDivElement | null = null
  const guides: Partial<Record<'x' | 'y', HTMLDivElement>> = {}
  const hideGuides = () => { Object.values(guides).forEach(guide => { guide.hidden = true }) }
  let lastCommit: Payload | null = null
  const blocked = () => document.body.dataset.canvasEditPending === 'true' || Boolean(document.querySelector('.canvas-editor-overlay'))
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
    if (resizeHandle) resizeHandle.hidden = !visible
    if (outline) outline.hidden = !visible
    if (!visible || !entry) { hideGuides(); return }
    const rect = measuredBox(entry.element)
    if (!outline) {
      outline = document.createElement('div'); outline.className = 'canvas-editor-outline'; outline.setAttribute('data-placement-outline', 'true')
      outline.setAttribute('aria-label', '선택한 문구 상자 이동'); outline.setAttribute('role', 'button'); outline.tabIndex = 0
      Object.assign(outline.style, { pointerEvents: 'auto', cursor: 'move', touchAction: 'none' })
      outline.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.isPrimary === false) return
        event.preventDefault(); event.stopImmediatePropagation(); outline?.focus({ preventScroll: true })
        outline?.setPointerCapture?.(event.pointerId); begin(event.pointerId, event.clientX, event.clientY, 0, 0, false, 'move', false, pointerScreenOrigin(event))
      })
      document.body.append(outline)
    }
    outline.style.pointerEvents = document.body.dataset.canvasEditMode === 'true' ? 'none' : 'auto'
    Object.assign(outline.style, { left: `${rect.left + window.scrollX}px`, top: `${rect.top + window.scrollY}px`, width: `${rect.width}px`, height: `${Math.max(1, rect.height)}px` })
    if (!handle) {
      handle = document.createElement('button'); handle.type = 'button'; handle.textContent = '↕ 이동'; handle.setAttribute('data-placement-handle', 'true'); handle.setAttribute('aria-label', '문구 상자 이동: 드래그 또는 방향키, Shift는 10px')
      Object.assign(handle.style, { position: 'absolute', zIndex: '2147483002', minWidth: '64px', minHeight: '44px', touchAction: 'none', background: '#68233a', color: '#fff', border: '1px solid #fff', borderRadius: '4px', cursor: 'move', font: '14px system-ui' })
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.isPrimary === false) return
        event.preventDefault(); event.stopImmediatePropagation()
        handle?.focus({ preventScroll: true })
        handle?.setPointerCapture?.(event.pointerId)
        begin(event.pointerId, event.clientX, event.clientY, 0, 0, false, 'move', false, pointerScreenOrigin(event))
      })
      document.body.append(handle)
    }
    if (!resizeHandle) {
      resizeHandle = document.createElement('button'); resizeHandle.type = 'button'; resizeHandle.textContent = '↔'
      resizeHandle.setAttribute('data-placement-resize', 'east'); resizeHandle.setAttribute('aria-label', '문구 상자 너비 조절: 드래그 또는 방향키')
      Object.assign(resizeHandle.style, { position: 'absolute', zIndex: '2147483003', width: '44px', height: '44px',
        touchAction: 'none', background: '#fff', color: '#68233a', border: '2px solid #68233a', borderRadius: '50%', cursor: 'ew-resize', font: '20px system-ui' })
      resizeHandle.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.isPrimary === false) return
        event.preventDefault(); event.stopImmediatePropagation(); resizeHandle?.focus({ preventScroll: true })
        resizeHandle?.setPointerCapture?.(event.pointerId); begin(event.pointerId, event.clientX, event.clientY, 0, 0, false, 'resize', false, pointerScreenOrigin(event))
      })
      document.body.append(resizeHandle)
    }
    const intersectsViewport = rect.top < window.innerHeight && rect.top + rect.height > 0
      && rect.left < window.innerWidth && rect.left + rect.width > 0
    const showControls = intersectsViewport || Boolean(active || pending || handoff)
    outline.hidden = !showControls
    handle.hidden = !showControls
    resizeHandle.hidden = !showControls
    if (!showControls) hideGuides()
    Object.assign(handle.style, { left: `${Math.max(0, rect.left + window.scrollX)}px`, top: `${Math.max(window.scrollY, rect.top + window.scrollY - 44)}px` })
    const visibleTop = Math.max(0, rect.top)
    const visibleBottom = Math.min(window.innerHeight, rect.top + rect.height)
    const resizeTop = visibleTop < visibleBottom
      ? clamp((visibleTop + visibleBottom) / 2 - 22, 0, window.innerHeight - 44)
      : rect.top + rect.height / 2 - 22
    Object.assign(resizeHandle.style, { left: `${Math.max(0, Math.min(window.innerWidth - 44, rect.left + rect.width - 22)) + window.scrollX}px`,
      top: `${resizeTop + window.scrollY}px` })
    const preview = handoff?.id === selected && !pending && !active ? handoff : null
    outline.style.translate = preview?.kind === 'move' ? `${preview.dx}px ${preview.dy}px` : ''
    handle.style.translate = preview?.kind === 'move' ? `${preview.dx}px ${preview.dy}px` : ''
    resizeHandle.style.translate = preview ? preview.kind === 'move' ? `${preview.dx}px ${preview.dy}px` : `${preview.dx}px 0px` : ''
    if (preview?.kind === 'resize') outline.style.width = `${Math.max(1, rect.width + preview.dx)}px`
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
      const rect = box(measuredBox(element))
      if (rect.width <= 0 || rect.height <= 0) continue
      if (found.has(id)) { duplicates.add(id); continue }
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth
      const sectionBox = section ? section.getBoundingClientRect() : { left: 0, width: viewportWidth, top: -window.scrollY, height: document.documentElement.scrollHeight }
      const left = Math.max(0, sectionBox.left), right = Math.min(viewportWidth, sectionBox.left + sectionBox.width)
      const label = definition.label === '문구' ? element.textContent?.trim().slice(0, 100) || '빈 문구' : definition.label
      const widthBasis = getTextBoxWidthBasis(element)
      const block: PlacementBlock = { id, label, group: definition.group, value: canonicalTextLayout(value), rect, renderedOffsets, ...(widthBasis > 0 ? { widthBasis } : {}),
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
    if (!active.restored) restore(active)
    const ownsFreeze = active.ownsFreeze
    active = null; lastCommit = null; window.clearTimeout(retryTimer); window.clearTimeout(beginTimer); delete document.body.dataset.canvasPlacementActive
    if (ownsFreeze) config.freeze(false)
    selection(); refreshRegistry()
  }
  const restore = (gesture: Gesture) => {
    gesture.entry.element.style.translate = gesture.originalTranslate
    gesture.entry.element.style.width = gesture.originalWidth
    gesture.entry.element.style.maxWidth = gesture.originalMaxWidth
    gesture.entry.element.style.display = gesture.originalDisplay
    if (gesture.originalManualWidth) gesture.entry.element.setAttribute('data-site-manual-width', '')
    else gesture.entry.element.removeAttribute('data-site-manual-width')
  }
  const previewPending = () => {
    if (!pending || pending.cancelled) return
    const gesture = pending, element = gesture.entry.element
    if (gesture.dx === 0 && gesture.dy === 0) { restore(gesture); position(); return }
    if (gesture.kind === 'resize') {
      const column = gesture.entry.block.widthBasis ?? getTextBoxWidthBasis(element)
      const next = constrainPlacementWidth(gesture.entry.block, gesture.dx, column)
      if (element.tagName === 'SMYC-EDIT-TARGET') element.style.display = 'inline-block'
      element.setAttribute('data-site-manual-width', '')
      element.style.width = `${next.width}%`; element.style.maxWidth = 'none'
    } else {
      const next = constrainPlacement({ ...gesture.entry.block, value: gesture.renderedBase }, gesture.dx, gesture.dy,
        gesture.pointerId === null ? [] : [...entries.values()].map(entry => entry.block), gesture.pointerId === null ? { x: 1, y: 1 } : gesture.scale)
      element.style.translate = `${next.offsetX ?? 0}px ${next.offsetY ?? 0}px`
    }
    position()
  }
  const finish = (cancel = false) => {
    if (!active || active.operation) return
    hideGuides()
    cancel ||= same(active.value, active.grant.before)
    if (cancel) restore(active)
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
    if (active.entry.element.tagName === 'SMYC-EDIT-TARGET') active.entry.element.style.display = 'inline-block'
    if (active.kind === 'resize') {
      if (active.dx === 0) { active.value = active.grant.before; restore(active) }
      else {
        const column = active.entry.block.widthBasis ?? getTextBoxWidthBasis(active.entry.element)
        active.value = constrainPlacementWidth(active.entry.block, active.dx, column)
        active.entry.element.setAttribute('data-site-manual-width', '')
        active.entry.element.style.width = `${active.value.width}%`; active.entry.element.style.maxWidth = 'none'
      }
      position(); return
    }
    if (active.dx === 0 && active.dy === 0) {
      active.value = active.grant.before; active.entry.element.style.translate = active.originalTranslate; position(); return
    }
    active.value = constrainPlacement({ ...active.entry.block, value: active.renderedBase }, active.dx, active.dy, active.pointerId === null ? [] : [...entries.values()].map(entry => entry.block), active.pointerId === null ? { x: 1, y: 1 } : active.scale)
    active.entry.element.style.translate = `${active.value.offsetX ?? 0}px ${active.value.offsetY ?? 0}px`
    if (active.pointerId !== null) {
      const moved = { ...active.entry.block.rect, left: active.entry.block.rect.left + ((active.value.offsetX ?? 0) - (active.renderedBase.offsetX ?? 0)) * active.scale.x,
        top: active.entry.block.rect.top + ((active.value.offsetY ?? 0) - (active.renderedBase.offsetY ?? 0)) * active.scale.y }
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
  function begin(pointerId: number | null, x: number, y: number, dx: number, dy: number, ended: boolean, kind: Gesture['kind'] = 'move', ignoreScrollChange = false, screenOrigin: ScreenOrigin | null = null) {
    if (!mode || active || pending || !selected || !config.getAppliedSequence()) return
    if (blocked()) {
      if (pointerId !== null && !handoff && document.querySelector('.canvas-editor-overlay') && config.finishTextEdit?.()) {
        handoff = { id: selected, pointerId, kind, x, y, screenOrigin, dx, dy, ended, attempts: 0 }
        say('글자 수정을 초안에 반영하는 중입니다. 손잡이를 계속 끌면 이어서 배치됩니다.')
      } else if (pointerId !== null && document.querySelector('.canvas-editor-overlay')) say('한글 입력을 마친 뒤 손잡이를 다시 잡아 주세요.')
      return
    }
    refreshRegistry()
    const entry = entries.get(selected)
    if (!entry) return
    const rendered = entry.block.renderedOffsets
    const renderedBase = { ...entry.block.value, offsetX: rendered?.x ?? entry.block.value.offsetX ?? 0, offsetY: rendered?.y ?? entry.block.value.offsetY ?? 0 }
    pending = { entry, renderedBase, scale: placementScale(entry.element), requestId: crypto.randomUUID(), pointerId, kind, x, y, scrollX: window.scrollX, scrollY: window.scrollY, ignoreScrollChange, screenOrigin, dx, dy, ended, cancelled: false, sequence: config.getAppliedSequence(),
      originalTranslate: entry.element.style.translate, originalWidth: entry.element.style.width, originalMaxWidth: entry.element.style.maxWidth, originalDisplay: entry.element.style.display, originalManualWidth: entry.element.getAttribute('data-site-manual-width') !== null }
    const request = pending
    if (handoff?.pointerId === pointerId) previewPending()
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
  const resumeHandoff = () => {
    if (!handoff || blocked() || !mode || active || pending) return
    const gesture = handoff
    if (gesture.attempts >= 3) { handoff = null; position(); say('글자 수정은 초안에 남았습니다. 상자를 다시 선택해 이동해 주세요.'); return }
    refreshRegistry()
    if (!entries.has(gesture.id)) { handoff = null; position(); say('변경된 문구 상자를 찾지 못했습니다. 화면에서 다시 선택해 주세요.'); return }
    selected = gesture.id
    begin(gesture.pointerId, gesture.x, gesture.y, gesture.dx, gesture.dy, gesture.ended, gesture.kind, true, gesture.screenOrigin)
    if (pending) { gesture.attempts++; say('상자 배치를 확인하는 중입니다.') }
  }
  const abortPending = () => {
    if (!pending) return
    pending.cancelled = true; pending.ended = true; window.clearTimeout(beginTimer)
    restore(pending); position()
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
      if (!mode) handoff = null
      send({ type: 'placement-mode-result', operationId: message.operationId, accepted: true }); refreshRegistry(); resumeHandoff()
    } else if (message.type === 'placement-select' && !active && !pending && mode) {
      selected = message.id && entries.has(message.id) ? message.id : null
      const entry = selected ? entries.get(selected) : undefined
      const rect = entry ? measuredBox(entry.element) : null
      if (rect && (rect.top < 72 || rect.top + rect.height > window.innerHeight)) {
        entry!.element.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: 'instant' })
      }
      selection(); position()
    } else if (message.type === 'placement-grant' && pending?.requestId === message.requestId) {
      window.clearTimeout(beginTimer)
      const gesture = pending; pending = null
      if (!message.accepted) {
        restore(gesture); position()
        if (handoff?.id === gesture.entry.block.id && handoff.attempts < 3) {
          handoff.dx = gesture.dx; handoff.dy = gesture.dy; handoff.ended = gesture.ended
          say('글자 변경을 반영한 뒤 상자 배치를 다시 확인하고 있습니다.')
          window.requestAnimationFrame(resumeHandoff)
        } else { handoff = null; position(); say('현재 위치를 확인하지 못했습니다. 초안을 갱신하고 다시 선택해 주세요.') }
        return
      }
      handoff = null
      const ownsFreeze = !blocked() && gesture.entry.element.isConnected && message.grant.id === gesture.entry.block.id && message.grant.device === device
        && message.grant.baseDraftSequence === gesture.sequence && same(message.grant.before, gesture.entry.block.value) && !gesture.cancelled
      active = { ...gesture, grant: message.grant, restored: false, ownsFreeze, value: message.grant.before, operation: null, resume: null }
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
        say(message.status === 'committed'
          ? active.kind === 'resize' ? '문구 상자 너비를 초안에 반영했습니다.' : '문구 상자 위치를 초안에 반영했습니다.'
          : '상자 배치를 취소했습니다. 원래 위치를 유지합니다.')
        active.resume = message.resumeDraftSequence
        // Remove the transient override before React applies the queued draft.
        // close() must not then overwrite that newly rendered persisted value.
        active.entry.element.style.translate = active.originalTranslate; active.entry.element.style.width = active.originalWidth
        active.entry.element.style.maxWidth = active.originalMaxWidth; active.entry.element.style.display = active.originalDisplay; active.restored = true
        if (active.ownsFreeze) { active.ownsFreeze = false; config.freeze(false) }
        if (active && config.getAppliedSequence() >= active.resume!) close()
      }
    }
  }
  const pointer = (event: PointerEvent) => {
    if (directDrag?.pointerId === event.pointerId) {
      if (event.type === 'pointermove' && Math.hypot(event.clientX - directDrag.x, event.clientY - directDrag.y) >= 6) {
        const start = directDrag
        directDrag = null
        suppressDragClick = true
        event.preventDefault()
        begin(start.pointerId, start.x, start.y, event.clientX - start.x, event.clientY - start.y, false, 'move', false, start.screenOrigin)
      } else if (event.type !== 'pointermove') directDrag = null
    }
    const gesture = active ?? pending
    if (!gesture && handoff && handoff.pointerId === event.pointerId) {
      event.preventDefault()
      // A closing editor may scroll or move its containing frame without moving the pointer.
      const travel = screenTravel(event, handoff.screenOrigin)
      handoff.dx = travel?.x ?? event.clientX - handoff.x
      handoff.dy = travel?.y ?? event.clientY - handoff.y
      if (event.type === 'pointercancel') { handoff = null; say('상자 배치를 취소했습니다. 글자 수정은 초안에 유지됩니다.') }
      else if (event.type === 'pointerup') handoff.ended = true
      position()
      return
    }
    if (!gesture || gesture.pointerId !== event.pointerId || active?.operation) return
    event.preventDefault()
    const travel = gesture.ignoreScrollChange ? screenTravel(event, gesture.screenOrigin) : null
    gesture.dx = travel?.x ?? event.clientX - gesture.x + (gesture.ignoreScrollChange ? 0 : window.scrollX - gesture.scrollX)
    gesture.dy = travel?.y ?? event.clientY - gesture.y + (gesture.ignoreScrollChange ? 0 : window.scrollY - gesture.scrollY)
    if (handoff) { handoff.dx = gesture.dx; handoff.dy = gesture.dy }
    if (event.type === 'pointercancel') { gesture.cancelled = true; gesture.ended = true; handoff = null; if (active) finish(true); else abortPending() }
    else if (event.type === 'pointerup') { gesture.ended = true; if (active) { move(); finish() } else previewPending() }
    else if (active) move()
    else previewPending()
  }
  const pointerDown = (event: PointerEvent) => {
    directDrag = null
    suppressDragClick = false
    if (!mode || blocked() || active || pending || event.button !== 0 || event.isPrimary === false || event.pointerType === 'touch'
      || !(event.target instanceof Element) || event.target.closest('a,button,input,textarea,select,[contenteditable]')) return
    let candidate = event.target.closest<HTMLElement>('[data-site-layout]')
    let element: HTMLElement | null = null
    while (candidate) {
      const id = candidate.getAttribute('data-site-layout')
      if (id && entries.get(id)?.element === candidate && (!element || /^H[1-6]$/.test(candidate.tagName))) element = candidate
      candidate = candidate.parentElement?.closest<HTMLElement>('[data-site-layout]') ?? null
    }
    const id = element?.getAttribute('data-site-layout')
    if (!id) return
    selected = id
    selection()
    position()
    directDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, screenOrigin: pointerScreenOrigin(event) }
  }
  const click = (event: MouseEvent) => {
    if (suppressDragClick) { suppressDragClick = false; event.preventDefault(); event.stopImmediatePropagation(); return }
    if (!mode || blocked() || active || pending || !(event.target instanceof Element)) return
    if (isPreviewControlActivation(event)) return
    let candidate = event.target.closest<HTMLElement>('[data-site-layout]')
    let element: HTMLElement | null = null
    while (candidate) {
      const id = candidate.getAttribute('data-site-layout')
      if (id && entries.get(id)?.element === candidate && (!element || /^H[1-6]$/.test(candidate.tagName))) element = candidate
      candidate = candidate.parentElement?.closest<HTMLElement>('[data-site-layout]') ?? null
    }
    const id = element?.getAttribute('data-site-layout')
    if (!id || !element) {
      if (event.target.closest('[data-canvas-target]') && selected) { selected = null; selection(); position() }
      return
    }
    event.preventDefault(); event.stopImmediatePropagation(); selected = id; selection(); position()
  }
  const keydown = (event: KeyboardEvent) => {
    if (!mode || event.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape' && handoff) { event.preventDefault(); handoff = null; if (pending) abortPending(); else say('상자 배치를 취소했습니다. 글자 수정은 초안에 유지됩니다.'); position(); return }
    if (event.key === 'Escape' && (active || pending)) { event.preventDefault(); if (active) finish(true); else abortPending(); return }
    if (![handle, outline, resizeHandle].includes(event.target as HTMLButtonElement) || event.altKey || event.ctrlKey || event.metaKey) return
    const step = event.shiftKey ? 10 : 1, offsets: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const delta = offsets[event.key]
    if (delta) { event.preventDefault(); begin(null, 0, 0, delta[0], delta[1], true, event.target === resizeHandle ? 'resize' : 'move') }
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
      window.addEventListener('message', receive); document.addEventListener('click', click, true); document.addEventListener('keydown', keydown, true); document.addEventListener('pointerdown', pointerDown, true)
      for (const type of ['pointermove', 'pointerup', 'pointercancel']) document.addEventListener(type, pointer as EventListener)
      window.addEventListener('resize', refreshRegistry); window.addEventListener('scroll', position, true); send({ type: 'placement-ready' }); refreshRegistry()
      return () => {
        resizeObserver?.disconnect(); mutationObserver?.disconnect(); resizeObserver = null; mutationObserver = null; observed.clear()
        window.cancelAnimationFrame(geometryFrame); geometryFrame = 0
        mounted = false; window.clearTimeout(retryTimer); window.clearTimeout(beginTimer); window.removeEventListener('message', receive); document.removeEventListener('click', click, true); document.removeEventListener('keydown', keydown, true); document.removeEventListener('pointerdown', pointerDown, true)
        for (const type of ['pointermove', 'pointerup', 'pointercancel']) document.removeEventListener(type, pointer as EventListener)
        window.removeEventListener('resize', refreshRegistry); window.removeEventListener('scroll', position, true)
        if (active) { if (!active.restored) restore(active); if (active.ownsFreeze) config.freeze(false) }
        if (pending) restore(pending)
        active = null; pending = null; handoff = null; directDrag = null; handle?.remove(); resizeHandle?.remove(); outline?.remove(); status?.remove(); Object.values(guides).forEach(guide => guide.remove()); delete document.body.dataset.canvasPlacementMode; delete document.body.dataset.canvasPlacementActive
      }
    },
  }
}
