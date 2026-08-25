const chunks = []
for await (const chunk of process.stdin) {
  chunks.push(chunk)
}

const raw = chunks.join('').replace(/^\d+:/, '')
const entry = JSON.parse(raw)
const design = entry.payload.item.result.content[0].text
const needles = process.argv.slice(2)

for (const needle of needles) {
  const index = design.indexOf(needle)
  process.stdout.write(`\n===== ${needle} @ ${index} =====\n`)
  if (index < 0) continue
  const start = Math.max(0, index - 900)
  process.stdout.write(`${design.slice(start, index + 3200)}\n`)
}
