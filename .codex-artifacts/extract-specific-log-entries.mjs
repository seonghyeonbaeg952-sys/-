import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const wanted = new Set([
  5718,
])
const sessionPath =
  'C:/Users/seong/.codex/sessions/2026/08/24/rollout-2026-08-24T18-10-13-01a03308-d8f3-7ef0-be07-9cc35db7994d.jsonl'
const reader = createInterface({
  input: createReadStream(sessionPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

const sanitize = (value, key = '') => {
  if (typeof value === 'string') {
    if (key === 'data' || value.startsWith('data:image/')) {
      return `[binary image omitted: ${value.length} chars]`
    }
    if (value.length > 40_000) {
      return `${value.slice(0, 18_000)}\n[...${value.length - 36_000} chars omitted...]\n${value.slice(-18_000)}`
    }
    return value
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, sanitize(child, childKey)]),
    )
  }
  return value
}

for await (const line of reader) {
  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }
  if (!wanted.has(entry.ordinal)) continue
  process.stdout.write(`\n===== ORDINAL ${entry.ordinal} =====\n`)
  process.stdout.write(`${JSON.stringify(sanitize(entry.payload), null, 2)}\n`)
}
