import type { EditorDevice, EditorPageId, EditorTextRun, EditorTextStyle } from '../types/siteEditor'
import { isCanvasBlock } from './siteEditorCanvasModel'
import type { CanvasBlock, CanvasSelection, CanvasSource } from './siteEditorCanvasModel'
import { isEditorPageId } from './siteEditorModel'
import { isEditorCopyKey, isEditorCopyText, isEditorRecord, snapTextSelection, supportsTextSegmentation, validateTextStyles } from './siteEditorTextStyles'

export const CANVAS_PROTOCOL_VERSION = 1 as const
export const CANVAS_PROTOCOL_CHANNEL = 'smyc-canvas' as const
export const CANVAS_PROTOCOL_LIMITS = {
  messageBytes: 512 * 1024,
  // Current inventory max is 83 distinct home/desktop keys; repeated occurrences
  // remain separate blocks. Runtime registration must also respect the byte cap.
  blocks: 512, segments: 500, fields: 500, edits: 500, ranges: 500, runs: 500,
  identifier: 128, label: 240, textUnits: 20000,
} as const

type CanvasSourceIdentity = Pick<CanvasSource, 'ownerPage' | 'scope' | 'key'>
export type CanvasEnvelope = {
  channel: 'smyc-canvas'; version: 1; nonce: string; previewPage: EditorPageId; sequence: number
}
export type CanvasFieldGrant = {
  source: CanvasSourceIdentity; fieldVersion: string; text: string; runs: EditorTextRun[]
  ranges: Array<{ start: number; end: number }>
}
export type CanvasEditGrant = {
  editId: string; blockId: string; blockRevision: number; ownerPage: EditorPageId
  scope: 'shared' | EditorDevice; device: EditorDevice; baseDraftSequence: number; fields: CanvasFieldGrant[]
}
export type CanvasSourcePatch = {
  source: CanvasSourceIdentity; fieldVersion: string
  edits: Array<{ start: number; end: number; text: string; runs: EditorTextRun[] }>
}
export type CanvasRejection = 'stale' | 'invalid' | 'unsupported' | 'busy' | 'composing'
export type CanvasAction = 'undo' | 'redo' | 'selectAll' | 'finish' | 'cancel'
export type CanvasSelectionStyle = { [K in keyof EditorTextStyle]?: EditorTextStyle[K] | 'mixed' }
/** Display-only state from the local buffer; never authorization or a CAS source. */
export type CanvasSelectionSummary = {
  style: CanvasSelectionStyle; canUndo: boolean; canRedo: boolean; composing: boolean; dirty: boolean
}
export type CanvasFrameMessage = CanvasEnvelope & (
  | { type: 'canvas-ready' }
  | { type: 'canvas-save' }
  | { type: 'canvas-register'; appliedDraftSequence: number; blocks: CanvasBlock[] }
  | { type: 'canvas-selection'; editId: string | null; localRevision: number; selection: CanvasSelection | null; summary: CanvasSelectionSummary | null }
  | { type: 'canvas-editbegin'; requestId: string; blockId: string; blockRevision: number; appliedDraftSequence: number }
  | { type: 'canvas-commit'; editId: string; operationId: string; baseDraftSequence: number; outcome: 'apply'; changes: CanvasSourcePatch[] }
  | { type: 'canvas-commit'; editId: string; operationId: string; outcome: 'cancel' }
  | { type: 'canvas-draft-status'; editId: string; draftSequence: number; status: 'deferred' }
  | { type: 'canvas-command-result'; action: 'mode'; operationId: string; accepted: boolean; reason?: CanvasRejection }
  | { type: 'canvas-command-result'; action: 'format' | CanvasAction; editId: string; operationId: string; accepted: boolean; localRevision: number; selection: CanvasSelection | null; reason?: CanvasRejection }
)
export type CanvasParentMessage = CanvasEnvelope & (
  | { type: 'canvas-mode'; operationId: string; mode: 'edit' | 'preview'; scope: 'shared' | EditorDevice; device: EditorDevice }
  | { type: 'canvas-begin'; operationId: string; blockId: string; blockRevision: number }
  | { type: 'canvas-editgrant'; requestId: string; accepted: true; grant: CanvasEditGrant }
  | { type: 'canvas-editgrant'; requestId: string; accepted: false; reason: CanvasRejection }
  | { type: 'canvas-format'; editId: string; operationId: string; expectedLocalRevision: number; selection: CanvasSelection; patch: EditorTextStyle | null }
  | { type: 'canvas-action'; editId: string; operationId: string; expectedLocalRevision: number; action: CanvasAction }
  | { type: 'canvas-command-result'; action: 'commit'; editId: string; operationId: string; status: 'committed' | 'cancelled'; resumeDraftSequence: number }
  | { type: 'canvas-command-result'; action: 'commit'; editId: string; operationId: string; status: 'rejected'; reason: CanvasRejection }
)
export type CanvasMessage = CanvasFrameMessage | CanvasParentMessage
export type CanvasMessageExpectation = {
  origin: string; source: MessageEventSource; nonce: string; previewPage: EditorPageId
  lastSequence: number; direction: 'frame-to-parent' | 'parent-to-frame'
}

