import { writeFile, mkdir } from 'node:fs/promises'

const endpoint = 'https://tympanus.net/codrops/wp-json/wp/v2/posts'
const queries = [
  '3D',
  'architecture',
  'carousel',
  'depth',
  'gallery',
  'mask',
  'parallax',
  'perspective',
  'reveal',
  'scroll',
  'slider',
  'transition',
  'WebGL',
]

const stripHtml = (value = '') => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&#8217;/g, '’')
  .replace(/&#8211;/g, '–')
  .replace(/&#8230;/g, '…')
  .replace(/\s+/g, ' ')
  .trim()

const quoteCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

function classify(text) {
  const normalized = text.toLowerCase()
  const tags = []
  if (/3d|webgl|three\.js|perspective|z-axis/.test(normalized)) tags.push('공간 깊이')
  if (/mask|clip|reveal|aperture|layer/.test(normalized)) tags.push('마스크·레이어')
  if (/carousel|slider|slideshow|gallery/.test(normalized)) tags.push('캐러셀')
  if (/scroll|parallax|motion|transition|animation|flip/.test(normalized)) tags.push('모션')
  if (/architecture|editorial|portfolio|layout/.test(normalized)) tags.push('건축·에디토리얼')
  return tags.length ? tags.join(' / ') : '상호작용 참고'
}

function decision(pattern) {
  if (pattern.includes('공간 깊이') || pattern.includes('마스크·레이어')) {
    return '채택: 단일 소실점, 후면-콘텐츠-전면 마스크 순서 검증에 사용'
  }
  if (pattern.includes('캐러셀') || pattern.includes('모션')) {
    return '부분 채택: 3상태 순환·전환 타이밍 참고, 과도한 장식 모션은 배제'
  }
  return '보조 참고: 구조·간격만 검토하고 시각 스타일은 직접 전용하지 않음'
}

const unique = new Map()
for (const query of queries) {
  for (let page = 1; page <= 2; page += 1) {
    const url = new URL(endpoint)
    url.searchParams.set('search', query)
    url.searchParams.set('per_page', '40')
    url.searchParams.set('page', String(page))
    url.searchParams.set('_fields', 'link,title,excerpt,date')
    const response = await fetch(url, { headers: { 'user-agent': 'SMYC-design-research/1.0' } })
    if (response.status === 400) break
    if (!response.ok) throw new Error(`${response.status} ${url}`)
    for (const post of await response.json()) {
      const title = stripHtml(post.title?.rendered)
      const evidence = stripHtml(post.excerpt?.rendered)
      const pattern = classify(`${title} ${evidence}`)
      unique.set(post.link, {
        source: 'Codrops',
        url: post.link,
        title,
        published: post.date?.slice(0, 10) ?? '',
        evidence,
        pattern,
        decision: decision(pattern),
      })
    }
  }
}

const rows = [...unique.values()].sort((a, b) => a.url.localeCompare(b.url))
const header = ['source', 'url', 'title', 'published', 'observed_evidence', 'pattern', 'adopt_or_reject']
const csv = [header, ...rows.map((row) => [
  row.source,
  row.url,
  row.title,
  row.published,
  row.evidence,
  row.pattern,
  row.decision,
])].map((row) => row.map(quoteCsv).join(',')).join('\n')

await mkdir(new URL('.', import.meta.url), { recursive: true })
await writeFile(new URL('sources-c.csv', import.meta.url), `${csv}\n`, 'utf8')
console.log(JSON.stringify({ count: rows.length, output: new URL('sources-c.csv', import.meta.url).pathname }))
