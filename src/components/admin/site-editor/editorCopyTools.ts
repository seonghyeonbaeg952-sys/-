import type { EditorTextRun, SiteCopyDefinition, SiteEditorDocument } from '../../../types/siteEditor'
import { applyTextStyle, isEditorCopyText, resolveTextRuns, snapTextSelection } from '../../../lib/siteEditorTextStyles'
import { validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import type { EditorScope } from './editorSessionModel'

export type CopySearchOptions = { matchCase: boolean; wholeWord: boolean }
export type CopyMatch = { start: number; end: number }
export type CopyReplacementItem = { key: string; label: string; before: string; after: string; runs: EditorTextRun[]; occurrences: number; snapshot: string }
export type CopyReplacementPlan = { scope: EditorScope; items: CopyReplacementItem[]; occurrences: number; error: string | null }
const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', { granularity: 'grapheme' }) : null
const words = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ko', { granularity: 'word' }) : null
const wordCharacter = /[\p{L}\p{M}\p{N}_]/u

export function findCopyMatches(text: string, query: string, options: CopySearchOptions): CopyMatch[] {
  if (!query || !graphemes) return []
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const expression = new RegExp(escaped, options.matchCase ? 'gu' : 'giu')
  const edges = new Set([...Array.from(graphemes.segment(text), part => part.index), text.length])
  return Array.from(text.matchAll(expression)).flatMap(match => {
    const start = match.index, end = start + match[0].length
    if (!edges.has(start) || !edges.has(end)) return []
    if (options.wholeWord && (wordCharacter.test(Array.from(text.slice(0, start)).at(-1) ?? '') || wordCharacter.test(Array.from(text.slice(end))[0] ?? ''))) return []
    return [{ start, end }]
  })
}

export function copyValue(field: SiteCopyDefinition, document: SiteEditorDocument, scope: EditorScope, defaults: Record<string, string>): string {
  return (scope === 'shared' ? undefined : document.deviceCopy[scope]?.[field.key]) ?? document.copy[field.key] ?? defaults[field.key] ?? field.defaultValue
}

export function copyIsOverridden(document: SiteEditorDocument, scope: EditorScope, key: string): boolean {
  return Object.hasOwn(scope === 'shared' ? document.copy : document.deviceCopy[scope] ?? {}, key) || Object.hasOwn(document.textStyles?.[scope] ?? {}, key)
}

export function inspectCopyText(text: string, maxLength = 10000): string[] {
  const issues: string[] = []
  if (!text.trim()) issues.push('빈 문구')
  if (text && text !== text.trim()) issues.push('앞뒤 공백')
  if (/[^\S\r\n]{2,}/u.test(text)) issues.push('연속 공백')
  if (Array.from(text).length > maxLength) issues.push('길이 초과')
  return issues
}

export function copyTextStats(text: string) {
  return { characters: graphemes ? Array.from(graphemes.segment(text)).length : Array.from(text).length,
    words: words ? Array.from(words.segment(text)).filter(part => part.isWordLike).length : text.trim().split(/\s+/u).filter(Boolean).length,
    lines: text.split(/\r\n|\r|\n/).length }
}

function snapshot(field: SiteCopyDefinition, document: SiteEditorDocument, scope: EditorScope, defaults: Record<string, string>) {
  return JSON.stringify([copyValue(field, document, scope, defaults), document.copy[field.key], scope === 'shared' ? null : document.deviceCopy[scope]?.[field.key],
    document.textStyles?.shared?.[field.key], scope === 'shared' ? null : document.textStyles?.[scope]?.[field.key]])
}

/** Exact occurrence offsets, not a prefix/suffix diff: repeated words retain their own formatting. */
function replaceMatches(text: string, runs: EditorTextRun[], matches: CopyMatch[], replacement: string) {
  let nextText = text, nextRuns = structuredClone(runs)
  for (const match of [...matches].reverse()) {
    const range = snapTextSelection(nextText, match.start, match.end)
    if (range.start !== match.start || range.end !== match.end) throw new RangeError('완전한 글자를 선택해 주세요.')
    const delta = replacement.length - (match.end - match.start)
    const style = nextRuns.find(run => run.start <= match.start && run.end > match.start)?.style
    nextRuns = nextRuns.flatMap(run => {
      const result: EditorTextRun[] = []
      if (run.start < match.start) result.push({ ...run, end: Math.min(run.end, match.start) })
      if (run.end > match.end) result.push({ ...run, start: Math.max(run.start, match.end) + delta, end: run.end + delta })
      return result
    })
    nextText = nextText.slice(0, match.start) + replacement + nextText.slice(match.end)
    // A combining mark, jamo or ZWJ can join an untouched neighbour after the
    // replacement. Never let formatting's normal selection snapping expand it.
    const inserted = snapTextSelection(nextText, match.start, match.start + replacement.length)
    if (inserted.start !== match.start || inserted.end !== match.start + replacement.length) throw new RangeError('바꾼 글자가 주변 글자와 합쳐집니다. 전체 글자를 포함해 다시 선택해 주세요.')
    if (style && replacement) nextRuns = applyTextStyle(nextText, nextRuns, match.start, match.start + replacement.length, style)
  }
  // Canonicalize adjacent equal runs and validate the resulting grapheme boundaries.
  return { text: nextText, runs: nextRuns.length ? applyTextStyle(nextText, nextRuns, 0, nextText.length, {}) : [] }
}

export function planCopyReplacement(definitions: readonly SiteCopyDefinition[], document: SiteEditorDocument, scope: EditorScope, defaults: Record<string, string>, query: string, replacement: string, options: CopySearchOptions, occurrence?: { key: string; start: number }): CopyReplacementPlan {
  const plan: CopyReplacementPlan = { scope, items: [], occurrences: 0, error: null }
  if (!query) return { ...plan, error: '먼저 찾을 단어를 입력해 주세요.' }
  if (!isEditorCopyText(replacement)) return { ...plan, error: '바꿀 문구는 HTML 없이 10,000자 이내로 입력해 주세요.' }
  try {
    for (const field of definitions) {
      if ((field.sourceDevice && field.sourceDevice !== scope) || (field.inputType && !['text', 'textarea'].includes(field.inputType)) || (occurrence && occurrence.key !== field.key)) continue
      const before = copyValue(field, document, scope, defaults)
      const matches = findCopyMatches(before, query, options).filter(match => !occurrence || occurrence.start === match.start)
      if (!matches.length) continue
      const result = replaceMatches(before, resolveTextRuns(document, scope, field.key, before), matches, replacement)
      if (result.text === before) continue
      if (!isEditorCopyText(result.text) || Array.from(result.text).length > (field.maxLength ?? 10000)) return { ...plan, items: [], occurrences: 0, error: `${field.label}: 바꾼 문구가 입력 가능한 길이를 넘거나 HTML을 포함합니다.` }
      plan.items.push({ key: field.key, label: field.label, before, after: result.text, runs: result.runs, occurrences: matches.length, snapshot: snapshot(field, document, scope, defaults) })
      plan.occurrences += matches.length
    }
  } catch { return { ...plan, items: [], occurrences: 0, error: '글자 서식과 선택 범위를 확인해 주세요. 변경하지 않았습니다.' } }
  return plan
}

export function applyCopyReplacement(document: SiteEditorDocument, plan: CopyReplacementPlan, definitions: readonly SiteCopyDefinition[], scope: EditorScope, defaults: Record<string, string>, keys = plan.items.map(item => item.key)):
  { ok: true; document: SiteEditorDocument; count: number } | { ok: false; message: string } {
  if (plan.error || plan.scope !== scope || !keys.length || new Set(keys).size !== keys.length || keys.some(key => !plan.items.some(item => item.key === key))) return { ok: false, message: plan.error ?? '바꿀 항목과 적용 기기를 확인해 주세요.' }
  const selected = plan.items.filter(item => keys.includes(item.key))
  const fields = new Map(definitions.map(field => [field.key, field]))
  for (const item of selected) {
    const field = fields.get(item.key)
    if (!field || (field.sourceDevice && field.sourceDevice !== scope) || snapshot(field, document, scope, defaults) !== item.snapshot) return { ok: false, message: '미리보기 이후 문구나 서식이 바뀌었습니다. 다시 미리본 뒤 적용하세요. 입력은 유지됩니다.' }
    if ((field.inputType && !['text', 'textarea'].includes(field.inputType)) || Array.from(item.after).length > (field.maxLength ?? 10000)) return { ok: false, message: '이 항목은 문구 바꾸기 대상이 아니거나 길이를 초과했습니다.' }
  }
  const next = structuredClone(document)
  for (const item of selected) {
    const values = scope === 'shared' ? next.copy : (next.deviceCopy[scope] ??= {})
    values[item.key] = item.after
    if (item.runs.length || next.textStyles?.[scope]?.[item.key] || (scope !== 'shared' && next.textStyles?.shared?.[item.key])) {
      next.textStyles ??= {}; next.textStyles[scope] ??= {}
      next.textStyles[scope]![item.key] = { text: item.after, runs: structuredClone(item.runs) }
    }
  }
  const error = validateSiteEditorDocument(next)
  return error ? { ok: false, message: error } : { ok: true, document: next, count: selected.reduce((sum, item) => sum + item.occurrences, 0) }
}