const commonKeys = ['channel', 'type', 'version', 'nonce', 'previewPage', 'sequence']
const styleKeys = ['fontFamily', 'fontSize', 'color', 'fontWeight', 'fontStyle', 'textDecoration']
const devices = ['mobile', 'tablet', 'desktop']
const scopes = ['shared', ...devices]
const rejections = ['stale', 'invalid', 'unsupported', 'busy', 'composing']
const actions = ['undo', 'redo', 'selectAll', 'finish', 'cancel']
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0
const sequence = (value: unknown): value is number => integer(value) && value > 0
const oneOf = (value: unknown, allowed: readonly string[]): value is string => typeof value === 'string' && allowed.includes(value)
const identity = (source: CanvasSourceIdentity) => JSON.stringify([source.ownerPage, source.scope, source.key])

function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.length <= CANVAS_PROTOCOL_LIMITS.identifier
    && /^[A-Za-z0-9_.:-]+$/.test(value)
    && !value.split(/[.:]/).some(part => ['__proto__', 'prototype', 'constructor'].includes(part))
}

function keys(value: unknown, required: readonly string[], optional: readonly string[] = []): value is Record<string, unknown> {
  return isEditorRecord(value) && required.every(key => Object.hasOwn(value, key))
    && Object.keys(value).every(key => required.includes(key) || optional.includes(key))
}

function denseArray(value: unknown, max: number): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > max
    || Reflect.ownKeys(value).length !== value.length + 1) return false
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i))
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value')) return false
  }
  return true
}

/** Bound plain structured-clone data before segmentation/projection or stringify. */
function withinBudget(value: unknown): boolean {
  let bytes = 0
  const encoder = new TextEncoder()
  const ancestors = new Set<object>()
  const add = (amount: number) => { bytes += amount; return bytes <= CANVAS_PROTOCOL_LIMITS.messageBytes }
  const visit = (entry: unknown, depth: number): boolean => {
    if (depth > 12) return false
    if (entry === null || typeof entry === 'boolean' || entry === undefined) return add(5)
    if (typeof entry === 'number') return Number.isFinite(entry) && add(String(entry).length)
    if (typeof entry === 'string') return entry.length <= CANVAS_PROTOCOL_LIMITS.textUnits && add(encoder.encode(JSON.stringify(entry)).byteLength)
    if (typeof entry !== 'object' || ancestors.has(entry)) return false
    ancestors.add(entry)
    let valid = add(2)
    if (Array.isArray(entry)) {
      valid = valid && denseArray(entry, CANVAS_PROTOCOL_LIMITS.blocks)
        && entry.every(child => add(1) && visit(child, depth + 1))
    } else {
      valid = valid && isEditorRecord(entry) && Object.keys(entry).length <= 20
        && Object.entries(entry).every(([key, child]) => add(2) && visit(key, depth + 1) && visit(child, depth + 1))
    }
    ancestors.delete(entry)
    return valid
  }
  return visit(value, 0)
}

