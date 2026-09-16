import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

let publication = {}
try {
  const source = await readFile(new URL('./siteEditorPublication.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  publication = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
} catch (error) { if (error.code !== 'ENOENT') throw error }
const document = { schemaVersion: 1, copy: { 'join.guideTitle': '게시된 제목' }, deviceCopy: {}, appearance: {} }

test('first-load gate stays pending until published documents have been resolved', async () => {
  assert.equal(typeof publication.loadPublishedEditorDocuments, 'function')
  let finish
  let settled = false
  const load = publication.loadPublishedEditorDocuments(() => new Promise(resolve => { finish = resolve }), 500)
  void load.then(() => { settled = true })
  await Promise.resolve()
  assert.equal(settled, false)
  finish({ data: [{ page_key: 'join', document }], error: null })
  assert.deepEqual(await load, { join: document })
})

test('unavailable API and failed network release the gate with fallback without treating them as publication', async () => {
  assert.equal(typeof publication.loadPublishedEditorDocuments, 'function')
  assert.equal(await publication.loadPublishedEditorDocuments(async () => ({ data: null, error: 'unavailable' })), null)
  assert.equal(await publication.loadPublishedEditorDocuments(async () => { throw new Error('offline') }), null)
  assert.deepEqual(await publication.loadPublishedEditorDocuments(async () => ({ data: [], error: null })), {})
})

test('a never-resolving network request cannot leave the public page hidden indefinitely', async () => {
  assert.equal(typeof publication.loadPublishedEditorDocuments, 'function')
  assert.equal(await publication.loadPublishedEditorDocuments(() => new Promise(() => {}), 10), null)
})
