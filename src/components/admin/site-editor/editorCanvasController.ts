import { siteCopyDefinitions } from '../../../content/siteCopyCatalog'
import { richCopyKeys } from '../../../content/richCopyKeys'
import { homeRichCopySourceKeys } from '../../../content/homeRichCopyKeys'
import { isCanvasBlock, type CanvasBlock, type CanvasSourceIdentity } from '../../../lib/siteEditorCanvasModel'
import { CANVAS_PROTOCOL_LIMITS, type CanvasEditGrant, type CanvasFieldGrant, type CanvasSourcePatch } from '../../../lib/siteEditorCanvasProtocol'
import { EDITOR_DEVICES, isEditorPageId, resolveEditorCopy, validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import { canonicalTextStyle, isEditorCopyText, isEditorRecord, rebaseTextRuns, resolveTextRuns, snapTextSelection, supportsTextSegmentation, validateTextStyles } from '../../../lib/siteEditorTextStyles'
import type { EditorDevice, EditorPageId, EditorTextRun, SiteCopyDefinition, SiteEditorDocument, SiteEditorDocuments } from '../../../types/siteEditor'
import { validateEditorCopyFields } from './editorSessionModel'

export type CanvasGrantContext = {
  editorPage: EditorPageId
  previewPage: EditorPageId
  device: EditorDevice
  scope: 'shared' | EditorDevice
  documents: SiteEditorDocuments
  loadedOwners: ReadonlySet<EditorPageId>
  defaultsTrusted: boolean
  defaults: Readonly<Record<string, string>>
  baseDraftSequence: number
}

type GrantState = {
  context: string
  grant: string
  snapshots: Record<string, string>
  capabilities: { format: boolean; replaceText: boolean }
}
/** Parent-only state: never serialize this ledger to or accept it from the iframe. */
export type IssuedCanvasGrant = { grant: CanvasEditGrant; state: GrantState }
export type CanvasGrantFailure = { ok: false; reason: 'invalid' | 'unsupported' | 'stale'; message: string }
export type CanvasGrantResult = { ok: true; issued: IssuedCanvasGrant } | CanvasGrantFailure
export type CanvasCommitResult = { ok: true; ownerPage: EditorPageId; document: SiteEditorDocument } | CanvasGrantFailure

const definitions = new Map(siteCopyDefinitions.map(field => [field.key, field]))
const identity = (source: CanvasSourceIdentity) => JSON.stringify([source.ownerPage, source.scope, source.key])
const contextIdentity = (context: CanvasGrantContext) => JSON.stringify([context.editorPage, context.previewPage, context.device, context.scope])
const fail = (reason: CanvasGrantFailure['reason'], message: string): CanvasGrantFailure => ({ ok: false, reason, message })
const invalid = () => fail('invalid', '선택한 문구의 편집 범위를 확인할 수 없습니다. 다시 선택해 주세요.')
const stale = () => fail('stale', '이 문구의 원문이나 서식이 변경되었습니다. 현재 입력을 유지하고 최신 초안을 확인해 주세요.')
const unsupported = () => fail('unsupported', '이 문구의 원문 또는 적용 범위를 확인한 뒤 편집할 수 있습니다.')
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0
const token = (value: unknown): value is string => typeof value === 'string' && value.length <= CANVAS_PROTOCOL_LIMITS.identifier
  && /^[A-Za-z0-9_.:-]+$/.test(value) && !value.split(/[.:]/).some(part => ['__proto__', 'prototype', 'constructor'].includes(part))

function canonical(value: unknown): string {
  const order = (item: unknown): unknown => Array.isArray(item) ? item.map(order)
    : isEditorRecord(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, order(item[key])])) : item
  return JSON.stringify(order(value))
}

function keys(value: unknown, required: readonly string[]): value is Record<string, unknown> {
  return isEditorRecord(value) && Object.keys(value).length === required.length && required.every(key => Object.hasOwn(value, key))
}

