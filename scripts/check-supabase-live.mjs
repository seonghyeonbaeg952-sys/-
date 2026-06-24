import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')
const tableChecks = [
  'site_settings',
  'hero_slides',
  'about_sections',
  'history',
  'concerts',
  'notices',
  'gallery',
  'videos',
  'posters',
  'join_info',
  'faq',
  'locations',
]

const columnChecks = [
  {
    path: '/rest/v1/locations?select=id,map_embed_url,email,fax&limit=1',
    target: 'columns:locations map/contact fields',
  },
]

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return new Map()
  }

  const content = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const entries = new Map()

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')

    if (separatorIndex < 0) {
      continue
    }

    entries.set(
      line.slice(0, separatorIndex).trim(),
      line.slice(separatorIndex + 1).trim(),
    )
  }

  return entries
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  return { controller, timer }
}

function getStatusLabel(result) {
  if (result.ok) {
    return '[ok]'
  }

  if (result.status === 404) {
    return '[missing-table-or-bucket]'
  }

  if (result.status === 401 || result.status === 403) {
    return '[blocked-by-auth-or-rls]'
  }

  if (result.status === 'timeout') {
    return '[timeout]'
  }

  if (result.status === 'network') {
    return '[network-error]'
  }

  return '[failed]'
}

async function requestJson({ anonKey, body, method = 'GET', path, url }) {
  const { controller, timer } = createTimeoutSignal(12000)

  try {
    const response = await fetch(`${url}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      method,
      signal: controller.signal,
    })

    return { ok: response.ok, status: response.status }
  } catch (error) {
    return {
      ok: false,
      status:
        error instanceof Error && error.name === 'AbortError'
          ? 'timeout'
          : 'network',
    }
  } finally {
    clearTimeout(timer)
  }
}

const envEntries = parseEnvFile(envPath)
const supabaseUrl = envEntries.get('VITE_SUPABASE_URL')
const supabaseAnonKey = envEntries.get('VITE_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env: [missing]')
  process.exit(1)
}

const results = []

for (const table of tableChecks) {
  const result = await requestJson({
    anonKey: supabaseAnonKey,
    path: `/rest/v1/${table}?select=id&is_visible=eq.true&limit=1`,
    url: supabaseUrl,
  })

  results.push({
    status: result.status,
    target: `table:${table}`,
    verdict: getStatusLabel(result),
  })
}

for (const check of columnChecks) {
  const result = await requestJson({
    anonKey: supabaseAnonKey,
    path: check.path,
    url: supabaseUrl,
  })

  results.push({
    status: result.status,
    target: check.target,
    verdict: getStatusLabel(result),
  })
}

const storageResult = await requestJson({
  anonKey: supabaseAnonKey,
  body: { limit: 1, prefix: 'hero' },
  method: 'POST',
  path: '/storage/v1/object/list/site-images',
  url: supabaseUrl,
})

results.push({
  status: storageResult.status,
  target: 'storage:site-images/hero',
  verdict: getStatusLabel(storageResult),
})

console.table(results)

const hasFailure = results.some((result) => result.verdict !== '[ok]')

if (hasFailure) {
  process.exitCode = 1
}