function text(value: unknown): value is string {
  return isEditorCopyText(value) && Array.from(value).every(character => character.length !== 1
    || character.charCodeAt(0) < 0xd800 || character.charCodeAt(0) > 0xdfff)
}

function source(value: unknown): value is CanvasSourceIdentity {
  return keys(value, ['ownerPage', 'scope', 'key']) && isEditorPageId(value.ownerPage)
    && oneOf(value.scope, scopes) && typeof value.key === 'string' && isEditorCopyKey(value.key)
}

function styledText(value: unknown, runs: unknown): boolean {
  return text(value) && denseArray(runs, CANVAS_PROTOCOL_LIMITS.runs)
    && validateTextStyles({ shared: { text: { text: value, runs } } }) === null
}

function boundary(value: string, position: number): boolean {
  if (position === 0 || position === value.length) return true
  const code = value.charCodeAt(position)
  if (code >= 0xdc00 && code <= 0xdfff) return false
  return !supportsTextSegmentation || snapTextSelection(value, position, position + 1).start === position
}

function range(value: unknown, max: number = CANVAS_PROTOCOL_LIMITS.textUnits): value is { start: number; end: number } {
  return keys(value, ['start', 'end']) && integer(value.start) && integer(value.end)
    && value.start <= value.end && value.end <= max
}

function ranges(value: unknown, snapshot: string): boolean {
  if (!denseArray(value, CANVAS_PROTOCOL_LIMITS.ranges) || !value.length) return false
  let previousEnd = -1, previousStart = -1
  for (const entry of value) {
    if (!range(entry, snapshot.length) || entry.start < previousEnd || entry.start === previousStart
      || !boundary(snapshot, entry.start) || !boundary(snapshot, entry.end)) return false
    previousStart = entry.start; previousEnd = entry.end
  }
  return true
}

function selected(value: unknown): value is CanvasSelection {
  return keys(value, ['blockId', 'start', 'end', 'revision']) && identifier(value.blockId)
    && integer(value.start) && integer(value.end) && value.start <= CANVAS_PROTOCOL_LIMITS.textUnits
    && value.end <= CANVAS_PROTOCOL_LIMITS.textUnits && integer(value.revision)
}

function partialStyle(value: unknown, mixed: boolean): boolean {
  if (!keys(value, [], styleKeys)) return false
  const entries = Object.entries(value)
  if (mixed && entries.some(([, item]) => item === undefined)) return false
  const concrete = Object.fromEntries(entries.filter(([, item]) => mixed ? item !== 'mixed' : item !== undefined))
  return Object.keys(concrete).length === 0 || styledText('x', [{ start: 0, end: 1, style: concrete }])
}

function displaySummary(value: unknown): value is CanvasSelectionSummary {
  return keys(value, ['style', 'canUndo', 'canRedo', 'composing', 'dirty']) && partialStyle(value.style, true)
    && ['canUndo', 'canRedo', 'composing', 'dirty'].every(key => typeof value[key] === 'boolean')
}

function fieldGrant(value: unknown): value is CanvasFieldGrant {
  return keys(value, ['source', 'fieldVersion', 'text', 'runs', 'ranges']) && source(value.source)
    && identifier(value.fieldVersion) && text(value.text) && styledText(value.text, value.runs) && ranges(value.ranges, value.text)
}

function editGrant(value: unknown): value is CanvasEditGrant {
  if (!keys(value, ['editId', 'blockId', 'blockRevision', 'ownerPage', 'scope', 'device', 'baseDraftSequence', 'fields'])
    || !identifier(value.editId) || !identifier(value.blockId) || !integer(value.blockRevision)
    || !isEditorPageId(value.ownerPage) || !oneOf(value.scope, scopes) || !oneOf(value.device, devices)
    || !sequence(value.baseDraftSequence) || !denseArray(value.fields, CANVAS_PROTOCOL_LIMITS.fields) || !value.fields.length) return false
  const seen = new Set<string>()
  for (const field of value.fields) {
    if (!fieldGrant(field) || field.source.ownerPage !== value.ownerPage || field.source.scope !== value.scope || seen.has(identity(field.source))) return false
    seen.add(identity(field.source))
  }
  return true
}

