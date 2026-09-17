import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString('base64')}`
const stylesUrl = moduleUrl(await readFile(new URL('../../../lib/siteEditorTextStyles.ts', import.meta.url), 'utf8'))
const model = await import(moduleUrl((await readFile(new URL('./editorSessionModel.ts', import.meta.url), 'utf8')).replaceAll("'../../../lib/siteEditorTextStyles'", JSON.stringify(stylesUrl))))

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

const run = (start, end, fontSize = 24) => ({ start, end, style: { fontSize } })

test('character formatting stores the exact copy with styles and text edits rebase preserved characters', () => {
  assert.equal(typeof model.editSessionTextStyle, 'function')
  let session = model.editSessionTextStyle(start(), 'shared', 'title', 'abcd', [run(0, 4)])
  assert.equal(session.document.copy.title, 'abcd')
  assert.deepEqual(session.document.textStyles.shared.title, { text: 'abcd', runs: [run(0, 4)] })
  assert.ok(model.getEditorChanges(session.baseline, session.document).some(change => change.kind === 'textStyle'))
  session = model.editSessionCopy(session, 'shared', 'title', 'abXXcd')
  assert.deepEqual(session.document.textStyles.shared.title, { text: 'abXXcd', runs: [run(0, 2), run(4, 6)] })
  session = model.editSessionCopy(session, 'shared', 'title', undefined)
  assert.equal(session.document.textStyles?.shared?.title, undefined)
})

test('copy versus style concurrent edits conflict and each resolution preserves a coherent pair', () => {
  assert.equal(typeof model.editSessionTextStyle, 'function')
  const base = { ...empty(), copy: { title: 'abcd' } }
  let local = model.editSessionTextStyle(start(base), 'shared', 'title', 'abcd', [run(0, 4)])
  local = model.reconcileEditorSession(local, record({ ...empty(), copy: { title: 'different', other: 'server' } }, 1))
  assert.equal(local.document.copy.title, 'abcd')
  assert.ok(local.conflicts.length > 0)
  const server = model.resolveEditorConflict(local, local.conflicts[0].id, 'server')
  assert.equal(server.document.copy.title, 'different')
  assert.equal(server.document.textStyles?.shared?.title, undefined)
  assert.equal(server.conflicts.length, 0)
  assert.equal(server.document.copy.other, 'server')
  const mine = model.resolveEditorConflict(local, local.conflicts[0].id, 'local')
  assert.equal(mine.document.copy.title, 'abcd')
  assert.deepEqual(mine.document.textStyles.shared.title.runs, [run(0, 4)])
  assert.equal(mine.conflicts.length, 0)
})

test('concurrent remote style and local copy edits never attach old offsets to the new text', () => {
  assert.equal(typeof model.editSessionTextStyle, 'function')
  const base = { ...empty(), copy: { title: 'abcd' } }
  let local = model.editSessionCopy(start(base), 'shared', 'title', 'different')
  const remote = model.editSessionTextStyle(start(base), 'shared', 'title', 'abcd', [run(0, 4)])
  local = model.reconcileEditorSession(local, record(remote.document, 1))
  assert.ok(local.conflicts.length > 0)
  assert.equal(local.document.copy.title, 'different')
  assert.equal(local.document.textStyles?.shared?.title, undefined)
  const server = model.resolveEditorConflict(local, local.conflicts[0].id, 'server')
  assert.equal(server.document.copy.title, 'abcd')
  assert.deepEqual(server.document.textStyles.shared.title.runs, [run(0, 4)])
})

test('scope reset and restore retain unrelated styles plus edits made while restore is pending', () => {
  assert.equal(typeof model.editSessionTextStyle, 'function')
  let session = model.editSessionTextStyle(start(), 'mobile', 'title', 'abc', [run(0, 3)])
  session = model.editSessionTextStyle(session, 'desktop', 'title', 'abcd', [run(0, 4)])
  const reset = model.resetEditorScope(session, 'mobile')
  assert.equal(reset.document.textStyles?.mobile, undefined)
  assert.deepEqual(reset.document.textStyles.desktop.title.runs, [run(0, 4)])
  const submitted = structuredClone(session.document)
  session = model.editSessionTextStyle(session, 'mobile', 'title', 'abc', [run(0, 3, 30)])
  session = model.acceptEditorRestore(session, submitted, record(empty(), 1))
  assert.equal(session.document.deviceCopy.mobile.title, 'abc')
  assert.deepEqual(session.document.textStyles.mobile.title.runs, [run(0, 3, 30)])
  assert.equal(session.document.textStyles?.desktop, undefined)
})

test('JSONB key ordering never invents unsaved style changes after a successful save', () => {
  const local = { ...empty(), copy: { title: 'ab' }, textStyles: { shared: { title: { text: 'ab', runs: [{ start: 0, end: 2, style: { fontFamily: 'hahmlet', fontSize: 24 } }] } } } }
  const server = { ...empty(), copy: { title: 'ab' }, textStyles: { shared: { title: { runs: [{ end: 2, style: { fontSize: 24, fontFamily: 'hahmlet' }, start: 0 }], text: 'ab' } } } }
  assert.deepEqual(model.getEditorChanges(server, local), [])
  const session = model.acceptEditorSave(start(local), record(server, 1))
  assert.equal(model.getEditorStatus(session).unsavedCount, 0)
  assert.equal(model.getEditorStatus(session).canPublish, true)
})

test('temporarily invalid typed text stays editable without losing the previous formatting snapshot', () => {
  let session = model.editSessionTextStyle(start(), 'shared', 'title', 'abcd', [run(0, 4)])
  session = model.editSessionCopy(session, 'shared', 'title', '<b>abcd')
  assert.equal(session.document.copy.title, '<b>abcd')
  assert.deepEqual(session.document.textStyles.shared.title, { text: 'abcd', runs: [run(0, 4)] })
  session = model.editSessionCopy(session, 'shared', 'title', 'abcde')
  assert.equal(session.document.copy.title, 'abcde')
  assert.deepEqual(session.document.textStyles.shared.title, { text: 'abcde', runs: [run(0, 4)] })
})
