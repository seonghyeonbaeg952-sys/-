import { mkdir, readFile, writeFile } from 'node:fs/promises'

// Public primary-source issue metadata only. No tokens or issue bodies are saved.
const root = new URL('../docs/research/site-photos/', import.meta.url)
const topics = {
  replacement: /replace|replacement|update|revert|reset|undo|persist|save/i,
  upload: /upload|file|attachment|library|media|asset/i,
  responsive: /responsive|mobile|tablet|width|height|size|aspect|crop|resize|fit/i,
  accessibility: /accessib|alt text|alternative|keyboard|focus|screen reader|aria/i,
  preview: /preview|loading|placeholder|broken|display|render/i,
}
const rows = new Map()
const progress = {}
await mkdir(root, { recursive: true })
try {
  const checkpoint = JSON.parse(await readFile(new URL('checkpoint.json', root), 'utf8'))
  checkpoint.references.forEach(row => rows.set(row.url, row))
  Object.assign(progress, checkpoint.progress)
} catch (error) { if (error.code !== 'ENOENT') throw error }
for (const scope of ['image in:title created:2022-01-01..2026-09-30', 'image in:title created:2020-01-01..2021-12-31', 'image in:title created:2017-01-01..2019-12-31', 'media in:title -image in:title created:2017-01-01..2026-09-30', 'strapi:image in:title created:2017-01-01..2026-09-30']) {
  if (rows.size === 2000) break
  for (let page = 1; page <= 10; page++) {
    if (page <= (progress[scope] ?? 0)) continue
    const repository = scope.startsWith('strapi:') ? 'strapi/strapi' : 'WordPress/gutenberg'
    const query = `repo:${repository} is:issue ${scope.replace(/^strapi:/, '')}`
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=100&page=${page}`
    let response
    for (let attempt = 0; attempt < 5; attempt++) {
      try { response = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Motet-CMS-photo-research' } }) }
      catch (error) { if (attempt === 4) throw error; await new Promise(resolve => setTimeout(resolve, 10000)); continue }
      if (response?.ok) break
      if (![403, 429, 502, 503].includes(response.status)) throw new Error(`GitHub HTTP ${response.status}`)
      await new Promise(resolve => setTimeout(resolve, 15000))
    }
    if (!response?.ok) throw new Error(`Research interrupted: GitHub HTTP ${response?.status}; no successful corpus claimed.`)
    const data = await response.json()
    if (data.incomplete_results) throw new Error('GitHub returned an incomplete search; retry rather than claiming completeness.')
    for (const item of data.items) {
      if (rows.size === 2000) break
      const text = `${item.title}\n${item.body ?? ''}`
      rows.set(item.html_url, {
        url: item.html_url, title: item.title, createdAt: item.created_at,
        labels: item.labels.map(label => label.name),
        topics: Object.entries(topics).filter(([, pattern]) => pattern.test(text)).map(([topic]) => topic),
      })
    }
    console.log(`${scope}, page ${page}: ${rows.size} distinct references retrieved and automatically classified`)
    progress[scope] = page
    if (page * 100 >= Math.min(data.total_count, 1000)) progress[scope] = 10
    await writeFile(new URL('checkpoint.json', root), JSON.stringify({ progress, references: [...rows.values()] }, null, 2) + '\n')
    if (rows.size === 2000 || page * 100 >= Math.min(data.total_count, 1000)) break
    await new Promise(resolve => setTimeout(resolve, 6500))
  }
}
if (rows.size !== 2000) throw new Error(`Expected 2000 distinct references, retrieved ${rows.size}.`)
await mkdir(root, { recursive: true })
const references = [...rows.values()]
await writeFile(new URL('references-2000.json', root), JSON.stringify({
  collectedAt: new Date().toISOString(), method: 'GitHub primary-source title/body retrieval; automated thematic classification. Not 2,000 individual human-level design reviews.',
  repositories: ['WordPress/gutenberg', 'strapi/strapi'], relevance: 'image or media in issue title; disjoint date/query partitions with URL deduplication', count: references.length, references,
}, null, 2) + '\n')
const counts = Object.fromEntries(Object.keys(topics).map(topic => [topic, references.filter(row => row.topics.includes(topic)).length]))
await writeFile(new URL('summary.json', root), JSON.stringify({ count: references.length, counts, sample: references.filter(row => row.topics.length >= 4).slice(0, 20) }, null, 2) + '\n')
console.log(JSON.stringify({ completed: true, count: references.length, counts }))
