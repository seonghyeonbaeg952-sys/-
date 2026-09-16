import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const rows = {
  join_applications: [
    { status: 'new', is_archived: false }, { status: 'contacted', is_archived: false },
    { status: 'audition_guided', is_archived: false }, { status: 'on_hold', is_archived: false },
    { status: 'done', is_archived: false }, { status: 'new', is_archived: true },
  ],
}
globalThis.__dashboardCounter = async ({ table, filters = [], inFilters = [] }) => ({
  data: (rows[table] ?? []).filter(row => filters.every(f => row[f.column] === f.value) && inFilters.every(f => f.values.includes(row[f.column]))).length,
  error: null,
})
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true }, plugins: [{
  name: 'dashboard-count-transport', enforce: 'pre',
  resolveId(id) { if (id.endsWith('/lib/cms') || id === './cms') return '\0dashboard-count-transport' },
  load(id) { if (id === '\0dashboard-count-transport') return 'export const countRows=(options)=>globalThis.__dashboardCounter(options)' },
}] })
after(async () => { delete globalThis.__dashboardCounter; await vite.close() })
const mod = await vite.ssrLoadModule('/src/lib/cmsDashboard.ts')
test('dashboard counts all non-completed admissions but excludes archived receipts', async () => {
  assert.equal(typeof mod.loadDashboardSummary, 'function')
  const result = await mod.loadDashboardSummary()
  assert.equal(result.summary.joinApplications, 4)
  assert.equal(result.failedCount, 0)
})
test('one failed count does not freeze the dashboard or erase successful counts', async () => {
  assert.equal(typeof mod.loadDashboardSummary, 'function')
  globalThis.__dashboardCounter = async ({ table }) => { if (table === 'contacts') throw new Error('private SQL detail'); return { data: 2, error: null } }
  const result = await mod.loadDashboardSummary()
  assert.equal(result.summary.contacts, null)
  assert.equal(result.summary.joinApplications, 2)
  assert.equal(result.failedCount, 1)
  assert.doesNotMatch(JSON.stringify(result), /private SQL detail/)
})
