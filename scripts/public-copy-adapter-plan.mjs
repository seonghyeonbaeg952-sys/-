// Read-only migration planner. Emits apply_patch edits; never writes source files.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import ts from 'typescript'
import { files, ownerOf } from './public-copy-inventory.mjs'
import { publicMarkupFingerprint, publicMarkupSource } from './public-copy-contract.mjs'

const excludedFiles = new Map([
  ['src/components/home/HomeHeroIntroOverlay.tsx', 'Animated graphical wordmark; changing individual seed letters changes the public artwork.'],
  ['src/pages/public/HomeRoute.tsx', 'Isolated motion-benchmark route loading label.'],
  ['src/pages/public/HomeSectionFlowSamplePage.tsx', 'Standalone historical sample, not the managed production experience.'],
  ['src/components/home/benchmark/BenchmarkConcertTemplate.tsx', 'Historical benchmark design preserved separately.'],
])
export function exclusion(file, candidate) {
  if (excludedFiles.has(file)) return excludedFiles.get(file)
  if (candidate.value === '웹사이트') return 'Honeypot field; not a visitor instruction.'
  if (/개인정보.*동의/.test(candidate.value)) return 'Consent statement: preserve the legal source, not an appearance override.'
  return null
}
const pageFor = file => {
  const name = path.basename(file)
  if (/HomeV4Sample(Header|MobileMenu|Image)|Footer|MapPreview|NotFound/.test(name)) return 'common'
  if (/Accompanist/.test(name)) return 'accompanist'
  if (/Conductor/.test(name)) return 'conductor'
  if (/Members/.test(name)) return 'members'
  if (/History/.test(name)) return 'history'
  if (/AboutPage|AboutOverview/.test(name)) return 'about'
  if (/SpiritPage|SpiritHeritage/.test(name)) return 'spirit'
  if (/ConcertDetail|ConcertPoster/.test(name)) return 'concert-detail'
  if (/ConcertsPage|ConcertFilter/.test(name)) return 'concerts'
  if (/NoticeDetail/.test(name)) return 'notice-detail'
  if (/NoticesPage/.test(name)) return 'notices'
  if (/GalleryPage|GalleryViewer/.test(name)) return 'gallery'
  if (/JoinApplication|JoinGuide/.test(name)) return 'join'
  if (/Contact|SupportPledge|SponsorsSection/.test(name)) return 'contact'
  return 'home'
}
const sections = { common: '공통 보조 안내', home: '홈 고정 안내', about: '소개 보조 문구', spirit: '정신 보조 문구', conductor: '지휘자 보조 표기', accompanist: '반주자 보조 표기', members: '단원 표시 단위', history: '연혁 보조 표기', concerts: '공연 목록 보조 안내', 'concert-detail': '공연 포스터 안내', notices: '공지 목록 보조 안내', 'notice-detail': '공지 상세 보조 안내', gallery: '자료 보기 안내', join: '입단지원서 보조 안내', contact: '후원·문의 보조 안내' }
function patchFor(file, source, changes) {
  const windows = changes.map(change => {
    let start = source.lastIndexOf('\n', Math.max(0, change.start - 1)) + 1
    for (let i = 0; i < 2 && start > 0; i++) start = source.lastIndexOf('\n', start - 2) + 1
    let end = source.indexOf('\n', change.end)
    if (end < 0) end = source.length
    else { end++; for (let i = 0; i < 2 && end < source.length; i++) { const next = source.indexOf('\n', end); end = next < 0 ? source.length : next + 1 } }
    return { start, end }
  }).sort((a, b) => a.start - b.start)
  const merged = []
  for (const window of windows) {
    const previous = merged.at(-1)
    if (previous && window.start <= previous.end) previous.end = Math.max(previous.end, window.end)
    else merged.push({ ...window })
  }
  const hunks = merged.map(({ start, end }) => {
    const before = source.slice(start, end)
    let after = before
    for (const change of changes.filter(c => c.start >= start && c.end <= end).sort((a, b) => b.start - a.start)) after = after.slice(0, change.start - start) + change.value + after.slice(change.end - start)
    const lines = (value, prefix) => value.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').map(line => prefix + line).join('\n')
    return `@@\n${lines(before, '-')}\n${lines(after, '+')}`
  })
  return `*** Update File: ${file}\n${hunks.join('\n')}\n`
}

