import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const sessionPath =
  'C:/Users/seong/.codex/sessions/2026/08/24/rollout-2026-08-24T18-10-13-01a03308-d8f3-7ef0-be07-9cc35db7994d.jsonl'
const reader = createInterface({
  input: createReadStream(sessionPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

const collect = (value, output) => {
  if (typeof value === 'string') {
    if (value.includes('data-name="Section / Closing CTA"')) output.push(value)
    return
  }
  if (Array.isArray(value)) return value.forEach((item) => collect(item, output))
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collect(item, output))
  }
}

for await (const line of reader) {
  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }
  if (entry.ordinal !== 8652) continue
  const strings = []
  collect(entry.payload, strings)
  const source = strings.sort((a, b) => b.length - a.length)[0] ?? ''
  const start = source.indexOf('data-name="Section / Closing CTA"')
  const sectionStart = source.lastIndexOf('<div', start)
  const footer = source.indexOf('data-name="Footer / Existing Site Shell"', start)
  const sectionEnd = source.lastIndexOf('<div', footer)
  process.stdout.write(source.slice(sectionStart, sectionEnd))
}
