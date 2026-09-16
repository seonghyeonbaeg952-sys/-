import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('./check-supabase-live.mjs', import.meta.url), 'utf8'))
  .replace(/^import .* from 'node:fs'\r?\n/m, '')
  .replace(/^import .* from 'node:path'\r?\n/m, '')
const runScript = new (Object.getPrototypeOf(async function () {}).constructor)(
  'existsSync', 'readFileSync', 'resolve', 'fetch', 'console', 'process', source,
)
const requiredKeys = ['home.heroSupplement.fallbackDescription', 'home.quickActions.join.title', 'home.about.paragraphs.1', 'home.scoreBook.cover.titleLines', 'home.supportLetter.title']

async function audit({ sponsorData = [{ id: 'local-only', name: 'Public alias', is_visible: true }], sponsorStatus = 200, rawSponsorStatus = 403 } = {}) {
  const requests = []
  let results = []
  const processFixture = { cwd: () => '/local-fixture', exit: () => { throw new Error('Unexpected env failure') }, exitCode: 0 }
  await runScript(
    () => true,
    () => 'VITE_SUPABASE_URL=https://fixture.invalid\nVITE_SUPABASE_ANON_KEY=local-only',
    (...segments) => segments.join('/'),
    async (url, options) => {
      const request = new URL(url)
      requests.push({ path: request.pathname, params: request.searchParams, method: options.method, body: options.body })
      if (request.pathname === '/rest/v1/rpc/get_public_sponsors') return new Response(JSON.stringify(sponsorData), { status: sponsorStatus, headers: { 'Content-Type': 'application/json' } })
      if (request.pathname === '/rest/v1/sponsors') return new Response(JSON.stringify([]), { status: rawSponsorStatus, headers: { 'Content-Type': 'application/json' } })
      if (/\/rest\/v1\/(members|contacts|join_applications|support_pledges)$/.test(request.pathname)) return new Response('{}', { status: 403 })
      const data = request.pathname === '/rest/v1/site_texts' && request.searchParams.has('key') ? requiredKeys.map(key => ({ key })) : []
      return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
    },
    { table: rows => { results = rows }, info() {}, log() {}, error() {} },
    processFixture,
  )
  return { requests, results, exitCode: processFixture.exitCode }
}

test('live checker uses GET only and never requests a private sponsor row to prove denial', async () => {
  const result = await audit()
  assert.equal(result.requests.every(request => request.method === 'GET' && request.body === undefined), true)
  assert.equal(result.requests.some(request => request.path === '/rest/v1/rpc/get_public_sponsors'), true)
  const privateChecks = result.requests.filter(request => request.path === '/rest/v1/sponsors')
  assert.deepEqual(privateChecks.map(request => [request.params.get('select'), request.params.get('limit')]), [['name', '0'], ['internal_notes', '0']])
  assert.equal(result.exitCode, 0)
})

test('live checker fails a public sponsor projection containing private fields', async () => {
  const result = await audit({ sponsorData: [{ id: 'local-only', name: 'Public alias', internal_notes: 'synthetic-only' }] })
  assert.equal(result.results.find(row => row.target === 'rpc:get_public_sponsors safe public fields')?.verdict, '[unsafe-sponsor-shape]')
  assert.equal(result.exitCode, 1)
})

test('zero returned rows do not disguise an allowed raw sponsor private-column query', async () => {
  const result = await audit({ rawSponsorStatus: 200 })
  const privateResults = result.results.filter(row => row.target.startsWith('private-column:sponsors'))
  assert.equal(privateResults.length, 2)
  assert.equal(privateResults.every(row => row.verdict === '[public-read-risk]'), true)
  assert.equal(result.exitCode, 1)
})

test('missing or malformed sponsor RPC is a failed check without a raw-table fallback', async () => {
  for (const options of [{ sponsorStatus: 404 }, { sponsorData: null }]) {
    const result = await audit(options)
    assert.equal(result.exitCode, 1)
    assert.equal(result.requests.filter(request => request.path === '/rest/v1/sponsors').every(request => request.params.get('limit') === '0'), true)
  }
})