function array(value: unknown, max: number): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || !value.length || value.length > max
    || Reflect.ownKeys(value).length !== value.length + 1) return false
  return Array.from({ length: value.length }, (_, index) => Object.getOwnPropertyDescriptor(value, String(index)))
    .every(descriptor => descriptor?.enumerable && Object.hasOwn(descriptor, 'value'))
}

function boundary(text: string, position: number): boolean {
  return position === 0 || position === text.length || (position > 0 && position < text.length && snapTextSelection(text, position, position + 1).start === position)
}

function validText(value: unknown): value is string {
  return typeof value === 'string' && isEditorCopyText(value)
    && Array.from(value).every(character => character.length !== 1 || character.charCodeAt(0) < 0xd800 || character.charCodeAt(0) > 0xdfff)
}

function contextReady(context: CanvasGrantContext): boolean {
  return supportsTextSegmentation && isEditorPageId(context.editorPage) && isEditorPageId(context.previewPage)
    && context.previewPage === (context.editorPage === 'common' ? 'home' : context.editorPage)
    && EDITOR_DEVICES.includes(context.device) && (context.scope === 'shared' || context.scope === context.device)
    && context.defaultsTrusted === true && context.loadedOwners.has(context.editorPage)
    && Boolean(context.documents[context.editorPage]) && !validateSiteEditorDocument(context.documents[context.editorPage])
    && isEditorRecord(context.defaults) && integer(context.baseDraftSequence) && context.baseDraftSequence > 0
}

function authorizedField(context: CanvasGrantContext, source: CanvasSourceIdentity): SiteCopyDefinition | null {
  const field = definitions.get(source.key)
  if (!field || source.ownerPage !== context.editorPage || field.page !== source.ownerPage || source.scope !== context.scope
    || (field.inputType && !['text', 'textarea'].includes(field.inputType))) return null
  if (field.sourceDevice && (field.sourceDevice !== context.device || field.sourceDevice !== context.scope)) return null
  if (!richCopyKeys.has(field.key) && !(field.sourceDevice && field.sourceKey && homeRichCopySourceKeys[field.sourceDevice].has(field.sourceKey))) return null
  return field
}

function fieldSnapshot(context: CanvasGrantContext, source: CanvasSourceIdentity, field: SiteCopyDefinition) {
  const document = context.documents[source.ownerPage]!
  const fallback = context.defaults[field.key] ?? field.defaultValue
  if (!validText(fallback)) return null
  const text = resolveEditorCopy(context.documents, source.ownerPage, field.key, fallback, context.device)
  const runs = resolveTextRuns(document, context.device, field.key, text)
  const entry = (values: object | undefined) => values && Object.hasOwn(values, field.key)
    ? { present: true, value: (values as Record<string, unknown>)[field.key] } : { present: false }
  const snapshot = canonical({ source, fallback: { ...entry(context.defaults), resolved: fallback },
    sharedCopy: entry(document.copy), deviceCopy: entry(document.deviceCopy[context.device]),
    sharedRuns: entry(document.textStyles?.shared), deviceRuns: entry(document.textStyles?.[context.device]), text, runs })
  return { text, runs, snapshot }
}

function mergeRanges(ranges: CanvasFieldGrant['ranges']): CanvasFieldGrant['ranges'] {
  const result: CanvasFieldGrant['ranges'] = []
  for (const range of ranges.sort((a, b) => a.start - b.start || a.end - b.end)) {
    const previous = result.at(-1)
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
    else result.push({ ...range })
  }
  return result
}

/**
 * Call only for a block matched to the current explicit renderer registration.
 * The catalog authenticates field ownership, not a static DOM occurrence map.
 */
