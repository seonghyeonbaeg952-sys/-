import type { EditorDevice, EditorFont, EditorStyledCopy, EditorTextRun, EditorTextStyle, SiteEditorDocument } from '../types/siteEditor'

export const EDITOR_FONT_FAMILIES: Record<EditorFont, string> = {
  system: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
  'gothic-a1': '"Gothic A1",sans-serif',
  hahmlet: '"Hahmlet",serif',
  'arita-buri': '"AritaBuri",serif',
  'gowun-batang': '"Gowun Batang",serif',
  grandiflora: '"Grandiflora One",serif',
}
export const EDITOR_FONTS = Object.keys(EDITOR_FONT_FAMILIES) as EditorFont[]
const scopes = ['shared', 'mobile', 'tablet', 'desktop']
const textStyleKeys = ['fontFamily', 'fontSize', 'color', 'fontWeight', 'fontStyle', 'textDecoration'] as const
const unsafeSegments = new Set(['__proto__', 'prototype', 'constructor'])
const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null
export const supportsTextSegmentation = segmenter !== null
const invalidMessage = '선택한 글자의 글꼴, 크기, 색상, 서식과 범위를 확인해 주세요.'
const unsupportedMessage = '이 브라우저에서는 글자 서식을 편집할 수 없습니다. 최신 브라우저를 사용해 주세요.'

export function isEditorRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) return false
  return Reflect.ownKeys(value).every(key => typeof key === 'string'
    && !unsafeSegments.has(key)
    && Object.getOwnPropertyDescriptor(value, key)?.enumerable === true
    && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) ?? {}, 'value'))
}

export function isEditorCopyKey(key: string): boolean {
  return key.length > 0 && key.length <= 120 && /^[a-zA-Z0-9_.-]+$/.test(key)
    && key.split('.').every(segment => segment.length > 0 && !unsafeSegments.has(segment))
}

export function isEditorCopyText(value: unknown): value is string {
  return typeof value === 'string' && Array.from(value).length <= 10000
    && !/<\s*\/?\s*[a-z][^>]*>/i.test(value)
}

function boundaries(text: string): number[] {
  if (segmenter) return [...Array.from(segmenter.segment(text), segment => segment.index), text.length]
  // Read existing documents without taking down older browsers. This fallback
  // checks code-point boundaries only; these browsers never render/edit runs.
  const edges = [0]
  for (const character of text) edges.push(edges[edges.length - 1] + character.length)
  return edges
}

function validStyle(value: unknown, patch = false): value is EditorTextStyle {
  return isEditorRecord(value) && (patch || Object.keys(value).length > 0)
    && Object.entries(value).every(([key, entry]) => {
      if (!textStyleKeys.some(property => property === key)) return false
      if (patch && entry === undefined) return true
      if (key === 'fontFamily') return EDITOR_FONTS.some(font => font === entry)
      if (key === 'fontSize') return typeof entry === 'number' && Number.isFinite(entry) && entry >= 10 && entry <= 120
      if (key === 'color') return typeof entry === 'string' && /^#[0-9a-f]{6}$/i.test(entry)
      if (key === 'fontWeight') return [400, 500, 600, 700, 800].some(weight => weight === entry)
      if (key === 'fontStyle') return entry === 'normal' || entry === 'italic'
      return entry === 'none' || entry === 'underline' || entry === 'line-through'
    })
}

function validStyledCopy(value: unknown): value is EditorStyledCopy {
  if (!isEditorRecord(value) || Object.keys(value).length !== 2 || !isEditorCopyText(value.text)
    || !Array.isArray(value.runs) || value.runs.length > 500) return false
  if (value.runs.length === 0) return true
  const edges = new Set(boundaries(value.text))
  let previousEnd = 0
  for (const run of value.runs) {
    if (!isEditorRecord(run) || Object.keys(run).length !== 3
      || !Number.isInteger(run.start) || !Number.isInteger(run.end)
      || typeof run.start !== 'number' || typeof run.end !== 'number'
      || run.start < previousEnd || run.end <= run.start
      || !edges.has(run.start) || !edges.has(run.end) || !validStyle(run.style)) return false
    previousEnd = run.end
  }
  return true
}

export function validateTextStyles(value: unknown): string | null {
  try {
    if (!isEditorRecord(value) || Object.entries(value).some(([scope, entries]) => !scopes.includes(scope)
      || !isEditorRecord(entries) || Object.entries(entries).some(([key, copy]) => !isEditorCopyKey(key) || !validStyledCopy(copy)))) return invalidMessage
    return null
  } catch {
    return invalidMessage
  }
}

