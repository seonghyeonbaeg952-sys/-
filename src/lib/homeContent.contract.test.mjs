import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const contract = await vite.ssrLoadModule(
  '/src/components/admin/home/homeFieldDefinitions.ts',
)
const constants = await vite.ssrLoadModule(
  '/src/constants/homeContentV2.ts',
)
const homeContent = await vite.ssrLoadModule('/src/lib/homeContent.ts')

after(async () => {
  await vite.close()
})

test('keeps admin field keys and public consumer keys in a one-to-one contract', () => {
  const adminKeys = contract.homeFieldDefinitions.map((field) => field.key)
  const publicKeys = contract.homePublicConsumerKeys

  assert.equal(new Set(adminKeys).size, adminKeys.length)
  assert.deepEqual([...adminKeys].sort(), [...publicKeys].sort())
})

test('keeps deprecated, managed-elsewhere and fixed design labels out of the V2 payload', () => {
  const activeKeys = new Set(contract.homePublicConsumerKeys)

  for (const deprecatedKey of Object.keys(
    contract.homeDeprecatedKeyPolicies,
  )) {
    assert.equal(activeKeys.has(deprecatedKey), false, deprecatedKey)
  }

  for (const label of contract.homeFixedDesignLabels) {
    assert.equal(activeKeys.has(label), false, label)
  }

  for (const definition of contract.homeFieldDefinitions) {
    assert.equal(
      contract.homeManagedElsewhereSources.some((source) =>
        definition.key === source || definition.key.startsWith(`${source}.`),
      ),
      false,
      definition.key,
    )
  }
})

test('migrates supported legacy values without reviving previous-home copy', () => {
  const migrated = homeContent.migrateHomeContentV1ToV2({
    'home.quick.1.title': '새 입단 카드',
    'home.join.description': '새 입단 Letter 설명',
    'home.scorebook.rightTitle': '함께 듣는 연습',
    'home.support.cardTitle': '새 문의 카드',
  })
  const flattened = homeContent.flattenHomeContentV2(migrated)

  assert.equal(migrated.quickActions.items[0].title, '새 입단 카드')
  assert.equal(
    migrated.joinLetter.description,
    constants.HOME_CONTENT_DEFAULTS_V2.joinLetter.description,
  )
  assert.equal(migrated.scoreBook.rightPage.prefix, '함께 듣는 연습')
  assert.equal(migrated.supportLetter.pledgeTitle, '새 문의 카드')
  assert.equal('home.quick.1.title' in flattened, false)
  assert.equal('home.support.cardTitle' in flattened, false)
})

test('normalizes blank, malformed and unsafe values to stable defaults', () => {
  const normalized = homeContent.normalizeHomeContentV2({
    'home.current.about.title': '<script>alert(1)</script>',
    'home.current.archive.expandLabel': '',
    'home.quickActions.join.displayOrder': '999',
    'home.quickActions.join.isVisible': 'not-a-boolean',
  })

  assert.equal(
    normalized.about.title,
    constants.HOME_CONTENT_DEFAULTS_V2.about.title,
  )
  assert.equal(
    normalized.archive.expandLabel,
    constants.HOME_CONTENT_DEFAULTS_V2.archive.expandLabel,
  )
  const normalizedJoin = normalized.quickActions.items.find(
    (item) => item.id === 'join',
  )

  assert.equal(normalizedJoin?.displayOrder, 3)
  assert.equal(normalizedJoin?.isVisible, true)
  assert.equal(homeContent.isHomeContentV2(normalized), true)
})

test('preserves item visibility and display order', () => {
  const normalized = homeContent.normalizeHomeContentV2({
    'home.quickActions.join.displayOrder': '3',
    'home.quickActions.concert.displayOrder': '1',
    'home.quickActions.support.displayOrder': '2',
    'home.quickActions.support.isVisible': 'false',
  })

  assert.deepEqual(
    normalized.quickActions.items.map((item) => item.id),
    ['concert', 'join'],
  )
})

test('renders safely when no CMS rows exist', () => {
  const normalized = homeContent.normalizeHomeContentV2()
  const flattened = homeContent.flattenHomeContentV2(normalized)

  assert.equal(homeContent.isHomeContentV2(normalized), true)
  assert.deepEqual(
    Object.keys(flattened).sort(),
    [...contract.homePublicConsumerKeys].sort(),
  )
})

test('keeps numbered about paragraphs in their original one-based order', () => {
  const flattened = homeContent.flattenHomeContentV2(
    constants.HOME_CONTENT_DEFAULTS_V2,
  )

  assert.equal(
    flattened['home.current.about.paragraphs.1'],
    constants.HOME_CONTENT_DEFAULTS_V2.about.paragraphs[0],
  )
  assert.equal(
    flattened['home.current.about.paragraphs.2'],
    constants.HOME_CONTENT_DEFAULTS_V2.about.paragraphs[1],
  )
})

