import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-member-name-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { getPublicMemberName } = await vite.ssrLoadModule('/src/utils/memberName.ts')

test('English roster uses only the consent-filtered English display name', () => {
  const member = { display_name: '김○', display_name_en: 'K○', part: 'soprano', name_en: 'Kim Private' }
  assert.equal(getPublicMemberName(member, 'en'), 'K○')
  assert.equal(getPublicMemberName(member, 'ko'), '김○')
  assert.equal(getPublicMemberName({ ...member, display_name_en: null }, 'en'), '김○')
  assert.equal(getPublicMemberName({ ...member, display_name: null, display_name_en: null }, 'en'), 'Soprano member')
})
