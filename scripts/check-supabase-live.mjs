import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')
const tableChecks = [
  'site_settings',
  'hero_slides',
  'popup_notices',
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
  'support_settings',
  'sponsors',
]

const columnChecks = [
  {
    path: '/rest/v1/locations?select=id,map_embed_url,email,fax&limit=1',
    target: 'columns:locations map/contact fields',
  },
  {
    path: '/rest/v1/locations?select=id,image_url,image_alt,image_caption&limit=1',
    target: 'columns:locations image fields',
  },
  {
    path: '/rest/v1/site_settings?select=id,home_hero_eyebrow,home_info_card_3_title,home_gallery_title,home_support_title&limit=1',
    target: 'columns:site_settings home content fields',
  },
  {
    path: '/rest/v1/support_settings?select=id,enable_online_submission,form_note,privacy_notice,print_button_label,submit_button_label,success_message&limit=1',
    target: 'columns:support_settings pledge format fields',
  },
  {
    path: '/rest/v1/sponsors?select=id,name,display_name,category,tier,logo_url,website_url,consent_public,show_on_home,show_on_support,show_on_footer,display_order&is_visible=eq.true&consent_public=eq.true&limit=1',
    target: 'columns:sponsors public consent fields',
  },
]

const privateTableChecks = [
  {
    path: '/rest/v1/support_pledges?select=id&limit=1',
    target: 'private-table:support_pledges',
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

async function requestJsonOnce({ anonKey, body, method = 'GET', path, url }) {
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

function wait(timeoutMs) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, timeoutMs)
  })
}

async function requestJson(options) {
  const firstResult = await requestJsonOnce(options)

  if (firstResult.status !== 'network' && firstResult.status !== 'timeout') {
    return firstResult
  }

  await wait(250)
  return requestJsonOnce(options)
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

for (const check of privateTableChecks) {
  const result = await requestJson({
    anonKey: supabaseAnonKey,
    path: check.path,
    url: supabaseUrl,
  })

  results.push({
    status: result.status,
    target: check.target,
    verdict:
      result.status === 401 || result.status === 403
        ? '[ok-private]'
        : result.ok
          ? '[public-read-risk]'
        : getStatusLabel(result),
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

const sponsorStorageResult = await requestJson({
  anonKey: supabaseAnonKey,
  body: { limit: 1, prefix: 'sponsors' },
  method: 'POST',
  path: '/storage/v1/object/list/site-images',
  url: supabaseUrl,
})

results.push({
  status: sponsorStorageResult.status,
  target: 'storage:site-images/sponsors',
  verdict: getStatusLabel(sponsorStorageResult),
})

console.table(results)

const hasFailure = results.some(
  (result) => result.verdict !== '[ok]' && result.verdict !== '[ok-private]',
)

if (hasFailure) {
  process.exitCode = 1
}
