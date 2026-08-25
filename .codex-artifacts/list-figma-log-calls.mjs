import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

const sessionPath =
  'C:/Users/seong/.codex/sessions/2026/08/24/rollout-2026-08-24T18-10-13-01a03308-d8f3-7ef0-be07-9cc35db7994d.jsonl'
const reader = createInterface({
  input: createReadStream(sessionPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
})

for await (const line of reader) {
  let entry
  try {
    entry = JSON.parse(line)
  } catch {
    continue
  }
  if (entry.ordinal < 5600 || entry.ordinal > 9900) continue
  if (entry.type !== 'response_item') continue

  const payload = entry.payload ?? {}
  const haystack = JSON.stringify(payload)
  if (
    !haystack.includes('uFMHOvhxbvqNMye5UaQBnx') &&
    !haystack.includes('figma') &&
    !haystack.includes('2:3') &&
    !haystack.includes('5:45')
  ) {
    continue
  }

  const input = typeof payload.input === 'string' ? payload.input : ''
  const output = typeof payload.output === 'string' ? payload.output : ''
  const text = typeof payload.text === 'string' ? payload.text : ''
  const contentText = Array.isArray(payload.content)
    ? payload.content.map((item) => item?.text ?? '').join('\n')
    : ''
  const body = input || output || text || contentText
  process.stdout.write(
    `${JSON.stringify({
      ordinal: entry.ordinal,
      responseType: payload.type,
      name: payload.name,
      callId: payload.call_id,
      bodyLength: body.length,
      preview: body.slice(0, 220).replace(/\s+/g, ' '),
    })}\n`,
  )
}
