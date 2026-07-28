import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [
  pageSource,
  cssSource,
  appSource,
  fixtureSource,
  joinSource,
  stepsSource,
  waveSource,
  concertSource,
  notesSource,
  programmeSource,
  emptySource,
] = await Promise.all([
  read('./HomeV4SamplePage.tsx'),
  read('./HomeV4JoinConcert.css'),
  read('../../App.tsx'),
  read('./home-v4/homeV4JoinConcertFixtures.ts'),
  read('../../components/sample/home-v4/HomeV4JoinSection.tsx'),
  read('../../components/sample/home-v4/HomeV4JoinSteps.tsx'),
  read('../../components/sample/home-v4/HomeV4JoinWaveTransition.tsx'),
  read('../../components/sample/home-v4/HomeV4ConcertSection.tsx'),
  read('../../components/sample/home-v4/HomeV4ConcertNotes.tsx'),
  read('../../components/sample/home-v4/HomeV4ConcertProgramme.tsx'),
  read('../../components/sample/home-v4/HomeV4ConcertEmptyState.tsx'),
])

const implementationSources = [
  pageSource,
  fixtureSource,
  joinSource,
  stepsSource,
  waveSource,
  concertSource,
  notesSource,
  programmeSource,
  emptySource,
].join('\n')

const normalJoinSource = fixtureSource.slice(
  fixtureSource.indexOf('const normalJoin'),
  fixtureSource.indexOf('const fifthStep'),
)
const longJoinSource = fixtureSource.slice(
  fixtureSource.indexOf('const longJoin'),
  fixtureSource.indexOf('const emptyJoin'),
)
const emptyJoinSource = fixtureSource.slice(
  fixtureSource.indexOf('const emptyJoin'),
  fixtureSource.indexOf('const normalConcert'),
)
const normalConcertSource = fixtureSource.slice(
  fixtureSource.indexOf('const normalConcert'),
  fixtureSource.indexOf('export const homeV4ConcertNoPosterFixture'),
)
const emptyConcertSource = fixtureSource.slice(
  fixtureSource.indexOf('const emptyConcert'),
  fixtureSource.indexOf('const fixtures'),
)

