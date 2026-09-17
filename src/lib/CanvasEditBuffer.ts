import { isCanvasBlock, type CanvasBlock } from './siteEditorCanvasModel'
import type { CanvasEditGrant, CanvasSelectionSummary, CanvasSourcePatch } from './siteEditorCanvasProtocol'
import { applyTextStyle, canonicalTextStyle, snapTextSelection, supportsTextSegmentation, validateTextStyles } from './siteEditorTextStyles'
import type { EditorTextRun, EditorTextStyle } from '../types/siteEditor'

type Selection = { start: number; end: number }
type Snapshot = { text: string; runs: EditorTextRun[]; selection: Selection }
export type CanvasEditBuffer = Snapshot & {
  block: CanvasBlock; grant: CanvasEditGrant; sourceRange: Selection
  original: Snapshot; past: Snapshot[]; future: Snapshot[]
  localRevision: number; composing: boolean; compositionStart: Snapshot | null; compositionRange: Selection | null
}
type Result = { ok: true; buffer: CanvasEditBuffer } | { ok: false; buffer: CanvasEditBuffer; reason: string }
const snapshot = (buffer: Snapshot): Snapshot => structuredClone({ text: buffer.text, runs: buffer.runs, selection: buffer.selection })
const equal = (a: Snapshot, b: Snapshot) => a.text === b.text && JSON.stringify(a.runs) === JSON.stringify(b.runs)
const fail = (buffer: CanvasEditBuffer, reason: string): Result => ({ ok: false, buffer, reason })

/** Reverse only a single explicit exact/slice projection. No guessed DOM matches. */
export function createCanvasEditBuffer(block: CanvasBlock, grant: CanvasEditGrant): { ok: true; buffer: CanvasEditBuffer } | { ok: false; reason: string } {
  if (!isCanvasBlock(block) || block.segments.length !== 1 || grant.fields.length !== 1
    || grant.blockId !== block.id || grant.blockRevision !== block.revision) return { ok: false, reason: '이 문구는 목록에서 편집해 주세요.' }
  const segment = block.segments[0], field = grant.fields[0]
  if (!segment.source || !['exact', 'slice'].includes(segment.transform)
    || segment.source.text !== field.text || segment.source.ownerPage !== field.source.ownerPage
    || segment.source.scope !== field.source.scope || segment.source.key !== field.source.key
    || !field.ranges.some(range => range.start <= segment.sourceStart && range.end >= segment.sourceEnd)
    || validateTextStyles({ shared: { text: { text: field.text, runs: field.runs } } })) return { ok: false, reason: '문구 원문을 다시 확인해 주세요.' }
  const runs = field.runs.flatMap(run => {
    const start = Math.max(segment.sourceStart, run.start), end = Math.min(segment.sourceEnd, run.end)
    return start < end ? [{ start: start - segment.sourceStart, end: end - segment.sourceStart, style: { ...run.style } }] : []
  })
  const original = { text: block.visibleText, runs, selection: { start: 0, end: block.visibleText.length } }
  return { ok: true, buffer: { ...snapshot(original), block: structuredClone(block), grant: structuredClone(grant),
    sourceRange: { start: segment.sourceStart, end: segment.sourceEnd }, original: snapshot(original), past: [], future: [],
    localRevision: 0, composing: false, compositionStart: null, compositionRange: null } }
}

function update(buffer: CanvasEditBuffer, next: Snapshot): Result {
  if (validateTextStyles({ shared: { text: { text: next.text, runs: next.runs } } })) return fail(buffer, '문구 또는 서식 범위를 확인해 주세요.')
  const changed = !equal(buffer, next)
  return { ok: true, buffer: { ...buffer, ...next, localRevision: buffer.localRevision + 1,
    past: changed && !buffer.composing ? [...buffer.past, snapshot(buffer)].slice(-50) : buffer.past,
    future: changed && !buffer.composing ? [] : buffer.future } }
}

