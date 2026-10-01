import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  configFile: false,
  appType: 'custom',
  cacheDir: 'node_modules/.vite-brochure-content-test',
  logLevel: 'silent',
  server: { middlewareMode: true },
})
after(() => vite.close())

const { buildBrochurePreview, readBrochureDate } = await vite.ssrLoadModule(
  '/src/components/sample/home-v4/brochureContent.ts',
)

test('a long CMS description becomes a word-safe teaser with a clear continuation flag', () => {
  const preview = buildBrochurePreview(
    'This is a long description about listening together and making music with the choir for our neighbours and future generations.',
    [],
    true,
  )
  assert.ok(preview.note.length <= 103)
  assert.match(preview.note, /…$/)
  assert.equal(preview.hasMore, true)
  assert.ok(!preview.note.includes('generatio…'))
})

test('CMS repertoire preview preserves order and indicates hidden entries', () => {
  const preview = buildBrochurePreview('', ['First work', 'Second work', 'Third work'], true)
  assert.deepEqual(preview.program, ['First work', 'Second work'])
  assert.equal(preview.hasMore, true)
  assert.match(preview.note, /programme/i)
})

test('an unusually long work title is shortened on the printed leaf, never silently lost', () => {
  const preview = buildBrochurePreview('', [
    'An exceptionally long work title with a subtitle that will not fit on one brochure leaf',
  ], true)
  assert.ok(preview.program[0].length <= 43)
  assert.match(preview.program[0], /…$/)
  assert.equal(preview.hasMore, true)
})

test('date extraction is stable for ISO dates and gracefully handles missing dates', () => {
  assert.deepEqual(readBrochureDate('2026-12-21', true), { day: '21', month: 'December', year: '2026' })
  assert.deepEqual(readBrochureDate('2026-12-21', false), { day: '21', month: '12월', year: '2026' })
  assert.deepEqual(readBrochureDate('', true), { day: '—', month: '', year: '' })
})
