import assert from 'node:assert/strict'
import test from 'node:test'

async function loadHomeTypography() {
  try {
    return await import('./homeTypography.ts')
  } catch (error) {
    assert.fail(`home typography helper is not available: ${error}`)
  }
}

test('splits the current home title into deliberate type roles without changing one character', async () => {
  const { buildHomeTitleFragments } = await loadHomeTypography()
  const title = '함께 빚어가는 화음, 다음 세대의 노래'

  const fragments = buildHomeTitleFragments(title, [
    { term: '함께 빚어가는', role: 'quiet' },
    { term: '화음', role: 'emphasis' },
    { term: '다음 세대의', role: 'quiet' },
    { term: '노래', role: 'emphasis' },
  ])

  assert.deepEqual(fragments, [
    { text: '함께 빚어가는', role: 'quiet' },
    { text: ' ', role: 'base' },
    { text: '화음', role: 'emphasis' },
    { text: ', ', role: 'base' },
    { text: '다음 세대의', role: 'quiet' },
    { text: ' ', role: 'base' },
    { text: '노래', role: 'emphasis' },
  ])
  assert.equal(fragments.map(({ text }) => text).join(''), title)
})

test('supports a bold emphasis fragment while preserving the current join copy', async () => {
  const { buildHomeTitleFragments } = await loadHomeTypography()
  const title = '함께 무대에 서는 다음 목소리'

  const fragments = buildHomeTitleFragments(title, [
    { term: '목소리', role: 'emphasis' },
  ])

  assert.equal(fragments.map(({ text }) => text).join(''), title)
  assert.deepEqual(
    fragments.filter(({ role }) => role !== 'base'),
    [
      { text: '목소리', role: 'emphasis' },
    ],
  )
})

test('renders an arbitrary CMS edit as one untouched base fragment when no accent term matches', async () => {
  const { buildHomeTitleFragments } = await loadHomeTypography()
  const cmsTitle = '새롭게 등록한 홈 제목 그대로'

  assert.deepEqual(
    buildHomeTitleFragments(cmsTitle, [
      { term: '목소리', role: 'emphasis' },
    ]),
    [{ text: cmsTitle, role: 'base' }],
  )
})

test('uses a different typographic composition strategy for each home section', async () => {
  const {
    HOME_TITLE_ACCENTS,
    HOME_TITLE_LINE_ROLES,
  } = await import('../constants/homeTypography.ts')

  assert.deepEqual(HOME_TITLE_ACCENTS.about, [
    { term: '함께 빚어가는', role: 'quiet' },
    { term: '화음', role: 'emphasis' },
    { term: '다음 세대의', role: 'quiet' },
    { term: '노래', role: 'emphasis' },
  ])
  assert.deepEqual(HOME_TITLE_ACCENTS.join, [])
  assert.deepEqual(HOME_TITLE_ACCENTS.performance, [])
  assert.deepEqual(HOME_TITLE_ACCENTS.archive, [])
  assert.deepEqual(HOME_TITLE_LINE_ROLES.join, [
    'quiet',
    'base',
    'emphasis',
  ])
  assert.deepEqual(HOME_TITLE_LINE_ROLES.archive, [
    'quiet',
    'emphasis',
    'ornament',
  ])
})
