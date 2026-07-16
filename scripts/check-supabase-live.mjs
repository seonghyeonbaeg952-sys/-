import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')
const tableChecks = [
  'site_settings',
  'hero_slides',
  'popup_notices',
  'about_sections',
  'conductor',
  'accompanist',
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
  {
    path: '/rest/v1/conductor?select=id,profile_image_alt,profile_summary,profile_highlight,hero_quote,current_roles,education_items,career_items,awards_items,activities_items,philosophy_title,philosophy_body,philosophy_quote,teaching_principles,message_title,message_body,activity_images,is_featured&limit=1',
    target: 'columns:conductor document profile fields',
  },
  {
    path: '/rest/v1/site_texts?select=id,key,page,section,label,value,default_value,input_type,value_type,sort_order,is_active&is_active=eq.true&limit=1',
    target: 'columns:site_texts CMS fields',
  },
]

const privateTableChecks = [
  {
    path: '/rest/v1/members?select=name&limit=1',
    target: 'private-column:members raw name',
  },
  {
    path: '/rest/v1/members?select=photo_url&limit=1',
    target: 'private-column:members photo URL',
  },
  {
    path: '/rest/v1/members?select=description&limit=1',
    target: 'private-column:members description',
  },
  {
    path: '/rest/v1/contacts?select=id&limit=1',
    target: 'private-table:contacts',
  },
  {
    path: '/rest/v1/join_applications?select=id&limit=1',
    target: 'private-table:join_applications',
  },
  {
    path: '/rest/v1/support_pledges?select=id&limit=1',
    target: 'private-table:support_pledges',
  },
]

const requiredSiteTextKeys = [
  'home.hero.title.line3',
  'home.hero.title.line4',
  'home.hero.subtitle',
  'home.gallery.empty.title',
  'home.gallery.empty.description',
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

    let data = null

    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      data = await response.json()
    }

    return { data, ok: response.ok, status: response.status }
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

const publicMemberFields = new Set([
  'display_order',
  'group_type',
  'id',
  'member_status',
  'part',
  'public_display_name',
])
const publicMembersResult = await requestJson({
  anonKey: supabaseAnonKey,
  body: {},
  method: 'POST',
  path: '/rest/v1/rpc/get_public_members',
  url: supabaseUrl,
})
const hasUnexpectedPublicMemberField = Array.isArray(publicMembersResult.data)
  && publicMembersResult.data.some((row) =>
    Object.keys(row ?? {}).some((key) => !publicMemberFields.has(key)),
  )

results.push({
  status: publicMembersResult.status,
  target: 'rpc:get_public_members safe public roster fields',
  verdict: publicMembersResult.ok
    ? !Array.isArray(publicMembersResult.data)
      ? '[invalid-member-shape]'
      : hasUnexpectedPublicMemberField
      ? '[unsafe-member-shape]'
      : '[ok]'
    : getStatusLabel(publicMembersResult),
})

const siteTextParams = new URLSearchParams({
  is_active: 'eq.true',
  key: `in.(${requiredSiteTextKeys.join(',')})`,
  select: 'key',
})
const requiredSiteTextsResult = await requestJson({
  anonKey: supabaseAnonKey,
  path: `/rest/v1/site_texts?${siteTextParams.toString()}`,
  url: supabaseUrl,
})
const availableSiteTextKeys = new Set(
  Array.isArray(requiredSiteTextsResult.data)
    ? requiredSiteTextsResult.data
        .map((row) => row?.key)
        .filter((key) => typeof key === 'string')
    : [],
)

for (const key of requiredSiteTextKeys) {
  results.push({
    status: requiredSiteTextsResult.status,
    target: `site-text:${key}`,
    verdict: requiredSiteTextsResult.ok
      ? availableSiteTextKeys.has(key)
        ? '[ok]'
        : '[missing-row]'
      : getStatusLabel(requiredSiteTextsResult),
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

const memberStorageResult = await requestJson({
  anonKey: supabaseAnonKey,
  body: { limit: 100, prefix: 'members' },
  method: 'POST',
  path: '/storage/v1/object/list/site-images',
  url: supabaseUrl,
})
const hasPublicMemberAssets =
  Array.isArray(memberStorageResult.data) && memberStorageResult.data.length > 0

results.push({
  status: memberStorageResult.status,
  target: 'storage:site-images/members legacy assets',
  verdict: memberStorageResult.ok
    ? hasPublicMemberAssets
      ? '[public-member-assets]'
      : '[ok]'
    : getStatusLabel(memberStorageResult),
})

console.table(results)

const hasFailure = results.some(
  (result) => result.verdict !== '[ok]' && result.verdict !== '[ok-private]',
)

if (hasFailure) {
  process.exitCode = 1
}
