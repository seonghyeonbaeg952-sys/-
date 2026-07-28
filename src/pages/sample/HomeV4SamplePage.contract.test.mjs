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
  scenarioSource,
  typeSource,
  headerSource,
  megaMenuSource,
  mobileMenuSource,
  quickSource,
  aboutSource,
  programSource,
] = await Promise.all([
  read('./HomeV4SamplePage.tsx'),
  read('./HomeV4SamplePage.css'),
  read('../../App.tsx'),
  read('./home-v4/homeV4SampleFixtures.ts'),
  read('./home-v4/homeV4SampleScenario.ts'),
  read('./home-v4/homeV4SampleTypes.ts'),
  read('../../components/sample/home-v4/HomeV4SampleHeader.tsx'),
  read('../../components/sample/home-v4/HomeV4SampleMegaMenu.tsx'),
  read('../../components/sample/home-v4/HomeV4SampleMobileMenu.tsx'),
  read('../../components/sample/home-v4/HomeV4QuickActions.tsx'),
  read('../../components/sample/home-v4/HomeV4AboutIdentity.tsx'),
  read('../../components/sample/home-v4/HomeV4ChoirProgram.tsx'),
])

const sampleSources = [
  pageSource,
  fixtureSource,
  scenarioSource,
  typeSource,
  headerSource,
  megaMenuSource,
  mobileMenuSource,
  quickSource,
  aboutSource,
  programSource,
].join('\n')

const normalFixtureSource = fixtureSource.slice(
  fixtureSource.indexOf('const normalFixture'),
  fixtureSource.indexOf('const longCopyFixture'),
)
const longCopyFixtureSource = fixtureSource.slice(
  fixtureSource.indexOf('const longCopyFixture'),
  fixtureSource.indexOf('const emptyDataFixture'),
)
const emptyFixtureSource = fixtureSource.slice(
  fixtureSource.indexOf('const emptyDataFixture'),
)