/** Expands a nonempty DOM selection to complete graphemes; offsets stay UTF-16. */
export function snapTextSelection(text: string, start: number, end: number): { start: number; end: number } {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > text.length) throw new RangeError(invalidMessage)
  if (start === end || !segmenter) return { start, end }
  const edges = boundaries(text)
  return { start: edges.findLast(edge => edge <= start) ?? 0, end: edges.find(edge => edge >= end) ?? text.length }
}

/** Stable property order for comparisons/history; undefined means inherit. */
export function canonicalTextStyle(style: EditorTextStyle): EditorTextStyle {
  const result: EditorTextStyle = {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    color: style.color,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecoration,
  }
  for (const key of textStyleKeys) if (result[key] === undefined) delete result[key]
  return result
}

function sameStyle(a: EditorTextStyle, b: EditorTextStyle): boolean {
  return textStyleKeys.every(key => a[key] === b[key])
}

function appendRun(runs: EditorTextRun[], start: number, end: number, style: EditorTextStyle) {
  const canonical = canonicalTextStyle(style)
  if (start >= end || Object.keys(canonical).length === 0) return
  const previous = runs.at(-1)
  if (previous && previous.end === start && sameStyle(previous.style, canonical)) previous.end = end
  else runs.push({ start, end, style: canonical })
}

export function applyTextStyle(text: string, runs: EditorTextRun[], start: number, end: number, patch: EditorTextStyle | null): EditorTextRun[] {
  if (!segmenter) throw new RangeError(unsupportedMessage)
  if (!validStyledCopy({ text, runs }) || (patch !== null && !validStyle(patch, true))) throw new RangeError(invalidMessage)
  const selection = snapTextSelection(text, start, end)
  if (selection.start === selection.end) return structuredClone(runs)
  const edges = [...new Set([0, text.length, selection.start, selection.end, ...runs.flatMap(run => [run.start, run.end])])].sort((a, b) => a - b)
  const result: EditorTextRun[] = []
  let index = 0
  for (let i = 0; i < edges.length - 1; i += 1) {
    const from = edges[i]
    const to = edges[i + 1]
    while (index < runs.length && runs[index].end <= from) index += 1
    let style = { ...(runs[index]?.start <= from ? runs[index].style : {}) }
    if (from >= selection.start && to <= selection.end) {
      style = patch === null ? {} : { ...style, ...patch }
    }
    appendRun(result, from, to, style)
  }
  if (result.length > 500) throw new RangeError('문구 하나에 적용할 수 있는 서식 범위는 500개까지입니다.')
  return result
}

/** Conservatively retains only unchanged prefix/suffix graphemes around one edit. */
export function rebaseTextRuns(oldText: string, newText: string, runs: EditorTextRun[]): EditorTextRun[] {
  if (!validStyledCopy({ text: oldText, runs }) || !isEditorCopyText(newText)) throw new RangeError(invalidMessage)
  if (runs.length === 0) return []
  if (oldText === newText) return structuredClone(runs)
  if (!segmenter) throw new RangeError(unsupportedMessage)
  const oldSegments = Array.from(segmenter.segment(oldText))
  const newSegments = Array.from(segmenter.segment(newText))
  let prefix = 0
  while (prefix < oldSegments.length && prefix < newSegments.length && oldSegments[prefix].segment === newSegments[prefix].segment) prefix += 1
  let suffix = 0
  while (suffix < oldSegments.length - prefix && suffix < newSegments.length - prefix
    && oldSegments[oldSegments.length - suffix - 1].segment === newSegments[newSegments.length - suffix - 1].segment) suffix += 1
  const prefixEnd = oldSegments[prefix]?.index ?? oldText.length
  const suffixStart = oldSegments[oldSegments.length - suffix]?.index ?? oldText.length
  const offset = newText.length - oldText.length
  const result: EditorTextRun[] = []
  for (const run of runs) {
    appendRun(result, run.start, Math.min(run.end, prefixEnd), run.style)
    appendRun(result, Math.max(run.start, suffixStart) + offset, run.end + offset, run.style)
  }
  // A single insertion can split one run into two; retain the safe limit.
  if (result.length > 500) throw new RangeError('문구 하나에 적용할 수 있는 서식 범위는 500개까지입니다.')
  return result
}

export function resolveTextRuns(document: SiteEditorDocument | undefined, scope: 'shared' | EditorDevice, key: string, text: string): EditorTextRun[] {
  if (!supportsTextSegmentation || !document || !isEditorCopyKey(key)) return []
  const candidates = scope === 'shared' ? [document.textStyles?.shared?.[key]] : [document.textStyles?.[scope]?.[key], document.textStyles?.shared?.[key]]
  for (const copy of candidates) if (copy?.text === text && validStyledCopy(copy)) return structuredClone(copy.runs)
  return []
}
