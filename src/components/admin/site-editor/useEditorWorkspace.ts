import { useCallback, useEffect, useRef, useState } from 'react'
import { loadEditorPage, loadEditorRevisions, publishEditorPage, restoreEditorRevision, saveEditorDraft } from '../../../lib/siteEditorApi'
import { validateSiteEditorDocument } from '../../../lib/siteEditorModel'
import { siteCopyDefinitions } from '../../../content/siteCopyCatalog'
import type { EditorPageId, SiteEditorPageRecord, SiteEditorRevision } from '../../../types/siteEditor'
import { acceptEditorRestore, acceptEditorSave, createEditorSession, getEditorStatus, reconcileEditorSession, validateEditorCopyFields, type EditorSession } from './editorSessionModel'

type Sessions = Partial<Record<EditorPageId, EditorSession>>
type Action = { page: EditorPageId; kind: 'save' | 'publish' | 'restore' } | null

export function useEditorWorkspace(page: EditorPageId) {
  const [sessions, setSessions] = useState<Sessions>({})
  const sessionsRef = useRef<Sessions>({})
  const [loading, setLoading] = useState<Partial<Record<EditorPageId, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<EditorPageId, string | null>>>({})
  const [messages, setMessages] = useState<Partial<Record<EditorPageId, string | null>>>({})
  const [histories, setHistories] = useState<Partial<Record<EditorPageId, SiteEditorRevision[]>>>({})
  const [historyErrors, setHistoryErrors] = useState<Partial<Record<EditorPageId, string | null>>>({})
  const [historyLoading, setHistoryLoading] = useState<Partial<Record<EditorPageId, boolean>>>({})
  const [action, setAction] = useState<Action>(null)
  const busyRef = useRef(false)
  const mounted = useRef(true)
  const loads = useRef<Partial<Record<EditorPageId, number>>>({})
  const historyLoads = useRef<Partial<Record<EditorPageId, number>>>({})

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const updateSession = useCallback((target: EditorPageId, update: (session: EditorSession) => EditorSession) => {
    const current = sessionsRef.current[target]
    if (!current || !mounted.current) return
    const next = { ...sessionsRef.current, [target]: update(current) }
    sessionsRef.current = next
    setSessions(next)
  }, [])

  const refresh = useCallback(async (target: EditorPageId) => {
    const sequence = (loads.current[target] ?? 0) + 1
    loads.current[target] = sequence
    try {
      const result = await loadEditorPage(target)
      if (!mounted.current || loads.current[target] !== sequence) return
      if (!result.data || result.error) {
        setErrors((current) => ({ ...current, [target]: result.error || '저장된 초안을 확인하지 못했습니다. 다시 시도해 주세요.' }))
        return
      }
      const current = sessionsRef.current[target]
      const next = { ...sessionsRef.current, [target]: current ? reconcileEditorSession(current, result.data) : createEditorSession(result.data) }
      sessionsRef.current = next
      setSessions(next)
      setErrors((currentErrors) => ({ ...currentErrors, [target]: null }))
      if (current) setMessages((currentMessages) => ({ ...currentMessages, [target]: '최신 초안을 불러왔습니다. 미저장 입력은 유지되며 겹친 항목은 아래에서 선택하세요.' }))
    } catch {
      if (mounted.current && loads.current[target] === sequence) setErrors((current) => ({ ...current, [target]: '초안을 불러오지 못했습니다. 입력은 유지됩니다. 인터넷 연결을 확인해 주세요.' }))
    } finally {
      if (mounted.current && loads.current[target] === sequence) setLoading((current) => ({ ...current, [target]: false }))
    }
  }, [])

  const refreshHistory = useCallback(async (target: EditorPageId) => {
    const sequence = (historyLoads.current[target] ?? 0) + 1
    historyLoads.current[target] = sequence
    try {
      const result = await loadEditorRevisions(target)
      if (!mounted.current || historyLoads.current[target] !== sequence) return
      setHistoryErrors((current) => ({ ...current, [target]: result.error }))
      if (result.data) setHistories((current) => ({ ...current, [target]: result.data ?? [] }))
    } catch {
      if (mounted.current && historyLoads.current[target] === sequence) setHistoryErrors((current) => ({ ...current, [target]: '게시 이력을 불러오지 못했습니다. 다시 시도해 주세요.' }))
    } finally {
      if (mounted.current && historyLoads.current[target] === sequence) setHistoryLoading((current) => ({ ...current, [target]: false }))
    }
  }, [])

  useEffect(() => {
    let active = true
    // Start after the committed effect; StrictMode's discarded mount must not
    // issue a second request or update the next page's loading state.
    queueMicrotask(() => {
      if (!active) return
      if (!sessionsRef.current[page]) void refresh(page)
      void refreshHistory(page)
    })
    return () => { active = false }
  }, [page, refresh, refreshHistory])

  const edit = useCallback((target: EditorPageId, update: (session: EditorSession) => EditorSession) => {
    updateSession(target, update)
    setMessages((current) => ({ ...current, [target]: null }))
  }, [updateSession])

  const run = useCallback(async (target: EditorPageId, kind: NonNullable<Action>['kind'], revision?: SiteEditorRevision) => {
    const current = sessionsRef.current[target]
    if (!current || busyRef.current) return false
    const status = getEditorStatus(current)
    const validation = validateSiteEditorDocument(current.document) || validateEditorCopyFields(current.document, siteCopyDefinitions.filter((field) => field.page === target))
    const error = validation || (current.conflicts.length ? '겹친 항목의 사용할 값을 먼저 선택해 주세요.' : null)
      || (kind !== 'save' && status.unsavedCount ? '미저장 변경사항을 먼저 임시저장해 주세요.' : null)
      || (kind === 'publish' && !status.canPublish ? '현재 초안과 게시본이 같습니다. 게시할 변경사항이 없습니다.' : null)
      || (kind === 'restore' && (!revision || revision.page_key !== target) ? '이 화면의 게시 이력을 선택해 주세요.' : null)
    if (error) {
      setErrors((previous) => ({ ...previous, [target]: error }))
      return false
    }
    if (kind === 'save' && !status.unsavedCount) return true
    const snapshot = structuredClone(current.document)
    busyRef.current = true
    setAction({ page: target, kind })
    setErrors((previous) => ({ ...previous, [target]: null }))
    setMessages((previous) => ({ ...previous, [target]: null }))
    try {
      const result = kind === 'save' ? await saveEditorDraft(target, snapshot, current.record.version)
        : kind === 'publish' ? await publishEditorPage(target, current.record.version)
          : await restoreEditorRevision(revision!.id, current.record.version)
      if (!mounted.current) return false
      if (!result.data || result.error) {
        setErrors((previous) => ({ ...previous, [target]: result.error || '처리 결과를 확인하지 못했습니다. 입력은 유지됩니다.' }))
        return false
      }
      const nextRecord: SiteEditorPageRecord = result.data
      updateSession(target, (latest) => kind === 'restore' ? acceptEditorRestore(latest, snapshot, nextRecord) : acceptEditorSave(latest, nextRecord))
      setMessages((previous) => ({ ...previous, [target]: kind === 'save' ? '초안을 임시저장했습니다. 공개 홈페이지는 바뀌지 않았습니다.' : kind === 'publish' ? '이 화면을 홈페이지에 게시했습니다. 공개 창을 새로고침해 확인하세요.' : '이전 게시본을 초안으로 불러왔습니다. 확인 후 다시 게시해 주세요.' }))
      if (kind !== 'save') void refreshHistory(target)
      return true
    } catch {
      if (mounted.current) setErrors((previous) => ({ ...previous, [target]: '처리 결과를 확인하지 못했습니다. 입력은 유지됩니다. 최신 초안과 비교한 뒤 다시 시도하세요.' }))
      return false
    } finally {
      busyRef.current = false
      if (mounted.current) setAction(null)
    }
  }, [refreshHistory, updateSession])

  return {
    sessions, session: sessions[page], loading: loading[page] ?? (!sessions[page] && !errors[page]), error: errors[page] ?? null,
    message: messages[page] ?? null, action, edit,
    refresh: () => { setLoading((current) => ({ ...current, [page]: true })); return refresh(page) },
    save: () => run(page, 'save'), publish: () => run(page, 'publish'), restore: (revision: SiteEditorRevision) => run(page, 'restore', revision),
    revisions: histories[page] ?? [], historyLoading: historyLoading[page] ?? (!histories[page] && !historyErrors[page]), historyError: historyErrors[page] ?? null,
    refreshHistory: () => { setHistoryLoading((current) => ({ ...current, [page]: true })); return refreshHistory(page) },
  }
}
