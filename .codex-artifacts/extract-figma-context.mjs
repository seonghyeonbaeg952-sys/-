import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const sessionPath =
  'C:/Users/seong/.codex/sessions/2026/08/24/rollout-2026-08-24T18-10-13-01a03308-d8f3-7ef0-be07-9cc35db7994d.jsonl'
const needles = ['uFMHOvhxbvqNMye5UaQBnx', 'ONE VOICE', 'JOIN THE HARMONY']

const reader = createInterface({
  input: createReadStream(sessionPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

let matchIndex = 0
for await (const line of reader) {
  if (!needles.some((needle) => line.includes(needle))) continue

  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }

  if (entry.type === 'event_msg') continue

  const strings = []
  const visit = (value, path = '$') => {
    if (typeof value === 'string') {
      if (needles.some((needle) => value.includes(needle))) {
        strings.push({ path, value })
      }
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => visit(item, `${path}.${key}`))
    }
  }
  visit(entry.payload)

  for (const { path, value } of strings) {
    matchIndex += 1
    const needle = needles.find((candidate) => value.includes(candidate))
    const needleIndex = needle ? value.indexOf(needle) : 0
    const excerptStart = Math.max(0, needleIndex - 520)
    const excerptEnd = Math.min(value.length, needleIndex + 1_200)
    process.stdout.write(
      `\n===== MATCH ${matchIndex} ordinal=${entry.ordinal} type=${entry.type} payloadType=${entry.payload?.type ?? ''} path=${path} length=${value.length} =====\n`,
    )
    process.stdout.write(`${value.slice(excerptStart, excerptEnd)}\n`)
  }
}
