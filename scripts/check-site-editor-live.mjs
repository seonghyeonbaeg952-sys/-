import { loadEnv } from 'vite'

// Read-only checks. Never reads a private row or submits an editor mutation.
const env = loadEnv('development', process.cwd(), 'VITE_')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) throw new Error('Public Supabase configuration is missing.')
const headers = { apikey: key, Authorization: `Bearer ${key}` }
const checks = await Promise.all([
  ['published snapshots', 'rpc/get_public_site_editor_pages'],
  ['private drafts', 'site_editor_pages?select=page_key&limit=0'],
  ['private revisions', 'site_editor_revisions?select=id&limit=0'],
].map(async ([label, path]) => {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers })
  const data = await response.json()
  const publicRead = label === 'published snapshots'
  const validProjection = Array.isArray(data) && data.every(row =>
    Object.keys(row).every(field => ['page_key', 'document', 'published_at'].includes(field))
    && typeof row.page_key === 'string' && row.document?.schemaVersion === 1)
  return {
    label, status: response.status,
    passed: publicRead ? response.status === 200 && validProjection : [401, 403].includes(response.status),
  }
}))
console.log(JSON.stringify({ checks, mutatingRequests: 0, privateRowsRead: 0 }, null, 2))
if (checks.some(check => !check.passed)) process.exitCode = 1