function sourcePatch(value: unknown): value is CanvasSourcePatch {
  if (!keys(value, ['source', 'fieldVersion', 'edits']) || !source(value.source) || !identifier(value.fieldVersion)
    || !denseArray(value.edits, CANVAS_PROTOCOL_LIMITS.edits) || !value.edits.length) return false
  let previousEnd = -1, previousStart = -1
  for (const edit of value.edits) {
    if (!keys(edit, ['start', 'end', 'text', 'runs']) || !range({ start: edit.start, end: edit.end })
      || !styledText(edit.text, edit.runs) || Number(edit.start) < previousEnd || edit.start === previousStart) return false
    previousStart = Number(edit.start); previousEnd = Number(edit.end)
  }
  return true
}

function changes(value: unknown): boolean {
  if (!denseArray(value, CANVAS_PROTOCOL_LIMITS.fields) || !value.length) return false
  const seen = new Set<string>()
  let owner: EditorPageId | undefined, scope: string | undefined
  for (const patch of value) {
    if (!sourcePatch(patch) || (owner !== undefined && owner !== patch.source.ownerPage)
      || (scope !== undefined && scope !== patch.source.scope) || seen.has(identity(patch.source))) return false
    owner = patch.source.ownerPage; scope = patch.source.scope; seen.add(identity(patch.source))
  }
  return true
}

function blocks(value: unknown): value is CanvasBlock[] {
  if (!denseArray(value, CANVAS_PROTOCOL_LIMITS.blocks)) return false
  const seen = new Set<string>()
  for (const block of value) {
    if (!isEditorRecord(block) || !identifier(block.id) || !text(block.label) || Array.from(block.label).length > CANVAS_PROTOCOL_LIMITS.label
      || !denseArray(block.segments, CANVAS_PROTOCOL_LIMITS.segments) || !isCanvasBlock(block) || seen.has(block.id)) return false
    seen.add(block.id)
  }
  return true
}

function resultAccepted(value: Record<string, unknown>): boolean {
  return value.accepted === true ? !Object.hasOwn(value, 'reason')
    : value.accepted === false && oneOf(value.reason, rejections)
}

