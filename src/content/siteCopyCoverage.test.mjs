import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { files } from '../../scripts/public-copy-inventory.mjs'

test('public route import graph has no unconnected fixed JSX text or static accessible labels', () => {
  assert.deepEqual(files.map(({ file, count }) => ({ file, count })), [])
})

test('copy inventory uses source adapters, never generic DOM text search and replacement', () => {
  const source = readFileSync('src/components/site-editor/SiteEditorProvider.tsx', 'utf8')
  assert.doesNotMatch(source, /TreeWalker|innerHTML|textContent\s*=/)
})