export function selectCanvasBuffer(buffer: CanvasEditBuffer, selection: Selection): Result {
  try { return { ok: true, buffer: { ...buffer, selection: snapTextSelection(buffer.text, selection.start, selection.end) } } }
  catch { return fail(buffer, '글자를 다시 선택해 주세요.') }
}

function exactSelection(text: string, selection: Selection): Selection {
  if (!supportsTextSegmentation) throw new RangeError()
  const snapped = snapTextSelection(text, selection.start, selection.end)
  if (snapped.start !== selection.start || snapped.end !== selection.end
    || (selection.start < text.length && snapTextSelection(text, selection.start, selection.start + 1).start !== selection.start)) throw new RangeError()
  return { ...selection }
}

function replacementLength(oldText: string, text: string, range: Selection): number {
  exactSelection(oldText, range)
  const inserted = text.length - oldText.length + range.end - range.start
  if (inserted < 0 || oldText.slice(0, range.start) !== text.slice(0, range.start)
    || oldText.slice(range.end) !== text.slice(range.start + inserted)) throw new RangeError()
  return inserted
}

/** A captured caret plus the post-input caret distinguishes backward/forward deletion. */
function replacementRange(oldText: string, text: string, before: Selection, after: Selection): Selection {
  let range = exactSelection(oldText, before)
  const deleted = oldText.length - text.length
  if (range.start === range.end && deleted > 0) {
    if (after.start !== after.end) throw new RangeError()
    if (after.start === range.start - deleted) range = { start: after.start, end: range.start }
    else if (after.start === range.start) range = { start: range.start, end: range.start + deleted }
    else throw new RangeError()
  }
  replacementLength(oldText, text, range)
  return range
}

/** Preserve only the actual untouched characters, never another equal substring. */
function spliceRuns(runs: EditorTextRun[], range: Selection, inserted: number): EditorTextRun[] {
  const offset = inserted - (range.end - range.start), result: EditorTextRun[] = []
  const append = (start: number, end: number, style: EditorTextStyle) => {
    if (start >= end) return
    const next = canonicalTextStyle(style), previous = result.at(-1)
    if (previous?.end === start && JSON.stringify(previous.style) === JSON.stringify(next)) previous.end = end
    else result.push({ start, end, style: next })
  }
  for (const run of runs) {
    append(run.start, Math.min(run.end, range.start), run.style)
    append(Math.max(run.start, range.end) + offset, run.end + offset, run.style)
  }
  return result
}

/** beforeSelection is captured before native input, in the previous buffer's UTF-16 coordinates. */
export function replaceCanvasBufferText(buffer: CanvasEditBuffer, text: string, selection: Selection, composing: boolean, beforeSelection?: Selection): Result {
  try {
    let next = composing && !buffer.composing ? beginCanvasBufferComposition(buffer) : buffer
    if (beforeSelection) {
      const before = exactSelection(buffer.text, beforeSelection)
      if (!next.composing) next = { ...next, selection: before }
      else if (!next.compositionRange && next.compositionStart && next.compositionStart.text === buffer.text) {
        next = { ...next, compositionStart: { ...next.compositionStart, selection: before } }
      }
    }
    const selected = exactSelection(text, snapTextSelection(text, selection.start, selection.end))
    const base = next.composing && next.compositionStart ? next.compositionStart : next
    let runs: EditorTextRun[]
    // IME cancellation and redundant final input events must not erase original runs.
    if (text === base.text) runs = structuredClone(base.runs)
    else if (text === buffer.text) runs = structuredClone(buffer.runs)
    else {
      const range = next.compositionRange ?? replacementRange(base.text, text, base.selection, selected)
      const inserted = replacementLength(base.text, text, range)
      if (next.composing) next = { ...next, compositionRange: range }
      runs = spliceRuns(base.runs, range, inserted)
      // Word/HWP-style plain input follows the selected first character, or the
      // character immediately before a caret. No CSS/HTML is imported on paste.
      const stylePosition = range.start === range.end ? Math.max(0, range.start - 1) : range.start
      const typingStyle = base.runs.find(run => run.start <= stylePosition && run.end > stylePosition)?.style
      if (inserted && typingStyle) runs = applyTextStyle(text, runs, range.start, range.start + inserted, typingStyle)
    }
    const result = update(next, { text, runs, selection: selected })
    return result.ok ? result : fail(buffer, result.reason)
  } catch { return fail(buffer, '문구 또는 서식 범위를 확인해 주세요.') }
}