test('uses the rendered white-orange home copy as the current CMS baseline', () => {
  const defaults = constants.HOME_CONTENT_DEFAULTS_V2

  assert.equal(defaults.about.eyebrowEn, 'ABOUT')
  assert.equal(defaults.about.title, '함께 빚어가는 화음,\n다음 세대의 노래')
  assert.deepEqual(defaults.about.paragraphs, [
    '서울모테트청소년합창단은 음악과 신앙, 공동체의 가치를 통해',
    '청소년의 삶을 아름답게 세워갑니다.',
  ])
  assert.equal(defaults.about.globalTagline, 'VOICE · LEARNING · STAGE')

  assert.equal(defaults.joinLetter.eyebrowEn, 'JOIN · NEXT VOICE')
  assert.equal(
    defaults.joinLetter.title,
    '함께 배우고,\n함께 무대에 서는\n다음 목소리를 기다립니다',
  )
  assert.equal(
    defaults.joinLetter.description,
    '발성·악보 읽기·파트 연습부터 공연까지, 청소년이 음악 안에서 자신을 발견하고 함께 성장하는 과정입니다.',
  )
  assert.equal(defaults.joinLetter.secondaryCtaLabel, '모집 일정·절차 확인')

  assert.equal(
    defaults.archive.desktopTitle,
    '한 번의 무대는\n세 가지 기록으로\n오래 남습니다',
  )
  assert.equal(
    defaults.archive.leadDescription,
    '사진은 순간을 붙잡고, 포스터는 사람을 부르며, 영상은 마지막 음 이후의 시간을 이어갑니다.',
  )
  assert.equal(defaults.archive.title, '포스터 · 사진 · 동영상')
})

test('does not let previous-home CMS rows replace current-home copy', () => {
  const normalized = homeContent.normalizeHomeContentV2({
    'home.about.title': '서울모테트청소년합창단 소개',
    'home.joinLetter.title':
      '노래를 향한 아이보다\n함께 듣고 성장할 준비가 된 아이를 기다립니다',
    'home.archive.description':
      '공연 사진, 연습 사진, 영상, 포스터를 모아 확인합니다.',
  })

  assert.equal(
    normalized.about.title,
    constants.HOME_CONTENT_DEFAULTS_V2.about.title,
  )
  assert.equal(
    normalized.joinLetter.title,
    constants.HOME_CONTENT_DEFAULTS_V2.joinLetter.title,
  )
  assert.equal(
    normalized.archive.description,
    constants.HOME_CONTENT_DEFAULTS_V2.archive.description,
  )

  const edited = homeContent.normalizeHomeContentV2({
    'home.current.about.title': '관리자가 수정한 소개',
    'home.current.join.title': '관리자가 수정한 입단 제목',
    'home.current.archive.description': '관리자가 수정한 기록 설명',
  })

  assert.equal(edited.about.title, '관리자가 수정한 소개')
  assert.equal(edited.joinLetter.title, '관리자가 수정한 입단 제목')
  assert.equal(edited.archive.description, '관리자가 수정한 기록 설명')
})

test('keeps the current-home SQL migration synchronized with current-only keys', async () => {
  const migration = await readFile(
    'supabase/migrations/20260824_sync_current_home_copy.sql',
    'utf8',
  )
  const currentOnlyKeys = contract.homePublicConsumerKeys.filter(
    (key) =>
      key.startsWith('home.current.') ||
      key === 'home.concertProgram.desktopConcertsCtaLabel',
  )

  for (const key of currentOnlyKeys) {
    assert.equal(migration.includes(key), true, key)
  }

  assert.equal(/^\s*(delete|drop|truncate)\s/im.test(migration), false)
})

test('registers exact current-home defaults without deleting prior rows', async () => {
  const migration = await readFile(
    'supabase/migrations/20260824_sync_current_home_copy.sql',
    'utf8',
  )
  const tuples = new Map(
    [...migration.matchAll(
      /\('((?:''|[^'])*)',\s*'[^']*',\s*'[^']*',\s*'((?:''|[^'])*)'/g,
    )].map(
      (match) => [
        match[1].replaceAll("''", "'"),
        match[2].replaceAll("''", "'"),
      ],
    ),
  )
  const expected = homeContent.flattenHomeContentV2(
    constants.HOME_CONTENT_DEFAULTS_V2,
  )
  const currentOnlyEntries = Object.entries(expected).filter(
    ([key]) =>
      key.startsWith('home.current.') ||
      key === 'home.concertProgram.desktopConcertsCtaLabel',
  )

  assert.equal(tuples.size, currentOnlyEntries.length)
  for (const [key, value] of currentOnlyEntries) {
    assert.equal(tuples.get(key), value, key)
  }

  assert.equal(
    /update\s+public\.(concerts|notices|gallery|join_info|sponsors|media)/i.test(
      migration,
    ),
    false,
  )
  assert.equal(/^\s*(delete|drop|truncate)\s/im.test(migration), false)
  assert.match(migration, /key like 'home\.about\.%'/)
  assert.match(migration, /key like 'home\.joinLetter\.%'/)
  assert.match(migration, /key like 'home\.archive\.%'/)
})

test('updates only the previous About eyebrow default in already-migrated CMS rows', async () => {
  const migration = await readFile(
    'supabase/migrations/20260825_simplify_home_about_eyebrow.sql',
    'utf8',
  )

  assert.match(migration, /key = 'home\.current\.about\.eyebrowEn'/)
  assert.match(migration, /value = 'ABOUT · COLLECTIVE PORTRAIT'/)
  assert.match(migration, /default_value = 'ABOUT'/)
  assert.equal(/^\s*(delete|drop|truncate)\s/im.test(migration), false)
})
