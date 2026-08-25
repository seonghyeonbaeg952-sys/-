import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const sessionPath =
  'C:/Users/seong/.codex/sessions/2026/08/24/rollout-2026-08-24T18-10-13-01a03308-d8f3-7ef0-be07-9cc35db7994d.jsonl'
const reader = createInterface({
  input: createReadStream(sessionPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})
const wanted = new Set([8652, 8658])

const collect = (value, output) => {
  if (typeof value === 'string') {
    if (value.includes('data-node-id')) output.push(value)
    return
  }
  if (Array.isArray(value)) return value.forEach((item) => collect(item, output))
  if (value && typeof value === 'object') Object.values(value).forEach((item) => collect(item, output))
}

for await (const line of reader) {
  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }
  if (!wanted.has(entry.ordinal)) continue
  const strings = []
  collect(entry.payload, strings)
  const source = strings.sort((a, b) => b.length - a.length)[0] ?? ''
  process.stdout.write(`\n===== ${entry.ordinal} =====\n`)
  for (const sourceLine of source.split(/\r?\n/)) {
    if (!/data-name="(?:Border|Stroke) Grammar/.test(sourceLine)) continue
    const name = sourceLine.match(/data-name="([^"]+)"/)?.[1]
    const className = sourceLine.match(/className="([^"]+)"/)?.[1]
    process.stdout.write(`${JSON.stringify({ name, className })}\n`)
  }
}
