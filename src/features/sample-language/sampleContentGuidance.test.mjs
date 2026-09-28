import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-sample-guidance-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { getEnglishInputProgress, getEnglishChanges, getEnglishTextStats, getPageEnglishStatus, filterPageEnglishRows, recommendedEnglishCharacters } = await vite.ssrLoadModule('/src/features/sample-language/sampleContentGuidance.ts')

test('progress counts only source text fields and ignores optional media and empty source fields', () => {
  const progress = getEnglishInputProgress('gallery', { title: '합창단', description: '연습', image_url: '/original.jpg' }, { title: 'Choir', image_url: '/english.jpg' })
  assert.deepEqual(progress, { completed: 1, total: 2, missingLabels: ['설명'] })
  assert.deepEqual(getEnglishInputProgress('gallery', { title: null, description: '' }, {}), { completed: 0, total: 0, missingLabels: [] })
})

test('publication summary identifies added, changed and removed fields without changing source', () => {
  const draft = { title: 'New title', content: 'New copy', cover_image_url: '/english.jpg' }
  const published = { title: 'Old title', content: 'Old copy', cover_image_url: '/old.jpg' }
  const original = structuredClone(draft)
  const changes = getEnglishChanges('notices', draft, published)
  assert.deepEqual(changes.map(change => [change.name, change.kind, change.before, change.after]), [
    ['title', 'changed', 'Old title', 'New title'],
    ['content', 'changed', 'Old copy', 'New copy'],
    ['cover_image_url', 'changed', '/old.jpg', '/english.jpg'],
  ])
  assert.deepEqual(draft, original)
  assert.deepEqual(getEnglishChanges('notices', { title: '' }, { title: 'Old' }).map(change => change.kind), ['removed'])
})

test('current-page status never treats an unavailable status response as untranslated', () => {
  const rows = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const statuses = { b: 'draft', c: 'published' }
  assert.deepEqual(getPageEnglishStatus(rows, statuses), { missing: 1, draft: 1, published: 1, total: 3 })
  assert.deepEqual(filterPageEnglishRows(rows, statuses, 'missing').map(row => row.id), ['a'])
  assert.deepEqual(filterPageEnglishRows(rows, statuses, 'draft').map(row => row.id), ['b'])
  assert.deepEqual(filterPageEnglishRows(rows, statuses, 'published').map(row => row.id), ['c'])
  assert.deepEqual(filterPageEnglishRows(rows, null, 'missing'), rows)
})

test('English text guidance counts words and characters without hard-truncating long labels', () => {
  assert.deepEqual(getEnglishTextStats('View dates & application steps', 24), { characters: 30, words: 5, aboveRecommendation: true })
  assert.deepEqual(getEnglishTextStats('  Two   words  '), { characters: 15, words: 2, aboveRecommendation: false })
  assert.equal(recommendedEnglishCharacters('hero_slides', 'primary_cta_label'), 24)
  assert.equal(recommendedEnglishCharacters('notices', 'content'), null)
})
