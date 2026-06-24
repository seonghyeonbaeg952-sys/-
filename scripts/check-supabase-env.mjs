import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')
const requiredKeys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SITE_NAME',
  'VITE_SITE_URL',
]

const forbiddenKeyPatterns = [
  /SERVICE[_-]?ROLE/i,
  /SUPABASE[_-]?SERVICE/i,
  /SUPABASE[_-]?SECRET/i,
]

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return new Map()
  }

  const content = readFileSync(filePath, 'utf8')
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

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()

    entries.set(key, value)
  }

  return entries
}

const envEntries = parseEnvFile(envPath)

console.log(`.env.local: ${existsSync(envPath) ? '[exists]' : '[missing]'}`)

for (const key of requiredKeys) {
  const hasValue = Boolean(envEntries.get(key))
  console.log(`${key}: ${hasValue ? '[set]' : '[missing]'}`)
}

const forbiddenKeys = [...envEntries.keys()].filter((key) =>
  forbiddenKeyPatterns.some((pattern) => pattern.test(key)),
)

if (forbiddenKeys.length > 0) {
  console.warn(
    `forbidden server-side key detected: ${forbiddenKeys
      .map((key) => `${key}=[present]`)
      .join(', ')}`,
  )
  process.exitCode = 1
} else {
  console.log('server-side Supabase secret keys: [not found]')
}
