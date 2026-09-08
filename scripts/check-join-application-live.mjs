import { loadEnv } from 'vite'

// Read-only readiness check. Never submits an application or reads applicant rows.
const env = loadEnv('development', process.cwd(), 'VITE_')
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY
if (!url || !key) throw new Error('Public Supabase configuration is missing.')
const headers = { apikey: key, Authorization: `Bearer ${key}` }
async function read(path) {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers })
  return { status: response.status, data: await response.json() }
}
const guide = await read('join_info?select=id&is_visible=eq.true&limit=1')
const guideId = guide.data?.[0]?.id
const config = guideId
  ? await read(`rpc/get_join_application_config?p_join_info_id=${encodeURIComponent(guideId)}`)
  : null
const applicantRead = await read('join_applications?select=id&limit=0')
const ready = config?.status === 200 && config.data?.[0]?.form_version === 2
const privateRecordsProtected = applicantRead.status === 401 || applicantRead.status === 403
console.log(JSON.stringify({
  publicGuideAvailable: guide.status === 200 && Boolean(guideId),
  newApplicationServerReady: ready,
  configStatus: config?.status ?? null,
  configErrorCode: config?.data?.code ?? null,
  applicantPublicReadDenied: privateRecordsProtected,
  mutatingRequests: 0,
}, null, 2))
if (!ready || !privateRecordsProtected) process.exitCode = 1
