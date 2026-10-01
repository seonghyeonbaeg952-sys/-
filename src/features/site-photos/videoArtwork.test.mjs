import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
let artwork = {}
try {
  const source = await readFile(new URL('./videoArtwork.ts', import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  artwork = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
} catch (error) { if (error.code !== 'ENOENT') throw error }
test('public video thumbnails display the CMS photo first, with YouTube images only as fallback', () => {
  assert.equal(typeof artwork.videoArtworkSources, 'function')
  assert.deepEqual(artwork.videoArtworkSources('abcdefghijk', 'https://example.com/custom.webp'), [
    'https://example.com/custom.webp', 'https://img.youtube.com/vi/abcdefghijk/maxresdefault.jpg', 'https://img.youtube.com/vi/abcdefghijk/sddefault.jpg', 'https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg',
  ])
})
test('video artwork handles missing custom photos and missing videos without inventing a broken URL', () => {
  assert.equal(typeof artwork.videoArtworkSources, 'function')
  assert.deepEqual(artwork.videoArtworkSources('', ''), [])
  assert.deepEqual(artwork.videoArtworkSources('', 'https://example.com/custom.webp'), ['https://example.com/custom.webp'])
  assert.deepEqual(artwork.videoArtworkSources('bad/id', ''), [])
})
