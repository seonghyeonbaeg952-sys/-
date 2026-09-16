import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

let mod = {}
try {
  const source = await readFile(new URL('./adminModalFocus.ts', import.meta.url), 'utf8')
  mod = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`)
} catch (error) { if (error.code !== 'ENOENT') throw error }
const control = (name, options = {}) => ({ name, disabled: false, readOnly: false, getClientRects: () => ({ length: options.hidden ? 0 : 1 }), getAttribute: key => key === 'data-admin-modal-close' && options.close ? 'true' : null, ...options })
test('read-only receipt detail focuses its first print action instead of scrolling to a later status field', () => {
  assert.equal(typeof mod.initialModalFocus, 'function')
  const close = control('close', { close: true }), print = control('print'), answer = control('answer', { readOnly: true }), status = control('status')
  assert.equal(mod.initialModalFocus([close, print, answer, status], close), print)
})
test('editable form starts with its first usable field; hidden and disabled controls cannot receive focus', () => {
  assert.equal(typeof mod.initialModalFocus, 'function')
  const close = control('close', { close: true }), input = control('title'), save = control('save')
  assert.equal(mod.initialModalFocus([close, control('hidden', { hidden: true }), control('disabled', { disabled: true }), input, save], close), input)
  assert.equal(mod.initialModalFocus([], close), close)
})

test('nested editor and exit dialogs restore body scrolling even when the lower dialog unmounts first', () => {
  assert.equal(typeof mod.registerAdminModal, 'function')
  const body = { style: { overflow: 'auto' } }, first = {}, second = {}
  const editor = mod.registerAdminModal(first, body)
  const exit = mod.registerAdminModal(second, body)
  assert.equal(body.style.overflow, 'hidden')
  assert.equal(editor.isTop(), false)
  assert.equal(exit.isTop(), true)
  editor.leave()
  assert.equal(body.style.overflow, 'hidden')
  exit.leave()
  assert.equal(body.style.overflow, 'auto')
  exit.leave()
  assert.equal(body.style.overflow, 'auto')
})
test('closing an exit dialog retains the original editor scroll lock and returns top ownership', () => {
  assert.equal(typeof mod.registerAdminModal, 'function')
  const body = { style: { overflow: '' } }
  const editor = mod.registerAdminModal({}, body), exit = mod.registerAdminModal({}, body)
  exit.leave()
  assert.equal(editor.isTop(), true)
  assert.equal(body.style.overflow, 'hidden')
  editor.leave()
  assert.equal(body.style.overflow, '')
})