export function buildCopyAdapterPlan() {
  const edits = [], definitions = new Map(), baseline = {}, exclusions = []
  const part = process.argv.find(arg => arg.startsWith('--part='))?.slice(7)
  for (const [index, { file, candidates }] of files.entries()) {
    if (part !== undefined && Math.floor(index / 6) !== Number(part)) continue
    const source = readFileSync(file, 'utf8')
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const nodes = []
    const visit = node => { nodes.push(node); ts.forEachChild(node, visit) }
    visit(tree)
    const changes = [], owners = new Set()
    const page = pageFor(file)
    for (const candidate of candidates) {
      const reason = exclusion(file, candidate)
      if (reason) { exclusions.push({ file, value: candidate.value, reason }); continue }
      const node = nodes.find(n => candidate.kind === 'text' ? ts.isJsxText(n) && n.getFullStart() === candidate.start : ts.isJsxAttribute(n) && n.initializer?.getStart(tree) === candidate.start)
      const owner = node && ownerOf(node)
      if (!owner) throw new Error(`No hook owner: ${file}:${candidate.line}`)
      const key = `${page}.fixed.${path.basename(file, '.tsx')}.${createHash('sha256').update(candidate.value).digest('hex').slice(0, 10)}`
      if (key.length > 120) throw new Error('Copy key too long')
      definitions.set(key, { key, page, section: sections[page], label: candidate.value.trim().replace(/\s+/g, ' ').slice(0, 50), defaultValue: candidate.value })
      changes.push({ start: candidate.start, end: candidate.end, value: `{copyText(${JSON.stringify(page)}, ${JSON.stringify(key)}, ${JSON.stringify(candidate.value)})}` })
      owners.add(owner)
    }
    if (!changes.length) continue
    if (/\bcopyText\b/.test(source)) throw new Error(`Existing copyText binding requires review: ${file}`)
    for (const owner of owners) changes.push({ start: owner.body.getStart(tree) + 1, end: owner.body.getStart(tree) + 1, value: '\n  const { copy: copyText } = useSiteEditor()' })
    if (!/import\s*\{[^}]*\buseSiteEditor\b[^}]*\}\s*from/.test(source)) {
      let relative = path.posix.relative(path.posix.dirname(file), 'src/components/site-editor/useSiteEditor')
      if (!relative.startsWith('.')) relative = `./${relative}`
      changes.push({ start: 0, end: 0, value: `import { useSiteEditor } from '${relative}'\n` })
    }
    let output = source
    for (const change of changes.sort((a, b) => b.start - a.start)) output = output.slice(0, change.start) + change.value + output.slice(change.end)
    baseline[file] = publicMarkupFingerprint(source, file)
    if (publicMarkupFingerprint(output, file) !== baseline[file]) {
      const before = publicMarkupSource(source, file), after = publicMarkupSource(output, file)
      let index = 0
      while (before[index] === after[index] && index < before.length) index++
      throw new Error(`Default JSX changed: ${file}\nBEFORE ${before.slice(Math.max(0, index - 120), index + 250)}\nAFTER ${after.slice(Math.max(0, index - 120), index + 250)}`)
    }
    edits.push({ file, patch: patchFor(file, source, changes) })
  }
  return { edits, definitions: [...definitions.values()], baseline, exclusions }
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/public-copy-adapter-plan.mjs')) {
  const plan = buildCopyAdapterPlan()
  console.log(JSON.stringify(process.argv.includes('--edits') ? plan : { files: plan.edits.map(e => e.file), definitions: plan.definitions.length, exclusions: plan.exclusions }, null, 2))
}