test('01 preserves the isolated route and avoids production imports', () => {
  assert.match(appSource, /path="home-v4"/)
  assert.doesNotMatch(
    implementationSources,
    /from ['"][^'"]*(?:components\/(?:layout|home|join|concert)|publicData|supabase|HomeContent)[^'"]*['"]/i,
  )
})

test('02 composes only Join and Concert before the remaining placeholders', () => {
  assert.match(pageSource, /<HomeV4JoinSection/)
  assert.match(pageSource, /<HomeV4ConcertSection/)
  assert.doesNotMatch(pageSource, /name: 'Join'|name: 'Concert'/)
  assert.match(pageSource, /name: 'MOTET SCORE'/)
})

test('03 keeps Join normal, long, empty, and reduced-motion fixture routing', () => {
  assert.match(fixtureSource, /normal:\s*\{[\s\S]*join: normalJoin/)
  assert.match(fixtureSource, /'long-copy':\s*\{[\s\S]*join: longJoin/)
  assert.match(fixtureSource, /'empty-data':\s*\{[\s\S]*join: emptyJoin/)
  assert.match(
    fixtureSource,
    /'reduced-motion':\s*\{[\s\S]*join: normalJoin/,
  )
})

test('04 normal Join has four visible ordered steps', () => {
  assert.equal((normalJoinSource.match(/displayOrder:\s*[1-4]/g) ?? []).length, 4)
  assert.equal((normalJoinSource.match(/isVisible:\s*true/g) ?? []).length, 10)
})

test('05 long Join adds a fifth step and allows natural copy growth', () => {
  assert.match(longJoinSource, /steps:\s*\[[\s\S]*fifthStep/)
  assert.doesNotMatch(cssSource, /line-clamp|text-overflow:\s*ellipsis/)
})

test('06 empty Join exposes three process steps and a reduced fact set', () => {
  assert.match(emptyJoinSource, /steps:\s*normalJoin\.steps\.slice\(0,\s*3\)/)
  assert.match(emptyJoinSource, /id === 'guardian'[\s\S]*isVisible: false/)
})

test('07 Join target copy covers youth, teen, and university divisions', () => {
  assert.match(normalJoinSource, /유소년반/)
  assert.match(normalJoinSource, /청소년반/)
  assert.match(normalJoinSource, /대학부/)
})

test('08 Join derives the visible step count and keeps dot numbering semantic', () => {
  assert.match(joinSource, /visibleSteps\.length/)
  assert.match(stepsSource, /<ol/)
  assert.match(stepsSource, /data-step-count=\{visibleSteps\.length\}/)
})

test('09 Join hold moves only the lower wave while the editorial panel stays still', () => {
  assert.match(cssSource, /\.home-v4-join\s*\{[\s\S]*transform:\s*none/)
  assert.match(cssSource, /\.home-v4-join-wave\s*\{[\s\S]*transform:/)
  assert.doesNotMatch(joinSource, /panel\.style\.setProperty\([^)]*transform/)
})

test('10 Join hold is desktop-only and falls back for reduced and long copy', () => {
  assert.match(joinSource, /matchMedia\('\(min-width: 1024px\)'\)/)
  assert.match(joinSource, /prefers-reduced-motion: reduce/)
  assert.match(joinSource, /scenario !== 'long-copy'/)
  assert.match(joinSource, /panelHeight <= availableHeight/)
})

test('11 Join motion uses bounded rAF work and cleans every observer/listener', () => {
  assert.match(joinSource, /requestAnimationFrame/)
  assert.match(joinSource, /ResizeObserver/)
  assert.match(joinSource, /IntersectionObserver/)
  assert.match(joinSource, /cancelAnimationFrame/)
  assert.match(joinSource, /resizeObserver\.disconnect\(\)/)
  assert.match(joinSource, /intersectionObserver\.disconnect\(\)/)
  assert.match(joinSource, /removeEventListener\('scroll'/)
})

test('12 Join motion does not lock body, hijack wheel, or use scroll snap', () => {
  assert.doesNotMatch(joinSource, /document\.body|wheel|preventDefault/)
  assert.doesNotMatch(cssSource, /scroll-snap|scroll-behavior/)
})

test('13 Concert is Candidate B and excludes Candidate A language', () => {
  assert.match(concertSource, /data-concert-candidate="b"/)
  assert.match(concertSource, /CANDIDATE B · ALWAYS-OPEN EDITORIAL PROGRAMME/)
  assert.doesNotMatch(implementationSources, /CANDIDATE A/)
})

test('14 Concert normal fixture exposes at most three clear actions', () => {
  const actionsBlock = normalConcertSource.slice(
    normalConcertSource.indexOf('actions:'),
    normalConcertSource.indexOf('date:'),
  )
  assert.equal((actionsBlock.match(/label:/g) ?? []).length, 3)
  assert.match(actionsBlock, /공연 상세 보기/)
  assert.match(actionsBlock, /전체 공연 일정/)
  assert.match(actionsBlock, /공지사항/)
})

test('15 Concert details are collapsed by default with accessible disclosure state', () => {
  assert.match(notesSource, /useState\(false\)/)
  assert.match(notesSource, /aria-expanded=\{isOpen\}/)
  assert.match(notesSource, /aria-controls=\{NOTE_CONTENT_ID\}/)
  assert.match(notesSource, /id=\{NOTE_CONTENT_ID\}/)
})

test('16 Concert disclosure remains a native keyboard-operable button', () => {
  assert.match(notesSource, /<button/)
  assert.match(notesSource, /type="button"/)
  assert.doesNotMatch(notesSource, /onKeyDown|role="button"/)
})

test('17 Concert poster failure degrades to a typographic cover', () => {
  assert.match(programmeSource, /onError=\{\(\) => setPosterFailed\(true\)\}/)
  assert.match(programmeSource, /data-cover-type=\{showPoster \? 'poster' : 'typographic'\}/)
  assert.match(programmeSource, /role="img"/)
})

test('18 Concert supports explicit no-poster and no-notice fixtures', () => {
  assert.match(fixtureSource, /homeV4ConcertNoPosterFixture/)
  assert.match(fixtureSource, /posterUrl: undefined/)
  assert.match(fixtureSource, /homeV4ConcertNoNoticeFixture/)
  assert.match(fixtureSource, /notice: undefined/)
  assert.match(concertSource, /fixture\.notice \? \(/)
})

test('19 Concert empty state preserves exact copy and two recovery links', () => {
  assert.match(emptyConcertSource, /새로운 무대를 준비하고 있습니다\./)
  assert.match(
    emptyConcertSource,
    /새로운 공연 일정이 확정되면 이곳에서 안내합니다\./,
  )
  assert.equal((emptyConcertSource.match(/label:/g) ?? []).length, 2)
})

test('20 Concert reduced motion disables disclosure interpolation', () => {
  assert.match(notesSource, /data-reduced-motion=/)
  assert.match(cssSource, /home-v4-concert-notes\[data-reduced-motion='true'\]/)
  assert.match(cssSource, /transition-duration:\s*0ms/)
})

test('21 the forbidden old Joining Score phrase is absent', () => {
  assert.doesNotMatch(implementationSources, /THE JOINING SCORE/)
})

test('22 live data remains disabled and fixture-backed', () => {
  assert.match(pageSource, /data-data-source="fixture"/)
  assert.match(pageSource, /Live Read-Only/)
  assert.match(pageSource, /disabled/)
  assert.doesNotMatch(implementationSources, /fetch\(|supabase/i)
})

test('23 every class selector line is rooted in the exact Home V4 namespace', () => {
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

test('24 stylesheet rejects global and persistent performance hazards', () => {
  assert.doesNotMatch(cssSource, /!important|transition:\s*all|will-change/)
  assert.doesNotMatch(cssSource, /:root|@font-face|\.color-sample-theme/)
  assert.doesNotMatch(cssSource, /(^|\s)(html|body)\b[^{]*\{/m)
  assert.doesNotMatch(cssSource, /:has\(/)
})

test('25 any local keyframes use the allowed Phase 2B-2 prefixes', () => {
  const names = [...cssSource.matchAll(/@keyframes\s+([-\w]+)/g)].map(
    (match) => match[1],
  )

  for (const name of names) {
    assert.match(name, /^home-v4-sample-(?:join|concert)-/)
  }
})

test('26 Join and Concert expose landmark headings and named link groups', () => {
  assert.match(joinSource, /aria-labelledby="home-v4-join-title"/)
  assert.match(joinSource, /aria-label="입단 안내 바로가기"/)
  assert.match(concertSource, /aria-labelledby="home-v4-concert-section-title"/)
  assert.match(concertSource, /aria-label="공연 바로가기"/)
})

test('27 long-copy and mobile rules reject text clipping and undersized text', () => {
  assert.doesNotMatch(cssSource, /white-space:\s*nowrap/)
  assert.doesNotMatch(cssSource, /line-clamp|text-overflow:\s*ellipsis/)
  assert.doesNotMatch(cssSource, /font-size:\s*(?:[0-9]|10|11)px/)
})

test('28 mobile five-step layout gives the final step the full row', () => {
  assert.match(
    cssSource,
    /home-v4-join__steps\[data-step-count='5'\][\s\S]*home-v4-join__step:last-child[\s\S]*grid-column:\s*1\s*\/\s*-1/,
  )
})

test('29 scenario changes remount Programme Notes to the default closed state', () => {
  assert.match(
    concertSource,
    /key=\{`\$\{fixture\.status\}-\$\{fixture\.title\}-\$\{reducedMotion \? 'reduced' : 'motion'\}`\}/,
  )
})
