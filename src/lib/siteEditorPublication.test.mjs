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

test('unchanged publication refresh preserves document identity, while a real copy edit is applied', () => {
  assert.equal(typeof publication.retainPublishedEditorDocuments, 'function')
  const current = { join: document }
  assert.equal(publication.retainPublishedEditorDocuments(current, structuredClone(current)), current)
  const changed = { join: { ...document, copy: { 'join.guideTitle': 'New published title' } } }
  assert.equal(publication.retainPublishedEditorDocuments(current, changed), changed)
  assert.deepEqual(current.join.copy, { 'join.guideTitle': '게시된 제목' })
})

test('bounded publication reads preserve successful and empty data without treating a timeout as an empty publication', async () => {
  assert.equal(typeof publication.loadInitialPublication, 'function')
  assert.deepEqual(await publication.loadInitialPublication(async () => ({ data: [], error: null })), { data: [], error: null })
  assert.deepEqual(await publication.loadInitialPublication(async () => ({ data: { title: 'Published title' }, error: null })),
    { data: { title: 'Published title' }, error: null })
  const timedOut = await publication.loadInitialPublication(() => new Promise(() => {}), 10)
  assert.equal(timedOut.data, null)
  assert.ok(timedOut.error)
})

test('thrown first-read transports settle as a reported failure', async () => {
  assert.equal(typeof publication.loadInitialPublication, 'function')
  const result = await publication.loadInitialPublication(async () => { throw new Error('offline') })
  assert.equal(result.data, null)
  assert.ok(result.error)
})

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
