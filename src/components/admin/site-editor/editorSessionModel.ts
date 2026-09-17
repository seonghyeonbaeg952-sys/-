import type { EditorAppearance, EditorDevice, EditorStyledCopy, EditorTextRun, SiteCopyDefinition, SiteEditorDocument, SiteEditorPageRecord } from '../../../types/siteEditor'
import { isEditorCopyText, rebaseTextRuns, resolveTextRuns, supportsTextSegmentation, validateTextStyles } from '../../../lib/siteEditorTextStyles'

export type EditorScope = 'shared' | EditorDevice
export type EditorChange = {
  id: string
  kind: 'copy' | 'appearance' | 'textStyle'
  scope: EditorScope
  key: string
  before: string | number | undefined
  after: string | number | undefined
}
export type EditorSession = {
  record: SiteEditorPageRecord
  baseline: SiteEditorDocument
  document: SiteEditorDocument
  conflicts: EditorChange[]
}

type Field = Omit<EditorChange, 'before' | 'after'> & { value: string | number }

function documentFields(document: SiteEditorDocument) {
  const fields = new Map<string, Field>()
  const add = (kind: Field['kind'], scope: EditorScope, values: Record<string, string | number | undefined>) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue
      const id = JSON.stringify([kind, scope, key])
      fields.set(id, { id, kind, scope, key, value })
    }
  }
  add('copy', 'shared', document.copy)
  for (const scope of ['mobile', 'tablet', 'desktop'] as const) add('copy', scope, document.deviceCopy[scope] ?? {})
  for (const scope of ['shared', 'mobile', 'tablet', 'desktop'] as const) add('appearance', scope, document.appearance[scope] ?? {})
  for (const scope of ['shared', 'mobile', 'tablet', 'desktop'] as const) {
    add('textStyle', scope, Object.fromEntries(Object.entries(document.textStyles?.[scope] ?? {}).map(([key, value]) => [key, JSON.stringify({
      text: value.text,
      runs: value.runs.map(run => ({ start: run.start, end: run.end, style: { fontFamily: run.style.fontFamily, fontSize: run.style.fontSize } })),
    })])))
  }
  return fields
}

export function getEditorChanges(before: SiteEditorDocument, after: SiteEditorDocument): EditorChange[] {
  const previous = documentFields(before)
  const next = documentFields(after)
  return [...new Set([...previous.keys(), ...next.keys()])].flatMap((id) => {
    const oldField = previous.get(id)
    const newField = next.get(id)
    const field = newField ?? oldField
    if (!field || oldField?.value === newField?.value) return []
    return [{ id, kind: field.kind, scope: field.scope, key: field.key, before: oldField?.value, after: newField?.value }]
  })
}

function applyChange(document: SiteEditorDocument, change: EditorChange): SiteEditorDocument {
  if (change.kind === 'textStyle') {
    return setStyledCopy(document, change.scope, change.key, change.after === undefined ? undefined : JSON.parse(String(change.after)) as EditorStyledCopy)
  }
  if (change.kind === 'appearance') {
    const values = { ...document.appearance[change.scope], [change.key]: change.after }
    if (change.after === undefined) delete values[change.key as keyof typeof values]
    const appearance = { ...document.appearance, [change.scope]: values }
    if (Object.keys(values).length === 0) delete appearance[change.scope]
    return { ...document, appearance }
  }
  const values = { ...(change.scope === 'shared' ? document.copy : document.deviceCopy[change.scope]) }
  if (change.after === undefined) delete values[change.key]
  else values[change.key] = String(change.after)
  if (change.scope === 'shared') return { ...document, copy: values }
  const deviceCopy = { ...document.deviceCopy, [change.scope]: values }
  if (Object.keys(values).length === 0) delete deviceCopy[change.scope]
  return { ...document, deviceCopy }
}

