import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./storage.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
function storage(response = { error: null }) {
  const exports = {}, uploads = []
  const bucket = { upload: async (...args) => { uploads.push(args); return response }, getPublicUrl: path => ({ data: { publicUrl: `https://fixture.invalid/${path}` } }) }
  vm.runInNewContext(source, { exports, URL, Uint8Array, TextDecoder, crypto: globalThis.crypto, require: name => {
    assert.equal(name, './auth'); return { getSupabaseClientSafe: () => ({ data: { storage: { from: () => bucket } }, error: null }) }
  } })
  return { ...exports, uploads }
}
const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n1cAAAAASUVORK5CYII=', 'base64')
const png = (name = '공연 사진.png', type = 'image/png') => new File([pngBytes], name, { type })

test('image metadata rejects explicit MIME/extension conflicts, empty files and invalid size limits', () => {
  const h = storage()
  for (const file of [png('photo.jpg', 'text/html'), png('photo.png', 'image/jpeg'), png('photo.html'), new File([], 'empty.png', { type: 'image/png' })]) {
    assert.ok(h.validateImageFile(file).error, `reject ${file.name}/${file.type}`)
  }
  for (const maxSizeMb of [NaN, Infinity, 0, -1]) assert.ok(h.validateImageFile(png(), { maxSizeMb }).error)
  assert.equal(h.validateImageFile(png()).error, null)
})

test('renaming HTML as a raster image never reaches Storage upload, including absent browser MIME', async () => {
  for (const type of ['image/png', '']) {
    const h = storage()
    const result = await h.uploadImage({ folder: 'gallery', file: new File(['<html>not an image</html>'], 'photo.png', { type }) })
    assert.ok(result.error)
    assert.equal(h.uploads.length, 0)
  }
})

test('valid MIME-less PNG is uploaded with a generated name, explicit image content type and no overwrite', async () => {
  const h = storage()
  assert.equal((await h.uploadImage({ folder: 'gallery', file: png('공연 #1.PNG', '') })).error, null)
  assert.equal(h.uploads.length, 1)
  assert.match(h.uploads[0][0], /^gallery\/[a-zA-Z0-9-]+\.png$/)
  assert.equal(h.uploads[0][2].contentType, 'image/png')
  assert.equal(h.uploads[0][2].upsert, false)
})

test('invalid upload folders fail before any write and service errors do not leak internal messages', async () => {
  for (const folder of ['../brand', 'gallery/../brand', 'gallery//brand', 'gallery\\brand', '', 'gallery/%2e%2e']) {
    const h = storage()
    assert.ok((await h.uploadImage({ folder, file: png() })).error)
    assert.equal(h.uploads.length, 0)
  }
  const h = storage({ error: { message: 'internal-secret-diagnostic' } })
  const result = await h.uploadImage({ folder: 'gallery', file: png() })
  assert.ok(result.error)
  assert.ok(!result.error.includes('internal-secret-diagnostic'))
})