export function applyCanvasBufferStyle(buffer: CanvasEditBuffer, selection: Selection, patch: EditorTextStyle | null): Result {
  if (buffer.composing) return fail(buffer, '한글 입력을 마친 뒤 서식을 바꿔 주세요.')
  try {
    const range = snapTextSelection(buffer.text, selection.start, selection.end)
    return update({ ...buffer, selection: range }, { text: buffer.text, selection: range, runs: applyTextStyle(buffer.text, buffer.runs, range.start, range.end, patch) })
  } catch { return fail(buffer, '선택한 서식의 값과 범위를 확인해 주세요.') }
}

export function beginCanvasBufferComposition(buffer: CanvasEditBuffer): CanvasEditBuffer {
  return buffer.composing ? buffer : { ...buffer, composing: true, compositionStart: snapshot(buffer), compositionRange: null }
}
export function endCanvasBufferComposition(buffer: CanvasEditBuffer): CanvasEditBuffer {
  const start = buffer.compositionStart
  const changed = start && !equal(start, buffer)
  return { ...buffer, composing: false, compositionStart: null, compositionRange: null,
    past: changed ? [...buffer.past, start].slice(-50) : buffer.past,
    future: changed ? [] : buffer.future }
}
export function moveCanvasBufferHistory(buffer: CanvasEditBuffer, direction: 'undo' | 'redo'): Result {
  if (buffer.composing) return fail(buffer, '한글 입력 중에는 실행을 취소할 수 없습니다.')
  const history = direction === 'undo' ? buffer.past : buffer.future
  const target = history.at(-1)
  if (!target) return { ok: true, buffer }
  return { ok: true, buffer: { ...buffer, ...snapshot(target), localRevision: buffer.localRevision + 1,
    past: direction === 'undo' ? buffer.past.slice(0, -1) : [...buffer.past, snapshot(buffer)].slice(-50),
    future: direction === 'undo' ? [...buffer.future, snapshot(buffer)].slice(-50) : buffer.future.slice(0, -1) } }
}
export function getCanvasBufferSummary(buffer: CanvasEditBuffer): CanvasSelectionSummary {
  const style: CanvasSelectionSummary['style'] = {}
  const { start, end } = buffer.selection
  const positions = [...new Set([start, ...buffer.runs.flatMap(run => [run.start, run.end]).filter(value => value > start && value < end)])]
  for (const key of ['fontFamily', 'fontSize', 'color', 'fontWeight', 'fontStyle', 'textDecoration'] as const) {
    const values = positions.map(position => buffer.runs.find(run => run.start <= position && run.end > position)?.style[key])
    if (values.some(value => value !== values[0])) style[key] = 'mixed'
    else if (values[0] !== undefined) Object.assign(style, { [key]: values[0] })
  }
  return { style, canUndo: buffer.past.length > 0, canRedo: buffer.future.length > 0, composing: buffer.composing, dirty: !equal(buffer, buffer.original) }
}
export function getCanvasBufferChanges(buffer: CanvasEditBuffer): CanvasSourcePatch[] {
  const field = buffer.grant.fields[0]
  return [{ source: { ...field.source }, fieldVersion: field.fieldVersion,
    edits: [{ ...buffer.sourceRange, text: buffer.text, runs: structuredClone(buffer.runs) }] }]
}
