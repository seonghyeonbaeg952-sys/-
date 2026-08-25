import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const wanted = new Set([8652, 8658])
const sessionPath =
  'C:/Users/seong/.codex/sessions/2026/08/24/rollout-2026-08-24T18-10-13-01a03308-d8f3-7ef0-be07-9cc35db7994d.jsonl'
const reader = createInterface({
  input: createReadStream(sessionPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

const collectStrings = (value, output) => {
  if (typeof value === 'string') {
    if (value.includes('data-node-id')) output.push(value)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output))
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStrings(item, output))
  }
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
  collectStrings(entry.payload, strings)
  const source = strings.sort((a, b) => b.length - a.length)[0] ?? ''
  const lines = source.split(/\r?\n/)
  process.stdout.write(`\n===== FIGMA CONTEXT ORDINAL ${entry.ordinal} =====\n`)
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].includes('data-node-id')) continue
    const tagLine = lines[index]
    const text = lines
      .slice(index, index + 5)
      .join(' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\{`|`\}/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    process.stdout.write(
      `${JSON.stringify({
        id: tagLine.match(/data-node-id="([^"]+)"/)?.[1],
        name: tagLine.match(/data-name="([^"]+)"/)?.[1],
        className: tagLine.match(/className="([^"]+)"/)?.[1],
        text: text.slice(0, 240),
      })}\n`,
    )
  }
}