export function makeCanvasGrant(context: CanvasGrantContext, block: CanvasBlock, options: {
  editId: string; fieldVersionFactory: (source: CanvasSourceIdentity) => string
}): CanvasGrantResult {
  try {
    if (!contextReady(context)) return unsupported()
    if (!isCanvasBlock(block) || !token(block.id) || !token(options.editId) || block.segments.length > CANVAS_PROTOCOL_LIMITS.segments) return invalid()
    if (!block.capabilities.format && !block.capabilities.replaceText) return unsupported()
    const fields = new Map<string, CanvasFieldGrant>()
    const snapshots: Record<string, string> = {}
    for (const segment of block.segments) {
      if (!segment.source) continue
      const source: CanvasSourceIdentity = { ownerPage: segment.source.ownerPage, scope: segment.source.scope, key: segment.source.key }
      const field = authorizedField(context, source)
      if (!field) return unsupported()
      const document = context.documents[source.ownerPage]!
      if (context.scope === 'shared' && (Object.hasOwn(document.deviceCopy[context.device] ?? {}, source.key)
        || Object.hasOwn(document.textStyles?.[context.device] ?? {}, source.key))) return unsupported()
      const resolved = fieldSnapshot(context, source, field)
      if (!resolved || resolved.text !== segment.source.text) return stale()
      let start = segment.sourceStart, end = segment.sourceEnd
      if (segment.transform === 'collapse-whitespace') {
        const raw = resolved.text.slice(start, end)
        if (raw && !raw.trim()) return unsupported()
        start += raw.length - raw.trimStart().length
        end -= raw.length - raw.trimEnd().length
      }
      const key = identity(source)
      let grant = fields.get(key)
      if (!grant) {
        const fieldVersion = options.fieldVersionFactory(source)
        if (!token(fieldVersion)) return invalid()
        grant = { source, fieldVersion, text: resolved.text, runs: structuredClone(resolved.runs), ranges: [] }
        fields.set(key, grant)
        snapshots[key] = resolved.snapshot
      }
      grant.ranges.push({ start, end })
    }
    if (!fields.size || fields.size > CANVAS_PROTOCOL_LIMITS.fields) return unsupported()
    for (const field of fields.values()) field.ranges = mergeRanges(field.ranges)
    const grant: CanvasEditGrant = { editId: options.editId, blockId: block.id, blockRevision: block.revision,
      ownerPage: context.editorPage, scope: context.scope, device: context.device, baseDraftSequence: context.baseDraftSequence, fields: [...fields.values()] }
    if (new TextEncoder().encode(JSON.stringify(grant)).byteLength > CANVAS_PROTOCOL_LIMITS.messageBytes) return invalid()
    return { ok: true, issued: { grant, state: { context: contextIdentity(context), grant: canonical(grant), snapshots, capabilities: { ...block.capabilities } } } }
  } catch { return invalid() }
}

function validEdits(field: CanvasFieldGrant, edits: unknown): edits is CanvasSourcePatch['edits'] {
  if (!array(edits, CANVAS_PROTOCOL_LIMITS.edits)) return false
  let previousStart = -1, previousEnd = 0
  for (const edit of edits) {
    if (!keys(edit, ['start', 'end', 'text', 'runs']) || !integer(edit.start) || !integer(edit.end)
      || edit.start <= previousStart || edit.start < previousEnd || edit.end < edit.start || edit.end > field.text.length
      || !boundary(field.text, edit.start) || !boundary(field.text, edit.end)
      || !field.ranges.some(range => edit.start as number >= range.start && edit.end as number <= range.end)
      || !validText(edit.text) || validateTextStyles({ shared: { replacement: { text: edit.text, runs: edit.runs } } })) return false
    previousStart = edit.start
    previousEnd = edit.end
  }
  return true
}

function inheritedReplacementRuns(field: CanvasFieldGrant, edit: CanvasSourcePatch['edits'][number]): EditorTextRun[] {
  const clipped = field.runs.flatMap(run => {
    const start = Math.max(edit.start, run.start), end = Math.min(edit.end, run.end)
    return start < end ? [{ start: start - edit.start, end: end - edit.start, style: run.style }] : []
  })
  return rebaseTextRuns(field.text.slice(edit.start, edit.end), edit.text, clipped)
}

