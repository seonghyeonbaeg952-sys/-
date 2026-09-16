import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-site-editor-session-test', logLevel: 'silent', root: process.cwd(), server: { middlewareMode: true } })
const model = await vite.ssrLoadModule('/src/components/admin/site-editor/editorSessionModel.ts').catch(() => ({}))
after(() => vite.close())

const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
const record = (draft = empty(), version = 0) => ({ page_key: 'join', draft, published: null, version, updated_at: '', published_at: null })
function start(draft) {
  assert.equal(typeof model.createEditorSession, 'function', 'editor state must preserve server and local drafts separately')
  return model.createEditorSession(record(draft))
}

test('opening a fresh editor never materializes fallback copy or styles as overrides', () => {
  const session = start()
  assert.deepEqual(session.document, empty())
  assert.equal(session.record.version, 0)
  assert.deepEqual(model.getEditorChanges(session.baseline, session.document), [])
})

test('device edits retain other devices and distinguish blank copy from removing an override', () => {
  let session = start({ ...empty(), copy: { 'join.title': '공통' }, deviceCopy: { desktop: { 'join.title': 'PC' } } })
  session = model.editSessionCopy(session, 'mobile', 'join.title', '')
  assert.equal(session.document.deviceCopy.mobile['join.title'], '')
  assert.equal(session.document.deviceCopy.desktop['join.title'], 'PC')
  assert.equal(session.document.copy['join.title'], '공통')
  session = model.editSessionCopy(session, 'mobile', 'join.title', undefined)
  assert.equal(Object.hasOwn(session.document.deviceCopy.mobile ?? {}, 'join.title'), false)
  assert.deepEqual(model.getEditorChanges(session.baseline, session.document), [])
})

test('successful save updates only the baseline and retains input made while the request was pending', () => {
  let session = model.editSessionCopy(start(), 'mobile', 'join.title', '제출한 제목')
  const submitted = structuredClone(session.document)
  session = model.editSessionCopy(session, 'mobile', 'join.title', '응답 전에 더 입력')
  session = model.editSessionAppearance(session, 'tablet', 'fontSize', 18)
  session = model.acceptEditorSave(session, record(submitted, 1))
  assert.equal(session.record.version, 1)
  assert.equal(session.baseline.deviceCopy.mobile['join.title'], '제출한 제목')
  assert.equal(session.document.deviceCopy.mobile['join.title'], '응답 전에 더 입력')
  assert.equal(session.document.appearance.tablet.fontSize, 18)
  assert.equal(model.getEditorChanges(session.baseline, session.document).length, 2)
})

test('server refresh merges clean fields but blocks conflicting local fields until an explicit choice', () => {
  let session = start({ ...empty(), copy: { title: '원래 제목', body: '원래 본문' } })
  session = model.editSessionCopy(session, 'shared', 'title', '내 제목')
  session = model.reconcileEditorSession(session, record({ ...empty(), copy: { title: '다른 관리자 제목', body: '새 본문' } }, 2))
  assert.equal(session.document.copy.title, '내 제목')
  assert.equal(session.document.copy.body, '새 본문')
  assert.equal(session.conflicts.length, 1)
  const conflict = session.conflicts[0]
  assert.equal(conflict.after, '내 제목')
  assert.equal(conflict.before, '다른 관리자 제목')
  const keepMine = model.resolveEditorConflict(session, conflict.id, 'local')
  assert.equal(keepMine.conflicts.length, 0)
  assert.equal(keepMine.document.copy.title, '내 제목')
  assert.equal(keepMine.record.version, 2)
  const useServer = model.resolveEditorConflict(session, conflict.id, 'server')
  assert.equal(useServer.document.copy.title, '다른 관리자 제목')
  assert.deepEqual(model.getEditorChanges(useServer.baseline, useServer.document), [])
})

test('refresh preserves an intentional local deletion and does not invent conflicts for equal changes', () => {
  let session = start({ ...empty(), copy: { title: '원래 제목' } })
  session = model.editSessionCopy(session, 'shared', 'title', undefined)
  session = model.reconcileEditorSession(session, record({ ...empty(), copy: { title: '다른 제목' } }, 1))
  assert.equal(Object.hasOwn(session.document.copy, 'title'), false)
  assert.equal(session.conflicts.length, 1)
  session = model.reconcileEditorSession(session, record(empty(), 2))
  assert.equal(session.conflicts.length, 0)
})

test('restoring a server revision updates its baseline while preserving edits made during restore', () => {
  let session = start({ ...empty(), copy: { title: '현재', body: '본문' } })
  const submitted = structuredClone(session.document)
  session = model.editSessionCopy(session, 'shared', 'body', '복원 중 추가 입력')
  const restored = record({ ...empty(), copy: { title: '이전 게시 제목', body: '이전 본문' } }, 3)
  session = model.acceptEditorRestore(session, submitted, restored)
  assert.equal(session.document.copy.title, '이전 게시 제목')
  assert.equal(session.document.copy.body, '복원 중 추가 입력')
  assert.equal(session.baseline.copy.body, '이전 본문')
  assert.equal(session.record.version, 3)
})

