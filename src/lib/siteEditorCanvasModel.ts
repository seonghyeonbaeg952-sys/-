import type { EditorDevice, EditorPageId } from '../types/siteEditor'
import { isEditorPageId } from './siteEditorModel'
import { isEditorCopyKey, isEditorCopyText, isEditorRecord, snapTextSelection, supportsTextSegmentation } from './siteEditorTextStyles'

export type CanvasSourceIdentity = { ownerPage: EditorPageId; scope: 'shared' | EditorDevice; key: string }
/** Renderer-observed snapshot, never an authorization or parent CAS token. */
export type CanvasSource = CanvasSourceIdentity & { text: string }
export type CanvasSegment = {
  source: CanvasSource | null
  sourceStart: number
  sourceEnd: number
  visibleStart: number
  visibleEnd: number
  transform: 'exact' | 'slice' | 'collapse-whitespace' | 'literal'
}
export type CanvasBlock = {
  id: string
  label: string
  visibleText: string
  segments: CanvasSegment[]
  capabilities: { format: boolean; replaceText: boolean }
  revision: number
}
export type CanvasSelection = { blockId: string; start: number; end: number; revision: number }
export type CanvasSourceRange = { source: CanvasSource; start: number; end: number }
export type CanvasTextEditResult =
  | { ok: true; changes: Array<{ source: CanvasSource; nextText: string }> }
  | { ok: false; reason: 'stale' | 'unmapped' | 'non-reversible' }

export type CanvasProjectionAtom = Omit<CanvasSegment, 'transform'> & { transform: 'linear' | 'whitespace' | 'literal' }
type ProjectionAtom = CanvasProjectionAtom
const scopes = ['shared', 'mobile', 'tablet', 'desktop']
const sourceIdentity = (source: CanvasSourceIdentity) => JSON.stringify([source.ownerPage, source.scope, source.key])
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0

function hasKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return isEditorRecord(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
}

function validText(value: unknown): value is string {
  return isEditorCopyText(value) && typeof value === 'string'
    && Array.from(value).every(character => character.length !== 1 || character.charCodeAt(0) < 0xd800 || character.charCodeAt(0) > 0xdfff)
}

function validSource(value: unknown): value is CanvasSource {
  return hasKeys(value, ['ownerPage', 'scope', 'key', 'text']) && isEditorPageId(value.ownerPage)
    && typeof value.scope === 'string' && scopes.includes(value.scope)
    && typeof value.key === 'string' && isEditorCopyKey(value.key) && validText(value.text)
}

function plainArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype
    && Reflect.ownKeys(value).length === value.length + 1
    && Reflect.ownKeys(value).every(key => key === 'length' || (typeof key === 'string'
      && /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length
      && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value')))
}

function boundary(text: string, position: number): boolean {
  return position === text.length || (position >= 0 && position < text.length && snapTextSelection(text, position, position + 1).start === position)
}

function projectSegment(segment: CanvasSegment): ProjectionAtom[] {
  if (segment.transform !== 'collapse-whitespace') return [{ ...segment, transform: segment.source ? 'linear' : 'literal' }]
  const raw = segment.source!.text.slice(segment.sourceStart, segment.sourceEnd)
  const atoms: ProjectionAtom[] = []
  let visibleStart = segment.visibleStart
  for (const match of raw.matchAll(/\S+|\s+/g)) {
    const whitespace = /^\s/.test(match[0])
    if (whitespace && (match.index === 0 || match.index + match[0].length === raw.length)) continue
    const visibleEnd = visibleStart + (whitespace ? 1 : match[0].length)
    atoms.push({ source: segment.source, sourceStart: segment.sourceStart + match.index,
      sourceEnd: segment.sourceStart + match.index + match[0].length, visibleStart, visibleEnd,
      transform: whitespace ? 'whitespace' : 'linear' })
    visibleStart = visibleEnd
  }
  // An empty source still has one unambiguous insertion position. Whitespace
  // trimmed from a nonempty source has no guessed insertion position.
  if (!raw) atoms.push({ ...segment, transform: 'linear' })
  return atoms
}

function inspectBlock(value: unknown): ProjectionAtom[] | null {
  if (!supportsTextSegmentation || !hasKeys(value, ['id', 'label', 'visibleText', 'segments', 'capabilities', 'revision'])
    || typeof value.id !== 'string' || !value.id.trim() || !validText(value.id)
    || typeof value.label !== 'string' || !value.label.trim() || !validText(value.label)
    || !validText(value.visibleText) || !integer(value.revision)
    || !plainArray(value.segments) || value.segments.length === 0
    || !hasKeys(value.capabilities, ['format', 'replaceText'])
    || typeof value.capabilities.format !== 'boolean' || typeof value.capabilities.replaceText !== 'boolean') return null
  const snapshots = new Map<string, string>()
  const atoms: ProjectionAtom[] = []
  let cursor = 0
  let owner: EditorPageId | undefined
  for (const segment of value.segments) {
    if (!hasKeys(segment, ['source', 'sourceStart', 'sourceEnd', 'visibleStart', 'visibleEnd', 'transform'])
      || !integer(segment.sourceStart) || !integer(segment.sourceEnd) || segment.sourceEnd < segment.sourceStart
      || !integer(segment.visibleStart) || !integer(segment.visibleEnd) || segment.visibleEnd < segment.visibleStart
      || segment.visibleStart !== cursor || segment.visibleEnd > value.visibleText.length
      || (!value.visibleText ? value.segments.length !== 1 : segment.visibleEnd === segment.visibleStart)
      || !boundary(value.visibleText, segment.visibleStart) || !boundary(value.visibleText, segment.visibleEnd)
      || typeof segment.transform !== 'string' || !['exact', 'slice', 'collapse-whitespace', 'literal'].includes(segment.transform)) return null
    if (segment.transform === 'literal') {
      if (segment.source !== null || segment.sourceStart !== 0 || segment.sourceEnd !== 0) return null
    } else {
      if (!validSource(segment.source) || segment.sourceEnd > segment.source.text.length
        || !boundary(segment.source.text, segment.sourceStart) || !boundary(segment.source.text, segment.sourceEnd)) return null
      if (owner !== undefined && owner !== segment.source.ownerPage) return null
      owner = segment.source.ownerPage
      const identity = sourceIdentity(segment.source)
      if (snapshots.has(identity) && snapshots.get(identity) !== segment.source.text) return null
      snapshots.set(identity, segment.source.text)
      if (segment.transform === 'exact' && (segment.sourceStart !== 0 || segment.sourceEnd !== segment.source.text.length)) return null
      const raw = segment.source.text.slice(segment.sourceStart, segment.sourceEnd)
      const projected = segment.transform === 'collapse-whitespace' ? raw.replace(/\s+/g, ' ').trim() : raw
      if (projected !== value.visibleText.slice(segment.visibleStart, segment.visibleEnd)) return null
    }
    cursor = segment.visibleEnd
    const projected = projectSegment(segment as CanvasSegment)
    if (projected.some(atom => !boundary(value.visibleText as string, atom.visibleStart) || !boundary(value.visibleText as string, atom.visibleEnd)
      || (atom.source && (!boundary(atom.source.text, atom.sourceStart) || !boundary(atom.source.text, atom.sourceEnd))))) return null
    atoms.push(...projected)
  }
  return cursor === value.visibleText.length ? atoms : null
}

/** Strict structure and reversible-map checks; parent ownership/grants remain separate. */
export function isCanvasBlock(value: unknown): value is CanvasBlock {
  try { return inspectBlock(value) !== null } catch { return false }
}

/** Validate once and expose the shared normalization map for local buffer projection. */
export function getCanvasProjectionAtoms(block: CanvasBlock): CanvasProjectionAtom[] | null {
  try {
    return inspectBlock(block)?.map(atom => ({ ...atom, source: atom.source ? { ...atom.source } : null })) ?? null
  } catch { return null }
}

function validSelection(value: unknown, text: string): value is CanvasSelection {
  return hasKeys(value, ['blockId', 'start', 'end', 'revision']) && typeof value.blockId === 'string'
    && integer(value.revision) && integer(value.start) && integer(value.end) && value.start <= text.length && value.end <= text.length
}

function selectedRange(block: CanvasBlock, selection: CanvasSelection): { start: number; end: number } | null {
  const start = Math.min(selection.start, selection.end), end = Math.max(selection.start, selection.end)
  if (start === end && !boundary(block.visibleText, start)) return null
  return snapTextSelection(block.visibleText, start, end)
}

function sourceRange(atom: ProjectionAtom, start: number, end: number, formatting: boolean): CanvasSourceRange | null {
  if (!atom.source) return null
  if (atom.transform === 'whitespace') {
    // Existing projection uses the first original whitespace's style. Replacement
    // uses the entire collapsed run so deleted whitespace cannot reappear.
    const sourceEnd = formatting ? snapTextSelection(atom.source.text, atom.sourceStart, atom.sourceStart + 1).end : atom.sourceEnd
    return { source: atom.source, start: atom.sourceStart, end: sourceEnd }
  }
  return { source: atom.source, start: atom.sourceStart + start - atom.visibleStart, end: atom.sourceStart + end - atom.visibleStart }
}

/** Returns source ranges grouped by first appearance, then sorted/merged per source. */
export function mapCanvasRange(block: CanvasBlock, selection: CanvasSelection): CanvasSourceRange[] {
  try {
    const atoms = inspectBlock(block)
    if (!atoms || !validSelection(selection, block.visibleText) || selection.blockId !== block.id
      || selection.revision !== block.revision || !block.capabilities.format) return []
    const selected = selectedRange(block, selection)
    if (!selected || selected.start === selected.end) return []
    const groups = new Map<string, CanvasSourceRange[]>()
    for (const atom of atoms) {
      const start = Math.max(selected.start, atom.visibleStart), end = Math.min(selected.end, atom.visibleEnd)
      if (start >= end) continue
      const range = sourceRange(atom, start, end, true)
      if (!range) continue
      const key = sourceIdentity(range.source)
      const group = groups.get(key) ?? []
      group.push(range)
      groups.set(key, group)
    }
    return [...groups.values()].flatMap(ranges => {
      const merged: CanvasSourceRange[] = []
      for (const range of ranges.sort((a, b) => a.start - b.start || a.end - b.end)) {
        const previous = merged.at(-1)
        if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end)
        else merged.push({ ...range })
      }
      return merged
    })
  } catch { return [] }
}