test('01 registers only the existing isolated sample route', () => {
  assert.match(appSource, /isColorSample \? \([\s\S]*path="home-v4"/)
  assert.match(appSource, /import\('\.\/pages\/sample\/HomeV4SamplePage'\)/)
  assert.doesNotMatch(pageSource, /PublicLayout/)
})

test('02 avoids production component, publicData, Supabase, and HomeContent imports', () => {
  assert.doesNotMatch(
    sampleSources,
    /from ['"][^'"]*(?:components\/(?:layout|home|join|spirit|contact)|publicData|supabase|HomeContent)[^'"]*['"]/i,
  )
})

test('03 imports only the dedicated isolated sample stylesheets', () => {
  assert.match(pageSource, /import '\.\/HomeV4SamplePage\.css'/)
  assert.match(pageSource, /import '\.\/HomeV4JoinConcert\.css'/)
  assert.match(pageSource, /import '\.\/HomeV4SignatureScenes\.css'/)
  assert.doesNotMatch(pageSource, /globals\.css|color-sample-theme\.css/)
})

test('04 keeps the exact isolated root namespace', () => {
  assert.match(pageSource, /className="public-shell-home-sample-v4"/)
  assert.match(pageSource, /data-design-candidate="home-v4"/)
  assert.match(
    cssSource,
    /^\.public-shell-home-sample-v4\[data-design-candidate='home-v4'\] \{/,
  )
})

test('05 keeps the Hero locked with Phase 2B-1 copy', () => {
  assert.match(pageSource, /HERO · LOCKED PRODUCTION REFERENCE/)
  assert.match(pageSource, /Not implemented in Phase 2B-1/)
  assert.match(pageSource, /No Hero source or style changes/)
})

test('06 normal fixture exposes exactly three Quick Actions', () => {
  const quickBlock = normalFixtureSource.slice(
    normalFixtureSource.indexOf('quickActions:'),
    normalFixtureSource.indexOf('about:'),
  )
  assert.equal((quickBlock.match(/code:/g) ?? []).length, 3)
})

test('07 empty fixture hides one Quick Action so two reflow', () => {
  assert.match(emptyFixtureSource, /action\.code !== 'SCHEDULE'/)
  assert.match(quickSource, /data-visible-count=\{visibleActions\.length\}/)
})

test('08 normal About has one approved local public image reference', () => {
  assert.match(normalFixtureSource, /imageUrl: '\/images\/hero\/hero-01\.svg'/)
  assert.match(aboutSource, /hasImage \? \(/)
})

test('09 empty About removes the visual instead of rendering a blank box', () => {
  assert.match(emptyFixtureSource, /imageUrl: undefined/)
  assert.match(emptyFixtureSource, /imageAlt: undefined/)
  assert.doesNotMatch(aboutSource, /No data|데이터 없음/)
})

test('10 About facts are four normally and three in empty data', () => {
  const aboutBlock = normalFixtureSource.slice(
    normalFixtureSource.indexOf('about:'),
    normalFixtureSource.indexOf('programItems:'),
  )
  assert.equal((aboutBlock.match(/label: '(?:FOUNDED|BASE|FOCUS|STAGE)'/g) ?? []).length, 4)
  assert.match(emptyFixtureSource, /fact\.label !== 'STAGE'/)
})

test('11 Program has four normal items and three empty-data items', () => {
  const programBlock = normalFixtureSource.slice(
    normalFixtureSource.indexOf('programItems:'),
  )
  assert.equal((programBlock.match(/number: '0[1-4]'/g) ?? []).length, 4)
  assert.match(emptyFixtureSource, /item\.number !== '03'/)
})

test('12 Candidate B uses title and description without subtitle expansion', () => {
  assert.match(typeSource, /HomeV4ProgramItemFixture/)
  assert.doesNotMatch(typeSource, /subtitle/)
  assert.doesNotMatch(programSource, /subtitle/)
})

test('13 long-copy fixtures preserve natural content expansion', () => {
  assert.match(
    longCopyFixtureSource,
    /입단 준비와 보호자 안내 확인/,
  )
  assert.match(
    longCopyFixtureSource,
    /정직한 음악과 함께 부르는 공동체를 다음 세대의 무대로/,
  )
  assert.doesNotMatch(cssSource, /line-clamp|text-overflow:\s*ellipsis/)
})

test('14 reduced-motion scenario uses normal fixture data', () => {
  assert.match(scenarioSource, /return homeV4SampleFixtures\.normal/)
  assert.match(cssSource, /data-scenario='reduced-motion'/)
  assert.match(cssSource, /prefers-reduced-motion:\s*reduce/)
})

test('15 live data remains disabled and the active source remains fixture', () => {
  assert.match(pageSource, /data-data-source="fixture"/)
  assert.match(pageSource, /Live Read-Only/)
  assert.match(pageSource, /aria-describedby="home-v4-live-disabled"[\s\S]*disabled/)
})

test('16 noindex is installed and restores or removes prior state on cleanup', () => {
  assert.match(pageSource, /robotsMeta\.content = 'noindex,nofollow'/)
  assert.match(pageSource, /robotsMeta\.remove\(\)/)
  assert.match(pageSource, /robotsMeta\.content = previousContent/)
})

test('17 CSS rejects global and production override patterns', () => {
  assert.doesNotMatch(cssSource, /!important/)
  assert.doesNotMatch(cssSource, /:root|@font-face|\.color-sample-theme/)
  assert.doesNotMatch(cssSource, /(^|\s)(html|body)\b[^{]*\{/m)
  assert.doesNotMatch(cssSource, /transition:\s*all|will-change|position:\s*sticky/)
})

test('18 every class selector is rooted in the Home V4 namespace', () => {
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

test('19 motion budget excludes scale, glow, blur, scroll pin, and continuous motion', () => {
  assert.doesNotMatch(cssSource, /scale\(|blur\(|filter:|backdrop-filter|scroll-timeline/)
  assert.match(cssSource, /translateY\(-3px\)/)
  assert.match(cssSource, /home-v4-sample-menu-in/)
})

test('20 Header controls expose expanded state, named regions, and real links', () => {
  assert.match(headerSource, /aria-expanded=\{desktopMenuOpen\}/)
  assert.match(headerSource, /aria-expanded=\{mobileMenuOpen\}/)
  assert.match(megaMenuSource, /role="region"/)
  assert.match(headerSource, /href="\/join"/)
})

test('21 mobile menu locks body scroll and restores the previous value', () => {
  assert.match(headerSource, /previousBodyOverflowRef\.current = document\.body\.style\.overflow/)
  assert.match(headerSource, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(
    headerSource,
    /document\.body\.style\.overflow = previousBodyOverflowRef\.current \?\? ''/,
  )
  assert.match(headerSource, /event\.key !== 'Escape'/)
})

test('22 Phase 2B-3 composes Score, Spirit, and Archive after frozen Concert', () => {
  const programIndex = pageSource.indexOf('<HomeV4ChoirProgram')
  const joinIndex = pageSource.indexOf('<HomeV4JoinSection')
  const concertIndex = pageSource.indexOf('<HomeV4ConcertSection')
  const scoreIndex = pageSource.indexOf('<HomeV4MotetScoreSection')
  const spiritIndex = pageSource.indexOf('<HomeV4SpiritSection')
  const archiveIndex = pageSource.indexOf('<HomeV4ArchiveSection')
  const pendingListIndex = pageSource.indexOf(
    '<div className="home-v4-pending-list">',
  )

  assert.ok(programIndex < joinIndex)
  assert.ok(joinIndex < concertIndex)
  assert.ok(concertIndex < scoreIndex)
  assert.ok(scoreIndex < spiritIndex)
  assert.ok(spiritIndex < archiveIndex)
  assert.ok(archiveIndex < pendingListIndex)

  const requiredNames = ['Sponsors', 'Support']
  let previousIndex = -1

  for (const name of requiredNames) {
    const index = pageSource.indexOf(`name: '${name}'`)
    assert.ok(index > previousIndex, `${name} should follow the prior placeholder`)
    previousIndex = index
  }

  assert.doesNotMatch(
    pageSource,
    /name: 'Join'|name: 'Concert'|name: 'MOTET SCORE'|name: 'Spirit'|name: 'Archive'/,
  )
  assert.match(pageSource, /PENDING · PHASE 2A PLACEHOLDER/)
})
