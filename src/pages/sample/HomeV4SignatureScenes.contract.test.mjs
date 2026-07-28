import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [
  pageSource,
  cssSource,
  fixtureSource,
  typeSource,
  scoreSource,
  scoreCoverSource,
  scoreSpreadSource,
  scoreFinalSource,
  spiritSource,
  spiritItemSource,
  archiveSource,
  archiveFolderSource,
  archiveFileSource,
  archiveModalSource,
  archiveEmptySource,
] = await Promise.all([
  read('./HomeV4SamplePage.tsx'),
  read('./HomeV4SignatureScenes.css'),
  read('./home-v4/homeV4SignatureFixtures.ts'),
  read('./home-v4/homeV4SignatureTypes.ts'),
  read('../../components/sample/home-v4/HomeV4MotetScoreSection.tsx'),
  read('../../components/sample/home-v4/HomeV4MotetScoreCover.tsx'),
  read('../../components/sample/home-v4/HomeV4MotetScoreSpread.tsx'),
  read('../../components/sample/home-v4/HomeV4MotetScoreFinal.tsx'),
  read('../../components/sample/home-v4/HomeV4SpiritSection.tsx'),
  read('../../components/sample/home-v4/HomeV4SpiritItem.tsx'),
  read('../../components/sample/home-v4/HomeV4ArchiveSection.tsx'),
  read('../../components/sample/home-v4/HomeV4ArchiveFolder.tsx'),
  read('../../components/sample/home-v4/HomeV4ArchiveFile.tsx'),
  read('../../components/sample/home-v4/HomeV4ArchiveMediaModal.tsx'),
  read('../../components/sample/home-v4/HomeV4ArchiveEmptyState.tsx'),
])

const componentSources = [
  scoreSource,
  scoreCoverSource,
  scoreSpreadSource,
  scoreFinalSource,
  spiritSource,
  spiritItemSource,
  archiveSource,
  archiveFolderSource,
  archiveFileSource,
  archiveModalSource,
  archiveEmptySource,
].join('\n')

const isolatedSources = [
  pageSource,
  fixtureSource,
  typeSource,
  componentSources,
].join('\n')

const normalFixtureSource = fixtureSource.slice(
  fixtureSource.indexOf('const normalFixture'),
  fixtureSource.indexOf('const longCopyFixture'),
)
const longFixtureSource = fixtureSource.slice(
  fixtureSource.indexOf('const longCopyFixture'),
  fixtureSource.indexOf('const emptyDataFixture'),
)
const emptyFixtureSource = fixtureSource.slice(
  fixtureSource.indexOf('const emptyDataFixture'),
)

test('01 keeps Phase 2B-3 code isolated from production data and components', () => {
  assert.doesNotMatch(
    isolatedSources,
    /from ['"][^'"]*(?:components\/(?:layout|home|join|spirit|contact)|publicData|supabase|HomeContent)[^'"]*['"]/i,
  )
})

test('02 imports the signature stylesheet only from the isolated page', () => {
  assert.match(pageSource, /import '\.\/HomeV4SignatureScenes\.css'/)
  assert.doesNotMatch(cssSource, /globals\.css|color-sample-theme\.css/)
})

test('03 roots every class selector in the exact Home V4 namespace', () => {
  const classSelectorLines = cssSource
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('.'))

  assert.ok(classSelectorLines.length > 0)
  for (const selectorLine of classSelectorLines) {
    assert.ok(
      selectorLine.startsWith(
        ".public-shell-home-sample-v4[data-design-candidate='home-v4']",
      ),
      `Unscoped selector found: ${selectorLine}`,
    )
  }
})