test('resetting one scope retains the other device and shared overrides', () => {
  let session = start({ ...empty(), copy: { title: '공통' }, deviceCopy: { mobile: { title: '휴대폰' }, desktop: { title: 'PC' } }, appearance: { shared: { fontSize: 16 }, mobile: { fontSize: 18 } } })
  session = model.resetEditorScope(session, 'mobile')
  assert.deepEqual(session.document.copy, { title: '공통' })
  assert.deepEqual(session.document.deviceCopy.desktop, { title: 'PC' })
  assert.deepEqual(session.document.appearance.shared, { fontSize: 16 })
  assert.equal(session.document.deviceCopy.mobile, undefined)
  assert.equal(session.document.appearance.mobile, undefined)
})

test('saved-but-unpublished changes are distinct from local unsaved changes', () => {
  let session = start()
  session = model.editSessionCopy(session, 'shared', 'title', '수정 제목')
  assert.equal(model.getEditorStatus(session).canPublish, false)
  session = model.acceptEditorSave(session, record(session.document, 1))
  assert.equal(model.getEditorStatus(session).canPublish, true)
  session = model.acceptEditorSave(session, { ...session.record, published: structuredClone(session.document), version: 2, published_at: '2026-09-17T00:00:00Z' })
  assert.equal(model.getEditorStatus(session).canPublish, false)
  assert.equal(model.getEditorStatus(session).unpublishedCount, 0)
})

test('late stale reads cannot roll back the acknowledged server version', () => {
  const session = model.createEditorSession(record({ ...empty(), copy: { title: '최신 저장' } }, 4))
  const next = model.reconcileEditorSession(session, record({ ...empty(), copy: { title: '이전 응답' } }, 2))
  assert.equal(next.record.version, 4)
  assert.equal(next.document.copy.title, '최신 저장')
})

test('refreshing an unchanged server draft does not silently resolve an unresolved conflict', () => {
  let session = model.editSessionCopy(start({ ...empty(), copy: { title: '기준' } }), 'shared', 'title', '내 입력')
  const remote = record({ ...empty(), copy: { title: '서버 입력' } }, 1)
  session = model.reconcileEditorSession(session, remote)
  session = model.reconcileEditorSession(session, remote)
  assert.equal(session.conflicts.length, 1)
  assert.equal(model.getEditorStatus(session).canPublish, false)
})

test('catalog number and boolean fields reject values the public renderer would silently replace', () => {
  assert.equal(typeof model.validateEditorCopyFields, 'function')
  const definitions = [
    { key: 'home.mobile.order', label: '표시 순서', inputType: 'number', min: 1, max: 3 },
    { key: 'home.mobile.visible', label: '공개 여부', inputType: 'boolean' },
    { key: 'home.mobile.title', label: '제목', maxLength: 5 },
  ]
  assert.equal(model.validateEditorCopyFields(empty(), definitions), null)
  assert.equal(model.validateEditorCopyFields({ ...empty(), copy: { 'home.mobile.title': '' } }, definitions), null)
  for (const value of ['0', '4', '1.5', '', 'NaN']) assert.ok(model.validateEditorCopyFields({ ...empty(), deviceCopy: { mobile: { 'home.mobile.order': value } } }, definitions))
  assert.ok(model.validateEditorCopyFields({ ...empty(), copy: { 'home.mobile.visible': 'yes' } }, definitions))
  assert.ok(model.validateEditorCopyFields({ ...empty(), copy: { 'home.mobile.title': '여섯글자제목' } }, definitions))
  assert.equal(model.validateEditorCopyFields({ ...empty(), deviceCopy: { mobile: { 'home.mobile.order': '2', 'home.mobile.visible': 'false' } } }, definitions), null)
})

test('exit guard protects a clean page while a publish or restore request is pending', () => {
  assert.equal(typeof model.getEditorExitGuard, 'function')
  assert.equal(model.getEditorExitGuard(0, true).enabled, true)
  assert.equal(model.getEditorExitGuard(1, false).enabled, true)
  assert.equal(model.getEditorExitGuard(0, false).enabled, false)
})

test('conflict comparison tracks further edits to the local value', () => {
  let session = model.editSessionCopy(start({ ...empty(), copy: { title: '기준' } }), 'shared', 'title', '첫 입력')
  session = model.reconcileEditorSession(session, record({ ...empty(), copy: { title: '다른 관리자' } }, 1))
  session = model.editSessionCopy(session, 'shared', 'title', '재검토한 입력')
  assert.equal(session.conflicts[0].after, '재검토한 입력')
  assert.equal(session.conflicts[0].before, '다른 관리자')
})