function spliceField(field: CanvasFieldGrant, edits: CanvasSourcePatch['edits']) {
  let text = '', cursor = 0
  const runs: EditorTextRun[] = []
  const appendRun = (start: number, end: number, run: EditorTextRun) => {
    if (start >= end) return
    const style = canonicalTextStyle(run.style), previous = runs.at(-1)
    if (previous?.end === start && canonical(previous.style) === canonical(style)) previous.end = end
    else runs.push({ start, end, style })
  }
  const appendOriginal = (start: number, end: number) => {
    const offset = text.length
    for (const run of field.runs) {
      const from = Math.max(start, run.start), to = Math.min(end, run.end)
      if (from < to) appendRun(offset + from - start, offset + to - start, run)
    }
    text += field.text.slice(start, end)
  }
  for (const edit of edits) {
    appendOriginal(cursor, edit.start)
    const offset = text.length
    for (const run of edit.runs) appendRun(offset + run.start, offset + run.end, run)
    text += edit.text
    cursor = edit.end
  }
  appendOriginal(cursor, field.text.length)
  return { text, runs }
}

/** Parent field CAS and source splicing only; caller owns operation deduplication and history. */
export function commitCanvasGrant(context: CanvasGrantContext, issued: IssuedCanvasGrant, changes: CanvasSourcePatch[]): CanvasCommitResult {
  try {
    if (!contextReady(context)) return unsupported()
    if (issued.state.context !== contextIdentity(context)) return stale()
    if (issued.state.grant !== canonical(issued.grant) || !array(changes, CANVAS_PROTOCOL_LIMITS.fields)) return invalid()
    for (const field of issued.grant.fields) {
      const definition = authorizedField(context, field.source)
      const resolved = definition && fieldSnapshot(context, field.source, definition)
      if (!resolved || resolved.snapshot !== issued.state.snapshots[identity(field.source)]) return stale()
    }
    const document = structuredClone(context.documents[context.editorPage]!)
    const seen = new Set<string>()
    for (const change of changes) {
      if (!keys(change, ['source', 'fieldVersion', 'edits']) || !keys(change.source, ['ownerPage', 'scope', 'key'])) return invalid()
      const key = identity(change.source as CanvasSourceIdentity)
      const field = issued.grant.fields.find(item => identity(item.source) === key)
      if (!field || seen.has(key) || change.fieldVersion !== field.fieldVersion || !validEdits(field, change.edits)) return invalid()
      seen.add(key)
      if (!issued.state.capabilities.replaceText && change.edits.some(edit => edit.text !== field.text.slice(edit.start, edit.end))) return unsupported()
      if (!issued.state.capabilities.format && change.edits.some(edit => canonical(edit.runs) !== canonical(inheritedReplacementRuns(field, edit)))) return unsupported()
      const next = spliceField(field, change.edits)
      if (next.text === field.text && canonical(next.runs) === canonical(field.runs)) continue
      if (context.scope === 'shared') document.copy[field.source.key] = next.text
      else document.deviceCopy[context.scope] = { ...document.deviceCopy[context.scope], [field.source.key]: next.text }
      if (next.runs.length || document.textStyles?.[context.scope]?.[field.source.key] || document.textStyles?.shared?.[field.source.key]) {
        document.textStyles = { ...document.textStyles, [context.scope]: { ...document.textStyles?.[context.scope], [field.source.key]: next } }
      }
    }
    if (validateSiteEditorDocument(document) || validateEditorCopyFields(document, siteCopyDefinitions.filter(field => field.page === context.editorPage))) return invalid()
    return { ok: true, ownerPage: context.editorPage, document }
  } catch { return invalid() }
}
