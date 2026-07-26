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

test('migrates legacy values to V2 without retaining deprecated keys', () => {
  const migrated = homeContent.migrateHomeContentV1ToV2({
    'home.quick.1.title': '새 입단 카드',
    'home.join.description': '새 입단 Letter 설명',
    'home.scorebook.rightTitle': '함께 듣는 연습',
    'home.support.cardTitle': '새 문의 카드',
  })
  const flattened = homeContent.flattenHomeContentV2(migrated)

  assert.equal(migrated.quickActions.items[0].title, '새 입단 카드')
  assert.equal(migrated.joinLetter.description, '새 입단 Letter 설명')
  assert.equal(migrated.scoreBook.rightPage.prefix, '함께 듣는 연습')
  assert.equal(migrated.supportLetter.pledgeTitle, '새 문의 카드')
  assert.equal('home.quick.1.title' in flattened, false)
  assert.equal('home.support.cardTitle' in flattened, false)
})

test('normalizes blank, malformed and unsafe values to stable defaults', () => {
  const normalized = homeContent.normalizeHomeContentV2({
    'home.about.title': '<script>alert(1)</script>',
    'home.archive.expandLabel': '',
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

test('keeps the additive SQL migration synchronized with every V2 key', async () => {
  const migration = await readFile(
    'supabase/migrations/20260723_sync_home_content_v2.sql',
    'utf8',
  )

  for (const key of contract.homePublicConsumerKeys) {
    assert.equal(migration.includes(key), true, key)
  }

  assert.equal(/^\s*(delete|drop|truncate)\s/im.test(migration), false)
})
