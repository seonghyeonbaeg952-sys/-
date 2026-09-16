import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

// One read-only Storage list request (the SDK uses POST for listing). Do not
// print object names, URLs, metadata, keys or private contents. Never upload.
const env = loadEnv('development', process.cwd(), 'VITE_')
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) throw new Error('Public Supabase configuration is missing.')
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const { data, error } = await client.storage.from('site-images').list('', { limit: 1 })
const status = Number(error?.status ?? error?.statusCode)
const denied = (error && [401,403].includes(status)) || (!error && Array.isArray(data) && data.length === 0)
console.log(JSON.stringify({ check: 'anonymous site-images listing', passed: Boolean(denied), returnedEntries: Array.isArray(data) ? data.length : null, status: error ? status || 'unknown' : 200, uploads: 0, filesDownloaded: 0, warning: 'Public URL retrieval is a separate, still-public boundary.' }, null, 2))
if (!denied) process.exitCode = 1