function insertionRange(atoms: ProjectionAtom[], position: number): CanvasSourceRange | null {
  const candidates = new Map<string, CanvasSourceRange>()
  for (const atom of atoms) {
    if (!atom.source || position < atom.visibleStart || position > atom.visibleEnd) continue
    const start = atom.transform === 'whitespace'
      ? position === atom.visibleStart ? atom.sourceStart : atom.sourceEnd
      : atom.sourceStart + position - atom.visibleStart
    const range = { source: atom.source, start, end: start }
    candidates.set(JSON.stringify([sourceIdentity(atom.source), start]), range)
  }
  return candidates.size === 1 ? [...candidates.values()][0] : null
}

function replacementRange(atoms: ProjectionAtom[], selected: { start: number; end: number }): CanvasSourceRange | null {
  if (selected.start === selected.end) return insertionRange(atoms, selected.start)
  let replacement: CanvasSourceRange | null = null
  for (const atom of atoms) {
    const start = Math.max(selected.start, atom.visibleStart), end = Math.min(selected.end, atom.visibleEnd)
    if (start >= end) continue
    const range = sourceRange(atom, start, end, false)
    if (!range) return null
    if (replacement) {
      if (sourceIdentity(replacement.source) !== sourceIdentity(range.source) || replacement.end !== range.start) return null
      replacement.end = range.end
    } else replacement = { ...range }
  }
  return replacement
}

/** Exact replacement coordinates, including collapsed whitespace; never inferred from a text diff. */
export function getCanvasReplacementRange(block: CanvasBlock, selection: CanvasSelection): CanvasSourceRange | null {
  try {
    const atoms = inspectBlock(block)
    if (!atoms || !validSelection(selection, block.visibleText) || selection.blockId !== block.id
      || selection.revision !== block.revision || !block.capabilities.replaceText) return null
    const selected = selectedRange(block, selection)
    return selected ? replacementRange(atoms, selected) : null
  } catch { return null }
}

/** Replace only a single proven contiguous source range; never distribute text across keys. */
export function applyCanvasTextEdit(block: CanvasBlock, selection: CanvasSelection, insertedText: string): CanvasTextEditResult {
  try {
    const atoms = inspectBlock(block)
    if (!atoms || !validSelection(selection, block.visibleText) || !validText(insertedText)) return { ok: false, reason: 'unmapped' }
    if (selection.blockId !== block.id || selection.revision !== block.revision) return { ok: false, reason: 'stale' }
    if (!block.capabilities.replaceText) return { ok: false, reason: 'non-reversible' }
    const selected = selectedRange(block, selection)
    if (!selected) return { ok: false, reason: 'unmapped' }
    const replacement = replacementRange(atoms, selected)
    if (!replacement) return { ok: false, reason: 'non-reversible' }
    const { source, start, end } = replacement
    const nextText = source.text.slice(0, start) + insertedText + source.text.slice(end)
    if (!validText(nextText)) return { ok: false, reason: 'unmapped' }
    return { ok: true, changes: [{ source, nextText }] }
  } catch { return { ok: false, reason: 'unmapped' } }
}
