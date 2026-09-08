import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

// Compile the actual small model and its date dependency without a native Vite
// worker: Windows worker teardown intermittently exits with an access violation.
async function moduleUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  for (const [specifier, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`'${specifier}'`, `'${url}'`).replaceAll(`"${specifier}"`, `"${url}"`)
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
const dateUrl = await moduleUrl('../../utils/formatDate.ts')
const model = await import(await moduleUrl('./noticeViewModel.ts', { '../../utils/formatDate': dateUrl }))

const loadModel = () => model
const notice = (id, overrides = {}) => ({
  id, title: '공지 제목', content: '연습 장소 안내', category: 'notice',
  is_important: false, is_visible: true, cover_image_url: '',
  created_at: '2026-06-27T03:00:00Z', updated_at: '2026-06-27T03:00:00Z',
  ...overrides,
})

test('only visible notices are counted; the server priority order and input stay unchanged', async () => {
  const { filterNotices } = await loadModel()
  const rows = Object.freeze([
    notice('pinned', { is_important: true, created_at: '2025-01-01' }),
    notice('newest'), notice('hidden', { is_visible: false, is_important: true }),
  ])
  assert.deepEqual(filterNotices(rows, { query: '', category: 'all', importantOnly: false }).map(n => n.id), ['pinned', 'newest'])
  assert.deepEqual(rows.map(n => n.id), ['pinned', 'newest', 'hidden'])
})

test('search matches CMS title and body, ignoring case and surrounding whitespace', async () => {
  const { filterNotices } = await loadModel()
  const rows = [notice('title', { title: 'CHOIR 안내' }), notice('body', { content: 'Choir rehearsal' }), notice('other')]
  assert.deepEqual(filterNotices(rows, { query: '  choir  ', category: 'all', importantOnly: false }).map(n => n.id), ['title', 'body'])
  assert.equal(filterNotices(rows, { query: '   ', category: 'all', importantOnly: false }).length, 3)
})

test('importance, category and search are intersected; an unmatched filter returns no fabricated rows', async () => {
  const { filterNotices } = await loadModel()
  const rows = [notice('match', { category: 'join', is_important: true }), notice('ordinary', { category: 'join' }), notice('different-category', { is_important: true })]
  assert.deepEqual(filterNotices(rows, { query: '장소', category: 'join', importantOnly: true }).map(n => n.id), ['match'])
  assert.deepEqual(filterNotices(rows, { query: '없음', category: 'join', importantOnly: true }), [])
  assert.deepEqual(filterNotices([], { query: '', category: 'all', importantOnly: false }), [])
})

test('CMS category labels work in list and detail, with safe unknown-category fallback', async () => {
  const { getNoticeCategoryLabel, isNoticeCategory } = await loadModel()
  for (const [value, label] of [['notice', '공지'], ['join', '모집'], ['concert', '공연'], ['rehearsal', '연습'], ['press', '보도자료'], ['news', '소식']]) {
    assert.equal(getNoticeCategoryLabel(value), label)
    assert.equal(isNoticeCategory(value), true)
  }
  assert.equal(getNoticeCategoryLabel('future-category'), 'future-category')
  assert.equal(getNoticeCategoryLabel(''), '공지')
  assert.equal(isNoticeCategory('constructor'), false)
  assert.equal(isNoticeCategory(null), false)
})

test('excerpt normalizes whitespace, preserves plain text, and limits only the list preview', async () => {
  const { getNoticeExcerpt } = await loadModel()
  assert.equal(getNoticeExcerpt('  첫 줄\n\n둘째   줄  '), '첫 줄 둘째 줄')
  assert.equal(getNoticeExcerpt(''), '')
  assert.equal(getNoticeExcerpt('<script>text</script>'), '<script>text</script>')
  assert.equal(getNoticeExcerpt('가'.repeat(111)), `${'가'.repeat(110)}…`)
})

test('date presentation is compact without changing the source timestamp', async () => {
  const { formatNoticeDate } = await loadModel()
  assert.equal(formatNoticeDate('2026-06-27T03:00:00Z'), '2026.06.27')
  assert.equal(formatNoticeDate(''), '')
  assert.equal(formatNoticeDate('not-a-date'), 'not-a-date')
})
