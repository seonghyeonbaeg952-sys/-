import type { EditorDevice, EditorPageId, EditorTextLayout } from '../types/siteEditor'
import { isEditorPageId } from './siteEditorModel'
import { isEditorCopyKey, isEditorRecord } from './siteEditorTextStyles'
import { isEditorTextLayout } from './siteEditorLayout'

export const PLACEMENT_PROTOCOL_CHANNEL = 'smyc-placement' as const
export const PLACEMENT_PROTOCOL_VERSION = 1 as const
export type PlacementRect = { left: number; top: number; width: number; height: number }
export type PlacementBlock = { id: string; label: string; group: string; value: EditorTextLayout; rect: PlacementRect; bounds: PlacementRect; renderedOffsets?: { x: number; y: number } }
export type PlacementGrant = { editId: string; id: string; device: EditorDevice; baseDraftSequence: number; before: EditorTextLayout }
export type PlacementReason = 'stale' | 'invalid' | 'busy' | 'unsupported'
export type PlacementEnvelope = { channel: 'smyc-placement'; version: 1; nonce: string; previewPage: EditorPageId; sequence: number }
export type PlacementFrameMessage = PlacementEnvelope & (
  | { type: 'placement-ready' }
  | { type: 'placement-register'; appliedDraftSequence: number; blocks: PlacementBlock[] }
  | { type: 'placement-selection'; id: string | null; editId: string | null }
  | { type: 'placement-begin'; requestId: string; id: string; appliedDraftSequence: number }
  | { type: 'placement-abort'; requestId: string }
  | { type: 'placement-commit'; editId: string; operationId: string; baseDraftSequence: number; outcome: 'apply'; value: EditorTextLayout }
  | { type: 'placement-commit'; editId: string; operationId: string; outcome: 'cancel' }
  | { type: 'placement-mode-result'; operationId: string; accepted: boolean; reason?: PlacementReason }
  | { type: 'placement-draft-status'; editId: string; draftSequence: number; status: 'deferred' }
)
export type PlacementParentMessage = PlacementEnvelope & (
  | { type: 'placement-mode'; operationId: string; mode: 'place' | 'off'; device: EditorDevice }
  | { type: 'placement-select'; id: string | null }
  | { type: 'placement-aborted'; requestId: string }
  | { type: 'placement-grant'; requestId: string; accepted: true; grant: PlacementGrant }
  | { type: 'placement-grant'; requestId: string; accepted: false; reason: PlacementReason }
  | { type: 'placement-result'; editId: string; operationId: string; status: 'committed' | 'cancelled'; resumeDraftSequence: number }
  | { type: 'placement-result'; editId: string; operationId: string; status: 'rejected'; reason: PlacementReason }
)
export type PlacementMessage = PlacementFrameMessage | PlacementParentMessage
const common = ['channel', 'version', 'nonce', 'previewPage', 'sequence', 'type']
const frameTypes = new Set(['placement-ready', 'placement-register', 'placement-selection', 'placement-begin', 'placement-abort', 'placement-commit', 'placement-mode-result', 'placement-draft-status'])
const seq = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0
const token = (value: unknown): value is string => typeof value === 'string' && isEditorCopyKey(value)
const device = (value: unknown) => value === 'mobile' || value === 'tablet' || value === 'desktop'
const reason = (value: unknown) => typeof value === 'string' && ['stale', 'invalid', 'busy', 'unsupported'].includes(value)
function keys(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return isEditorRecord(value) && required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key))
}
function rect(value: unknown): value is PlacementRect {
  return keys(value, ['left', 'top', 'width', 'height']) && Object.entries(value).every(([key, item]) => typeof item === 'number' && Number.isFinite(item)
    && Math.abs(item) <= 100000 && (!['width', 'height'].includes(key) || item >= 0))
}
function block(value: unknown): value is PlacementBlock {
  return keys(value, ['id', 'label', 'group', 'value', 'rect', 'bounds'], ['renderedOffsets']) && token(value.id) && token(value.group)
    && typeof value.label === 'string' && value.label.length > 0 && value.label.length <= 240
    && isEditorTextLayout(value.value) && rect(value.rect) && rect(value.bounds)
    && (!Object.hasOwn(value, 'renderedOffsets') || keys(value.renderedOffsets, ['x', 'y'])
      && Object.values(value.renderedOffsets).every(item => typeof item === 'number' && Number.isFinite(item) && Math.abs(item) <= 2000))
}
function blocks(value: unknown): value is PlacementBlock[] {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype && value.length <= 500
    && Reflect.ownKeys(value).length === value.length + 1 && Array.from({ length: value.length }, (_, i) => i).every(i => {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(i))
      return descriptor?.enumerable && Object.hasOwn(descriptor, 'value') && block(descriptor.value)
    }) && new Set(value.map(item => item.id)).size === value.length
}
function grant(value: unknown): value is PlacementGrant {
  return keys(value, ['editId', 'id', 'device', 'baseDraftSequence', 'before']) && token(value.editId) && token(value.id)
    && device(value.device) && seq(value.baseDraftSequence) && isEditorTextLayout(value.before)
}
export function parsePlacementMessage(value: unknown): PlacementMessage | null {
  try {
    if (!isEditorRecord(value) || value.channel !== PLACEMENT_PROTOCOL_CHANNEL || value.version !== PLACEMENT_PROTOCOL_VERSION
      || typeof value.nonce !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.nonce)
      || !isEditorPageId(value.previewPage) || !seq(value.sequence)) return null
    const shape = (required: string[], optional: string[] = []) => keys(value, [...common, ...required], optional)
    let valid = false
    switch (value.type) {
      case 'placement-ready': valid = shape([]); break
      case 'placement-register': valid = shape(['appliedDraftSequence', 'blocks']) && seq(value.appliedDraftSequence) && blocks(value.blocks); break
      case 'placement-selection': valid = shape(['id', 'editId']) && (value.id === null || token(value.id)) && (value.editId === null || token(value.editId)); break
      case 'placement-begin': valid = shape(['requestId', 'id', 'appliedDraftSequence']) && token(value.requestId) && token(value.id) && seq(value.appliedDraftSequence); break
      case 'placement-abort': case 'placement-aborted': valid = shape(['requestId']) && token(value.requestId); break
      case 'placement-commit': valid = token(value.editId) && token(value.operationId) && (value.outcome === 'cancel'
        ? shape(['editId', 'operationId', 'outcome']) : value.outcome === 'apply' && shape(['editId', 'operationId', 'baseDraftSequence', 'outcome', 'value']) && seq(value.baseDraftSequence) && isEditorTextLayout(value.value)); break
      case 'placement-mode-result': valid = token(value.operationId) && (value.accepted === true ? shape(['operationId', 'accepted']) : value.accepted === false && shape(['operationId', 'accepted', 'reason']) && reason(value.reason)); break
      case 'placement-draft-status': valid = shape(['editId', 'draftSequence', 'status']) && token(value.editId) && seq(value.draftSequence) && value.status === 'deferred'; break
      case 'placement-mode': valid = shape(['operationId', 'mode', 'device']) && token(value.operationId) && (value.mode === 'off' || value.mode === 'place') && device(value.device); break
      case 'placement-select': valid = shape(['id']) && (value.id === null || token(value.id)); break
      case 'placement-grant': valid = token(value.requestId) && (value.accepted === true ? shape(['requestId', 'accepted', 'grant']) && grant(value.grant) : value.accepted === false && shape(['requestId', 'accepted', 'reason']) && reason(value.reason)); break
      case 'placement-result': valid = token(value.editId) && token(value.operationId) && (value.status === 'rejected'
        ? shape(['editId', 'operationId', 'status', 'reason']) && reason(value.reason) : (value.status === 'committed' || value.status === 'cancelled') && shape(['editId', 'operationId', 'status', 'resumeDraftSequence']) && seq(value.resumeDraftSequence)); break
    }
    return valid && new TextEncoder().encode(JSON.stringify(value)).byteLength <= 512 * 1024 ? value as PlacementMessage : null
  } catch { return null }
}
export function acceptPlacementMessage(event: Pick<MessageEvent, 'origin' | 'source' | 'data'>, expected: {
  origin: string; source: MessageEventSource; nonce: string; previewPage: EditorPageId; lastSequence: number; direction: 'frame-to-parent' | 'parent-to-frame'
}): PlacementMessage | null {
  if (event.source !== expected.source || event.origin !== expected.origin) return null
  const message = parsePlacementMessage(event.data)
  return message && message.nonce === expected.nonce && message.previewPage === expected.previewPage && message.sequence > expected.lastSequence
    && frameTypes.has(message.type) === (expected.direction === 'frame-to-parent') ? message : null
}