function setStyledCopy(document: SiteEditorDocument, scope: EditorScope, key: string, copy: EditorStyledCopy | undefined): SiteEditorDocument {
  const values = { ...document.textStyles?.[scope] }
  if (copy === undefined) delete values[key]
  else values[key] = structuredClone(copy)
  const textStyles = { ...document.textStyles, [scope]: values }
  if (Object.keys(values).length === 0) delete textStyles[scope]
  const next: SiteEditorDocument = { ...document, textStyles }
  if (Object.keys(textStyles).length === 0) delete next.textStyles
  return next
}

function fieldGroup(field: Pick<EditorChange, 'kind' | 'scope' | 'key'>): string {
  return JSON.stringify([field.kind === 'appearance' ? 'appearance' : 'text', field.scope, field.key])
}

/** A copy and its offsets always travel together through refresh/restore/conflicts. */
function transferChange(target: SiteEditorDocument, source: SiteEditorDocument, change: EditorChange): SiteEditorDocument {
  if (change.kind === 'appearance') return applyChange(target, change)
  const copy = change.scope === 'shared' ? source.copy[change.key] : source.deviceCopy[change.scope]?.[change.key]
  const next = applyChange(target, { ...change, kind: 'copy', after: copy })
  return setStyledCopy(next, change.scope, change.key, source.textStyles?.[change.scope]?.[change.key])
}

export function createEditorSession(record: SiteEditorPageRecord): EditorSession {
  return { record: structuredClone(record), baseline: structuredClone(record.draft), document: structuredClone(record.draft), conflicts: [] }
}

export function replaceEditorDocument(session: EditorSession, document: SiteEditorDocument): EditorSession {
  const conflictGroups = new Set(session.conflicts.map(fieldGroup))
  return { ...session, document, conflicts: getEditorChanges(session.baseline, document).filter(change => conflictGroups.has(fieldGroup(change))) }
}

export function editSessionCopy(session: EditorSession, scope: EditorScope, key: string, value: string | undefined): EditorSession {
  const original = session.document
  let document = applyChange(original, { id: JSON.stringify(['copy', scope, key]), kind: 'copy', scope, key, before: undefined, after: value })
  if (value === undefined) document = setStyledCopy(document, scope, key, undefined)
  else if (isEditorCopyText(value) && supportsTextSegmentation) {
    const existing = original.textStyles?.[scope]?.[key] ?? (scope !== 'shared' ? original.textStyles?.shared?.[key] : undefined)
    const previousValue = (scope !== 'shared' ? original.deviceCopy[scope]?.[key] : undefined) ?? original.copy[key]
    // Invalid intermediate typing is kept for the normal save validator. Its last
    // valid snapshot remains dormant, then can be rebased when text is valid again.
    const oldText = isEditorCopyText(previousValue) ? previousValue : existing?.text
    if (existing && oldText !== undefined) {
      const runs = rebaseTextRuns(oldText, value, resolveTextRuns(original, scope, key, oldText))
      document = setStyledCopy(document, scope, key, { text: value, runs })
    }
  }
  return replaceEditorDocument(session, document)
}

export function editSessionTextStyle(session: EditorSession, scope: EditorScope, key: string, text: string, runs: EditorTextRun[]): EditorSession {
  const error = validateTextStyles({ [scope]: { [key]: { text, runs } } })
  if (error) throw new RangeError(error)
  const document = applyChange(session.document, { id: JSON.stringify(['copy', scope, key]), kind: 'copy', scope, key, before: undefined, after: text })
  return replaceEditorDocument(session, setStyledCopy(document, scope, key, { text, runs }))
}

export function editSessionAppearance<K extends keyof EditorAppearance>(session: EditorSession, scope: EditorScope, key: K, value: EditorAppearance[K] | undefined): EditorSession {
  return replaceEditorDocument(session, applyChange(session.document, { id: JSON.stringify(['appearance', scope, key]), kind: 'appearance', scope, key, before: undefined, after: value }))
}

export function acceptEditorSave(session: EditorSession, record: SiteEditorPageRecord): EditorSession {
  if (record.version < session.record.version) return session
  return { ...session, record: structuredClone(record), baseline: structuredClone(record.draft), conflicts: [] }
}

