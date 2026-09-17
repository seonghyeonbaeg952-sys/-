import type { SiteEditorDocument } from '../../../types/siteEditor'
import { getEditorChanges } from './editorSessionModel'

type Entry = { before: SiteEditorDocument; after: SiteEditorDocument }
export type CanvasDocumentHistory = { past: Entry[]; future: Entry[] }
export const emptyCanvasHistory = (): CanvasDocumentHistory => ({ past: [], future: [] })
export function recordCanvasHistory(history: CanvasDocumentHistory, before: SiteEditorDocument, after: SiteEditorDocument): CanvasDocumentHistory {
  if (!getEditorChanges(before, after).length) return history
  return { past: [...history.past, structuredClone({ before, after })].slice(-50), future: [] }
}
export function moveCanvasHistory(history: CanvasDocumentHistory, current: SiteEditorDocument, direction: 'undo' | 'redo'):
  { ok: true; document: SiteEditorDocument; history: CanvasDocumentHistory } | { ok: false; message: string } {
  const entries = direction === 'undo' ? history.past : history.future, entry = entries.at(-1)
  if (!entry) return { ok: false, message: '되돌릴 화면 편집이 없습니다.' }
  if (getEditorChanges(direction === 'undo' ? entry.after : entry.before, current).length) return { ok: false, message: '이후 다른 항목이나 최신 초안이 변경되어 덮어쓰지 않았습니다. 현재 문구를 확인해 주세요.' }
  return { ok: true, document: structuredClone(direction === 'undo' ? entry.before : entry.after), history: {
    past: direction === 'undo' ? history.past.slice(0, -1) : [...history.past, entry].slice(-50),
    future: direction === 'undo' ? [...history.future, entry].slice(-50) : history.future.slice(0, -1),
  } }
}