function payload(value: Record<string, unknown>): boolean {
  const shape = (required: string[], optional: string[] = []) => keys(value, [...commonKeys, ...required], optional)
  const editOperation = () => identifier(value.editId) && identifier(value.operationId)
  switch (value.type) {
    case 'canvas-ready': case 'canvas-save': return shape([])
    case 'canvas-register': return shape(['appliedDraftSequence', 'blocks']) && sequence(value.appliedDraftSequence) && blocks(value.blocks)
    case 'canvas-selection': return shape(['editId', 'localRevision', 'selection', 'summary']) && integer(value.localRevision)
      && (value.selection === null || selected(value.selection))
      && (value.editId === null ? value.summary === null : identifier(value.editId) && displaySummary(value.summary))
    case 'canvas-editbegin': return shape(['requestId', 'blockId', 'blockRevision', 'appliedDraftSequence'])
      && identifier(value.requestId) && identifier(value.blockId) && integer(value.blockRevision) && sequence(value.appliedDraftSequence)
    case 'canvas-commit': return editOperation() && (value.outcome === 'cancel'
      ? shape(['editId', 'operationId', 'outcome'])
      : value.outcome === 'apply' && shape(['editId', 'operationId', 'baseDraftSequence', 'outcome', 'changes'])
        && sequence(value.baseDraftSequence) && changes(value.changes))
    case 'canvas-draft-status': return shape(['editId', 'draftSequence', 'status']) && identifier(value.editId)
      && sequence(value.draftSequence) && value.status === 'deferred'
    case 'canvas-mode': return shape(['operationId', 'mode', 'scope', 'device']) && identifier(value.operationId)
      && oneOf(value.mode, ['edit', 'preview']) && oneOf(value.scope, scopes) && oneOf(value.device, devices)
    case 'canvas-begin': return shape(['operationId', 'blockId', 'blockRevision']) && identifier(value.operationId)
      && identifier(value.blockId) && integer(value.blockRevision)
    case 'canvas-editgrant': return identifier(value.requestId) && (value.accepted === true
      ? shape(['requestId', 'accepted', 'grant']) && editGrant(value.grant)
      : value.accepted === false && shape(['requestId', 'accepted', 'reason']) && oneOf(value.reason, rejections))
    case 'canvas-format': return shape(['editId', 'operationId', 'expectedLocalRevision', 'selection', 'patch']) && editOperation()
      && integer(value.expectedLocalRevision) && selected(value.selection) && (value.patch === null || partialStyle(value.patch, false))
    case 'canvas-action': return shape(['editId', 'operationId', 'expectedLocalRevision', 'action']) && editOperation()
      && integer(value.expectedLocalRevision) && oneOf(value.action, actions)
    case 'canvas-command-result': {
      if (!identifier(value.operationId)) return false
      if (value.action === 'mode') return shape(['action', 'operationId', 'accepted'], ['reason']) && resultAccepted(value)
      if (value.action === 'format' || oneOf(value.action, actions)) return shape(['action', 'editId', 'operationId', 'accepted', 'localRevision', 'selection'], ['reason'])
        && identifier(value.editId) && resultAccepted(value) && integer(value.localRevision) && (value.selection === null || selected(value.selection))
      if (value.action !== 'commit' || !identifier(value.editId)) return false
      return value.status === 'rejected'
        ? shape(['action', 'editId', 'operationId', 'status', 'reason']) && oneOf(value.reason, rejections)
        : shape(['action', 'editId', 'operationId', 'status', 'resumeDraftSequence'])
          && oneOf(value.status, ['committed', 'cancelled']) && sequence(value.resumeDraftSequence)
    }
    default: return false
  }
}

/** Syntax/size validation only: the controller must check catalogue, grant and CAS. */
export function parseCanvasMessage(value: unknown): CanvasMessage | null {
  try {
    if (!withinBudget(value) || !isEditorRecord(value) || value.channel !== CANVAS_PROTOCOL_CHANNEL
      || value.version !== CANVAS_PROTOCOL_VERSION || typeof value.nonce !== 'string' || !uuid.test(value.nonce)
      || !isEditorPageId(value.previewPage) || !sequence(value.sequence) || !payload(value)) return null
    return value as CanvasMessage
  } catch { return null }
}

function direction(message: CanvasMessage): CanvasMessageExpectation['direction'] {
  if (message.type === 'canvas-command-result') return message.action === 'commit' ? 'parent-to-frame' : 'frame-to-parent'
  return ['canvas-mode', 'canvas-begin', 'canvas-editgrant', 'canvas-format', 'canvas-action'].includes(message.type) ? 'parent-to-frame' : 'frame-to-parent'
}

/** Connection/direction/order validation; this function does not mutate counters. */
export function acceptCanvasMessage(event: Pick<MessageEvent, 'origin' | 'source' | 'data'>, expected: CanvasMessageExpectation): CanvasMessage | null {
  try {
    if (!expected.source || !expected.origin || expected.origin === '*' || expected.origin === 'null'
      || !integer(expected.lastSequence) || !oneOf(expected.direction, ['frame-to-parent', 'parent-to-frame'])
      || event.origin !== expected.origin || event.source !== expected.source) return null
    const message = parseCanvasMessage(event.data)
    return message && message.nonce === expected.nonce && message.previewPage === expected.previewPage
      && message.sequence > expected.lastSequence && direction(message) === expected.direction ? message : null
  } catch { return null }
}
