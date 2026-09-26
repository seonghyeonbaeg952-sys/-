import type { EditorPageId, SiteEditorDocument } from '../types/siteEditor'
import { isEditorCopyText } from './siteEditorTextStyles'
import { getEditorBoxKey, isEditorBoxAnchor, parseEditorBoxKey } from './siteEditorModel'
export { getEditorBoxKey, isEditorBoxAnchor, isEditorAddedBoxId } from './siteEditorModel'

export type EditorAddedBox = { id: string; anchor: string; text: string }
const MAX_BOXES_PER_PAGE = 50

/** Prefer explicit ids; otherwise use a unique semantic class, never a DOM index. */
export function chooseEditorSectionAnchors(sections: readonly { id: string; classes: readonly string[] }[]): string[] {
  const frequency = new Map<string, number>()
  for (const section of sections) for (const name of new Set(section.classes)) frequency.set(name, (frequency.get(name) ?? 0) + 1)
  const generic = new Set(['flow-section', 'home-section', 'relative', 'container', 'grid', 'flex', 'section'])
  return sections.map(section => {
    if (isEditorBoxAnchor(section.id)) return section.id
    const name = section.classes.find(value => !generic.has(value) && frequency.get(value) === 1 && isEditorBoxAnchor(`class-${value}`))
    return name ? `class-${name}` : ''
  })
}
export function listEditorTextBoxes(document: SiteEditorDocument | undefined, page: EditorPageId): EditorAddedBox[] {
  if (!document || document.schemaVersion !== 1) return []
  return Object.entries(document.copy).flatMap(([id, text]) => {
    const parsed = parseEditorBoxKey(id)
    if (!parsed || parsed.page !== page || parsed.kind !== 'text' || !isEditorCopyText(text)) return []
    const anchor = document.copy[`${page}.box.${parsed.uid}.anchor`]
    return typeof anchor === 'string' && isEditorBoxAnchor(anchor) ? [{ id, anchor, text }] : []
  }).slice(0, MAX_BOXES_PER_PAGE)
}

export function addEditorTextBox(document: SiteEditorDocument, page: EditorPageId, anchor: string, text: string, uid: string): { id: string; document: SiteEditorDocument } {
  if (!isEditorBoxAnchor(anchor) || !isEditorCopyText(text) || !text.trim() || text.length > 1000) throw new RangeError('새 문구와 배치할 영역을 확인해 주세요.')
  const id = getEditorBoxKey(page, uid)
  const anchorKey = `${page}.box.${uid}.anchor`
  if (Object.hasOwn(document.copy, id) || Object.hasOwn(document.copy, anchorKey) || listEditorTextBoxes(document, page).length >= MAX_BOXES_PER_PAGE) throw new RangeError('같은 문구 상자가 있거나 상자 수가 많습니다.')
  return { id, document: { ...document, copy: { ...document.copy, [id]: text, [anchorKey]: anchor } } }
}

export function removeEditorTextBox(document: SiteEditorDocument, page: EditorPageId, id: string): SiteEditorDocument {
  const parsed = parseEditorBoxKey(id)
  if (!parsed || parsed.page !== page || parsed.kind !== 'text' || !Object.hasOwn(document.copy, id)) throw new RangeError('삭제할 문구 상자를 확인해 주세요.')
  const next = structuredClone(document)
  delete next.copy[id]
  delete next.copy[`${page}.box.${parsed.uid}.anchor`]
  for (const device of ['mobile', 'tablet', 'desktop'] as const) {
    if (next.deviceCopy[device]) { delete next.deviceCopy[device]![id]; if (!Object.keys(next.deviceCopy[device]!).length) delete next.deviceCopy[device] }
    if (next.textLayouts?.[device]) { delete next.textLayouts[device]![id]; if (!Object.keys(next.textLayouts[device]!).length) delete next.textLayouts[device] }
  }
  for (const scope of ['shared', 'mobile', 'tablet', 'desktop'] as const) {
    if (next.textStyles?.[scope]) { delete next.textStyles[scope]![id]; if (!Object.keys(next.textStyles[scope]!).length) delete next.textStyles[scope] }
  }
  if (next.textLayouts && !Object.keys(next.textLayouts).length) delete next.textLayouts
  if (next.textStyles && !Object.keys(next.textStyles).length) delete next.textStyles
  return next
}