export function reconcileEditorSession(session: EditorSession, record: SiteEditorPageRecord): EditorSession {
  if (record.version < session.record.version) return session
  const localChanges = getEditorChanges(session.baseline, session.document)
  const remoteChanges = new Set(getEditorChanges(session.baseline, record.draft).map(fieldGroup))
  for (const conflict of session.conflicts) remoteChanges.add(fieldGroup(conflict))
  let document = structuredClone(record.draft)
  for (const change of localChanges) document = transferChange(document, session.document, change)
  const conflicts = getEditorChanges(record.draft, document).filter((change) => remoteChanges.has(fieldGroup(change)))
  return { record: structuredClone(record), baseline: structuredClone(record.draft), document, conflicts }
}

export function resolveEditorConflict(session: EditorSession, id: string, choice: 'local' | 'server'): EditorSession {
  const conflict = session.conflicts.find((change) => change.id === id)
  if (!conflict) return session
  return {
    ...session,
    document: choice === 'server' ? transferChange(session.document, session.baseline, { ...conflict, after: conflict.before }) : session.document,
    conflicts: session.conflicts.filter((change) => fieldGroup(change) !== fieldGroup(conflict)),
  }
}

export function acceptEditorRestore(session: EditorSession, submitted: SiteEditorDocument, record: SiteEditorPageRecord): EditorSession {
  if (record.version < session.record.version) return session
  let document = structuredClone(record.draft)
  for (const change of getEditorChanges(submitted, session.document)) document = transferChange(document, session.document, change)
  return { record: structuredClone(record), baseline: structuredClone(record.draft), document, conflicts: [] }
}

export function resetEditorScope(session: EditorSession, scope: EditorScope): EditorSession {
  const document = structuredClone(session.document)
  if (scope === 'shared') document.copy = {}
  else delete document.deviceCopy[scope]
  delete document.appearance[scope]
  if (document.textStyles) {
    delete document.textStyles[scope]
    if (Object.keys(document.textStyles).length === 0) delete document.textStyles
  }
  return replaceEditorDocument(session, document)
}

export function getEditorExitGuard(dirtyPageCount: number, busy: boolean) {
  return {
    enabled: dirtyPageCount > 0 || busy,
    message: busy
      ? '저장·게시 요청을 처리하고 있습니다. 화면을 이동하면 완료 여부를 확인할 수 없습니다. 이동할까요?'
      : '임시저장하지 않은 홈페이지 초안이 있습니다. 다른 화면으로 이동하면 입력을 잃을 수 있습니다. 이동할까요?',
  }
}

export function getEditorStatus(session: EditorSession) {
  const unsavedCount = getEditorChanges(session.baseline, session.document).length
  const unpublishedCount = getEditorChanges(session.record.published ?? { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} }, session.baseline).length
  return { unsavedCount, unpublishedCount, canPublish: unsavedCount === 0 && unpublishedCount > 0 && session.conflicts.length === 0 }
}

export function validateEditorCopyFields(document: SiteEditorDocument, definitions: readonly Pick<SiteCopyDefinition, 'key' | 'label' | 'inputType' | 'min' | 'max' | 'maxLength'>[]): string | null {
  const fields = new Map(definitions.map((definition) => [definition.key, definition]))
  for (const values of [document.copy, ...Object.values(document.deviceCopy)]) {
    for (const [key, value] of Object.entries(values ?? {})) {
      const field = fields.get(key)
      if (!field) continue
      if (field.maxLength !== undefined && Array.from(value).length > field.maxLength) return `${field.label}: ${field.maxLength}자 이내로 입력해 주세요.`
      if (field.inputType === 'boolean' && value !== 'true' && value !== 'false') return `${field.label}: 표시 또는 숨김을 선택해 주세요.`
      if (field.inputType === 'number') {
        const number = Number(value)
        if (!value.trim() || !Number.isInteger(number) || (field.min !== undefined && number < field.min) || (field.max !== undefined && number > field.max)) return `${field.label}: ${field.min ?? 0}–${field.max ?? '최대값'} 사이의 정수를 입력해 주세요.`
      }
    }
  }
  return null
}
