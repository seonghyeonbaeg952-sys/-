import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = await readFile(new URL('./useUnsavedChangesGuard.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
function fixture() {
  const cleanups = [], events = new Map(), prompts = []
  const exports = {}
  vm.runInNewContext(compiled, { exports, require: name => {
    assert.equal(name, 'react')
    return { useRef: value => ({ current: value }), useLayoutEffect: effect => { const cleanup = effect(); if (cleanup) cleanups.push(cleanup) } }
  }, window: { addEventListener: (name, handler) => events.set(name, handler), removeEventListener: name => events.delete(name), confirm: message => { prompts.push(message); return false } },
  document: { addEventListener() {}, removeEventListener() {} }, URL, Symbol })
  return { api: exports, cleanups, events, prompts }
}

test('dirty forms block route changes including back/forward, but editor page switches retain their in-memory drafts', () => {
  const { api, cleanups } = fixture()
  assert.equal(typeof api.shouldBlockUnsavedNavigation, 'function')
  assert.equal(api.shouldBlockUnsavedNavigation('/admin/editor', '/admin'), false)
  api.useUnsavedChangesGuard({ enabled: true, message: '첫 번째 초안' })
  assert.equal(api.shouldBlockUnsavedNavigation('/admin/editor', '/admin'), true)
  assert.equal(api.shouldBlockUnsavedNavigation('/admin/editor', '/admin/editor'), false)
  assert.equal(api.shouldBlockUnsavedNavigation('/admin/editor', '/admin/login'), false, 'Do not trap sign-out or expired-session redirects')
  api.useUnsavedChangesGuard({ enabled: true, message: '두 번째 초안' })
  cleanups.shift()()
  assert.equal(api.shouldBlockUnsavedNavigation('/admin/editor', '/admin/settings'), true)
  cleanups.shift()()
  assert.equal(api.shouldBlockUnsavedNavigation('/admin/editor', '/admin/settings'), false)
})

test('beforeunload protection is removed only after every dirty form unmounts', () => {
  const { api, cleanups, events, prompts } = fixture()
  api.useUnsavedChangesGuard({ enabled: true, message: '작성 중입니다' })
  let prevented = false
  const event = { preventDefault() { prevented = true }, returnValue: null }
  events.get('beforeunload')(event)
  assert.equal(prevented, true)
  assert.equal(event.returnValue, '')
  assert.equal(api.confirmUnsavedChanges(), false)
  assert.deepEqual(prompts, ['작성 중입니다'])
  cleanups[0]()
  assert.equal(events.has('beforeunload'), false)
  assert.equal(api.confirmUnsavedChanges(), true)
})
