import { getTextLayoutDefinition } from '../../../content/textLayoutCatalog'
import { canonicalTextLayout, isEditorTextLayout, resolveTextLayout } from '../../../lib/siteEditorLayout'
import { validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import type { EditorDevice, EditorPageId, EditorTextLayout, SiteEditorDocument } from '../../../types/siteEditor'
import { editSessionTextLayout, type EditorSession } from './editorSessionModel'

export type PlacementChangeResult = { ok: true; document: SiteEditorDocument; session: EditorSession } | { ok: false; message: string }
export function applyPlacementChange(session: EditorSession, page: EditorPageId, device: EditorDevice, id: string, before: EditorTextLayout, value?: EditorTextLayout): PlacementChangeResult {
  const definition = getTextLayoutDefinition(id)
  if (!definition || definition.page !== page || session.record.page_key !== page
    || !['mobile', 'tablet', 'desktop'].includes(device) || !isEditorTextLayout(before) || !isEditorTextLayout(value ?? {})) {
    return { ok: false, message: '이 화면에서 배치할 수 있는 문구와 올바른 위치 값을 선택하세요.' }
  }
  if (session.conflicts.length || JSON.stringify(canonicalTextLayout(resolveTextLayout(session.document, device, id) ?? {})) !== JSON.stringify(canonicalTextLayout(before))) {
    return { ok: false, message: '그동안 배치가 변경되었습니다. 현재 배치를 확인한 뒤 다시 조절하세요.' }
  }
  const next = editSessionTextLayout(session, device, id, value)
  const error = validateSiteEditorDocument(next.document)
  return error ? { ok: false, message: error } : { ok: true, document: next.document, session: next }
}