test('04 rejects forbidden CSS escapes and broad transitions', () => {
  assert.doesNotMatch(cssSource, /!important|transition:\s*all|@font-face/)
  assert.doesNotMatch(cssSource, /(^|\s)(:root|html|body|main|section|header|footer)\b[^{]*\{/m)
  assert.doesNotMatch(
    cssSource,
    /\.site-header|\.site-footer|\.public-shell-home(?:\s|\{|$)|\.color-sample-theme|\.home-section|\.score-book-scene|\.spirit-scorebook|\.archive-folder-back/,
  )
})

test('05 uses only prefixed signature-scene keyframes', () => {
  const keyframes = [...cssSource.matchAll(/@keyframes\s+([^\s{]+)/g)].map(
    (match) => match[1],
  )
  assert.ok(keyframes.length > 0)
  assert.ok(
    keyframes.every((name) =>
      /^home-v4-sample-(?:score|spirit|archive)-/.test(name),
    ),
  )
})

test('06 Score has exactly Cover, Spread, and Final visual stages', () => {
  assert.match(scoreSource, /HomeV4MotetScoreCover/)
  assert.match(scoreSource, /HomeV4MotetScoreSpread/)
  assert.match(scoreSource, /HomeV4MotetScoreFinal/)
  assert.doesNotMatch(scoreSource, /blank|empty-stage|Stage 04/i)
})

test('07 Score DOM order is Cover then Spread then Final', () => {
  const coverIndex = scoreSource.indexOf('<HomeV4MotetScoreCover')
  const spreadIndex = scoreSource.indexOf('<HomeV4MotetScoreSpread')
  const finalIndex = scoreSource.indexOf('<HomeV4MotetScoreFinal')
  assert.ok(coverIndex < spreadIndex)
  assert.ok(spreadIndex < finalIndex)
})

test('08 Score uses overlapping progress ranges without an animation queue', () => {
  assert.match(scoreSource, /smoothstep\(0\.2, 0\.34, progress\)/)
  assert.match(scoreSource, /smoothstep\(0\.62, 0\.76, progress\)/)
  assert.doesNotMatch(scoreSource, /setInterval|preventDefault/)
  assert.match(scoreSource, /addEventListener\('wheel'[\s\S]*passive: true/)
  assert.match(scoreSource, /clearTimeout\(frameWatchdogRef\.current\)/)
  assert.match(scoreSource, /setTimeout\([\s\S]*96\)/)
})

test('09 Score scroll work is rAF-throttled and fully cleaned up', () => {
  assert.match(scoreSource, /requestAnimationFrame/)
  assert.match(scoreSource, /cancelAnimationFrame/)
  assert.match(scoreSource, /IntersectionObserver/)
  assert.match(scoreSource, /ResizeObserver/)
  assert.match(scoreSource, /removeEventListener\('scroll'/)
})

test('10 Score hold requires normal, desktop width, height, fit, and motion', () => {
  assert.match(scoreSource, /HOLD_MIN_WIDTH = 1024/)
  assert.match(scoreSource, /HOLD_MIN_HEIGHT = 820/)
  assert.match(scoreSource, /scenario === 'normal'/)
  assert.match(scoreSource, /fitsAvailableHeight/)
  assert.match(scoreSource, /!reducedMotionQuery\.matches/)
})

test('11 Score flow fallback keeps every layer visible', () => {
  assert.match(scoreSource, /--home-v4-score-cover-opacity', '1'/)
  assert.match(scoreSource, /--home-v4-score-spread-opacity', '1'/)
  assert.match(scoreSource, /--home-v4-score-final-opacity', '1'/)
  assert.match(cssSource, /\.home-v4-score__stage \{\s*display: grid;/)
})

test('12 Score final CTA uses conditional DOM approach A', () => {
  assert.match(scoreSource, /showFinalCtas = !holdEnabled \|\| activeStage === 'final'/)
  assert.match(scoreFinalSource, /showCtas \? \(/)
  assert.doesNotMatch(scoreFinalSource, /aria-disabled|tabIndex=\{-1\}/)
  assert.doesNotMatch(cssSource, /\.home-v4-score[\s\S]{0,120}pointer-events:\s*none/)
})

test('13 Score uses a section h2, spread h3, final h3, and real links', () => {
  assert.match(scoreCoverSource, /<h2 id="home-v4-score-title">/)
  assert.match(scoreSpreadSource, /<h3>/)
  assert.match(scoreFinalSource, /<h3>/)
  assert.match(scoreFinalSource, /<a[\s\S]*href=\{cta\.href\}/)
})

test('14 normal Score fixture contains exactly six values', () => {
  const valueDefinition = fixtureSource.slice(
    fixtureSource.indexOf('const scoreValues'),
    fixtureSource.indexOf('const spiritItems'),
  )
  assert.equal((valueDefinition.match(/displayOrder:\s*[1-6],/g) ?? []).length, 6)
})

test('15 empty Score fixture removes two values and the secondary CTA', () => {
  assert.match(emptyFixtureSource, /!\['part', 'guidance'\]\.includes/)
  assert.match(emptyFixtureSource, /cta\.emphasis === 'primary'/)
})

test('16 long Score fixture preserves expanded prose without clamp', () => {
  assert.match(longFixtureSource, /정기연주회와 초청 공연, 교회와 지역사회/)
  assert.doesNotMatch(cssSource, /line-clamp|text-overflow:\s*ellipsis/)
})

test('17 reduced Score is a static sequential document', () => {
  assert.match(fixtureSource, /'reduced-motion': normalFixture/)
  assert.match(scoreSource, /reducedMotion/)
  assert.doesNotMatch(cssSource, /scroll-timeline/)
})

test('18 Spirit implements Candidate B as a static index', () => {
  assert.match(spiritSource, /home-v4-spirit__index/)
  assert.doesNotMatch(componentSources, /Candidate A|spirit-carousel|spirit-sticky/i)
})

test('19 Spirit resolver follows home summary, body sentence, fallback order', () => {
  const homeIndex = spiritSource.indexOf('item.homeSummary')
  const bodyIndex = spiritSource.indexOf('firstSentence(item.body)')
  const fallbackIndex = spiritSource.indexOf('item.fallbackSummary')
  assert.ok(homeIndex < bodyIndex)
  assert.ok(bodyIndex < fallbackIndex)
})

test('20 Spirit omits unresolved items and recalculates visible numbering', () => {
  assert.match(spiritSource, /\.filter\([\s\S]*Boolean\(resolved\.summary\)/)
  assert.match(spiritSource, /number=\{index \+ 1\}/)
  assert.match(spiritItemSource, /String\(number\)\.padStart\(2, '0'\)/)
})

test('21 normal Spirit fixture contains five values', () => {
  const spiritDefinition = fixtureSource.slice(
    fixtureSource.indexOf('const spiritItems'),
    fixtureSource.indexOf('const archiveMedia'),
  )
  assert.equal((spiritDefinition.match(/englishLabel:/g) ?? []).length, 5)
})

test('22 empty Spirit resolves to four items without a blank slot', () => {
  assert.match(emptyFixtureSource, /item\.id !== 'sacred'/)
  assert.match(emptyFixtureSource, /id: 'missing-copy'/)
  assert.doesNotMatch(spiritSource, /빈 항목|placeholder/i)
})

test('23 Spirit exposes one shared CTA and no item CTA', () => {
  assert.equal((spiritSource.match(/fixture\.cta/g) ?? []).length, 2)
  assert.doesNotMatch(spiritItemSource, /<(?:a\s|button\s)/)
})

test('24 Spirit long summaries remain natural-height content', () => {
  assert.match(longFixtureSource, /연습실에서 각자의 파트를 책임 있게 준비하고/)
  assert.doesNotMatch(cssSource, /text-overflow:\s*ellipsis|line-clamp/)
})

test('25 Archive defaults to a native closed folder in normal motion', () => {
  assert.match(archiveSource, /useState\(reducedMotion\)/)
  assert.match(archiveFolderSource, /className="home-v4-archive__folder-trigger"/)
  assert.match(archiveFolderSource, /aria-expanded="false"/)
})

test('26 Archive closed preview is explicitly 15 percent', () => {
  assert.match(cssSource, /\.home-v4-archive__folder-edge[\s\S]*height: 15%;/)
  assert.match(archiveFolderSource, /previewItems = media\.slice\(0, 3\)/)
})

test('27 Archive provides open and collapse actions with one controlled region', () => {
  assert.match(archiveFolderSource, /aria-controls="home-v4-archive-files"/)
  assert.match(archiveFolderSource, /aria-expanded="true"/)
  assert.match(archiveFolderSource, /파일 접기/)
  assert.match(archiveSource, /id="home-v4-archive-files"/)
})

test('28 normal Archive contains photo, video, and poster', () => {
  const archiveDefinition = fixtureSource.slice(
    fixtureSource.indexOf('const archiveMedia'),
    fixtureSource.indexOf('const normalFixture'),
  )
  assert.equal((archiveDefinition.match(/kind: '(?:photo|video|poster)'/g) ?? []).length, 3)
})

test('29 empty Archive contains only one visible video item', () => {
  assert.match(emptyFixtureSource, /media\.kind === 'video'/)
  assert.match(emptyFixtureSource, /displayOrder: 1/)
})

test('30 Archive supports a zero-item empty state and optional CTA', () => {
  assert.match(archiveSource, /visibleMedia\.length === 0/)
  assert.match(archiveEmptySource, /새로운|message/)
  assert.match(archiveEmptySource, /galleryHref \? \(/)
})

test('31 Archive mobile files use horizontal native scroll and 84vw cards', () => {
  assert.match(cssSource, /overflow-x: auto/)
  assert.match(cssSource, /flex: 0 0 84vw/)
  assert.match(cssSource, /scroll-snap-type: x mandatory/)
})

test('32 Archive mobile stack has previous and next native buttons', () => {
  assert.match(archiveSource, /이전 아카이브 파일/)
  assert.match(archiveSource, /다음 아카이브 파일/)
  assert.match(archiveSource, /viewport\.scrollBy/)
})

test('33 reduced Archive starts open and switches to a vertical static list', () => {
  assert.match(archiveSource, /isExpanded = staticMode \|\| expanded/)
  assert.match(cssSource, /data-reduced-motion='true'[\s\S]*grid-template-columns: 1fr/)
  assert.match(cssSource, /data-reduced-motion='true'[\s\S]*animation: none/)
})

test('34 modal is a named, modal dialog with a 44px-plus close button', () => {
  assert.match(archiveModalSource, /role="dialog"/)
  assert.match(archiveModalSource, /aria-modal="true"/)
  assert.match(archiveModalSource, /aria-labelledby=\{titleId\}/)
  assert.match(cssSource, /\.home-v4-archive-modal__heading button[\s\S]*width: 48px;[\s\S]*height: 48px;/)
})

test('35 modal supports Escape, backdrop close, and a focus trap', () => {
  assert.match(archiveModalSource, /event\.key === 'Escape'/)
  assert.match(archiveModalSource, /event\.target === event\.currentTarget/)
  assert.match(archiveModalSource, /event\.key !== 'Tab'/)
  assert.match(archiveModalSource, /focusableElements/)
})

test('36 modal restores focus and body overflow during cleanup', () => {
  assert.match(archiveModalSource, /previousBodyOverflow/)
  assert.match(archiveModalSource, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(archiveModalSource, /document\.body\.style\.overflow = previousBodyOverflow/)
  assert.match(archiveModalSource, /returnFocusElement\?\.focus\(\)/)
})

test('37 video iframe is conditional, lazy, fullscreen, and unmounted on close', () => {
  assert.match(archiveModalSource, /media\.kind === 'video' \? \(/)
  assert.match(archiveModalSource, /<iframe/)
  assert.match(archiveModalSource, /allowFullScreen/)
  assert.match(archiveModalSource, /loading="lazy"/)
  assert.match(archiveSource, /selectedMedia \? \(/)
})

test('38 photo and poster modal assets use object contain', () => {
  assert.match(archiveModalSource, /media\.kind === 'video'[\s\S]*<img/)
  assert.match(cssSource, /\.home-v4-archive-modal__media img[\s\S]*object-fit: contain/)
})

test('39 page composes Score, Spirit, Archive before only Sponsors and Support', () => {
  const scoreIndex = pageSource.indexOf('<HomeV4MotetScoreSection')
  const spiritIndex = pageSource.indexOf('<HomeV4SpiritSection')
  const archiveIndex = pageSource.indexOf('<HomeV4ArchiveSection')
  const pendingIndex = pageSource.indexOf('<div className="home-v4-pending-list">')
  assert.ok(scoreIndex < spiritIndex)
  assert.ok(spiritIndex < archiveIndex)
  assert.ok(archiveIndex < pendingIndex)
  assert.doesNotMatch(
    pageSource,
    /name: 'MOTET SCORE'|name: 'Spirit'|name: 'Archive'/,
  )
})

test('40 data remains fixture-only and live stays disabled', () => {
  assert.match(pageSource, /data-data-source="fixture"/)
  assert.match(pageSource, /Live Read-Only/)
  assert.match(pageSource, /disabled/)
  assert.doesNotMatch(isolatedSources, /createClient|from\(['"][^'"]+['"]\)/)
})
