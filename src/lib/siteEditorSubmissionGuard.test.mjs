import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', configFile: false, envDir: false,
  logLevel: 'silent', server: { middlewareMode: true } })
const publicApi = await vite.ssrLoadModule('/src/lib/publicData.ts')
const joinApi = await vite.ssrLoadModule('/src/lib/joinApplications.ts')
after(async () => { delete globalThis.window; await vite.close() })
const expectedError = '미리보기에서는 접수할 수 없습니다. 실제 홈페이지에서 작성해 주세요.'

test('every public write rejects editor preview before validation, upload or transport', async () => {
  const previousWindow = globalThis.window
  const previousFetch = globalThis.fetch
  let networkRequests = 0
  globalThis.fetch = async () => { networkRequests++; throw new Error('No network is allowed in this test') }
  try {
    for (const [pathname, operation] of [
      ['/contact', () => publicApi.createContactMessage({ website: 'trap', privacy_agreed: false })],
      ['/contact', () => publicApi.createSupportPledge({ website: 'trap', privacy_agreed: false })],
      ['/join', () => publicApi.createJoinApplication({ website: 'trap', privacy_agreed: false })],
      ['/join', () => joinApi.submitJoinApplication({ website: 'trap' }, 'invalid', 'invalid')],
    ]) {
      globalThis.window = { parent: {}, location: {
        pathname, search: '?site-editor-preview=11111111-1111-4111-8111-111111111111',
      } }
      assert.deepEqual(await operation(), { data: null, error: expectedError })
    }
    assert.equal(networkRequests, 0)
  } finally {
    globalThis.fetch = previousFetch
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
})
