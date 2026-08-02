import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [samplePageSource, routeSource, flowSource, homeSource, aboutSource, cssSource] =
  await Promise.all([
    read('./HomeV4SamplePage.tsx'),
    read('../public/HomeRoute.tsx'),
    read('../public/HomeSectionFlowSamplePage.tsx'),
    read('../public/HomePage.tsx'),
    read('../../components/home/AboutPreview.tsx'),
    read('./HomeV4SamplePage.css'),
  ])

test('V4 alone selects the collective portrait presentation', () => {
  assert.match(
    samplePageSource,
    /<HomeRoute[\s\S]*aboutPresentation="collective-portrait"[\s\S]*joinOpenScorePresentation="figma-open-score"[\s\S]*\/>/,
  )
  assert.match(routeSource, /aboutPresentation = 'default'/)
  assert.match(flowSource, /aboutPresentation=\{aboutPresentation\}/)
  assert.match(homeSource, /presentation=\{aboutPresentation\}/)
})

test('collective portrait keeps one people-first visual and four thin facts', () => {
  assert.equal(
    (aboutSource.match(/className="home-about-portrait__visual"/g) ?? [])
      .length,
    1,
  )
  assert.equal(
    (
      aboutSource.match(
        /label: '(?:FOUNDED|BASE|FOCUS|STAGE)'/g,
      ) ?? []
    ).length,
    4,
  )
  assert.match(aboutSource, /ABOUT · COLLECTIVE PORTRAIT/)
  assert.match(aboutSource, /함께 빚어가는 화음,/)
  assert.match(aboutSource, /다음 세대의 노래/)
  assert.match(
    aboutSource,
    /src=\{portraitImage\.src\}/,
  )
  assert.match(homeSource, /collectivePortraitImage=\{/)
  assert.match(homeSource, /src: seoSlide\.image_url/)
  assert.match(
    aboutSource,
    /서울모테트청소년합창단은 음악과 신앙, 공동체의 가치를 통해[\s\S]*청소년의 삶을 아름답게 세워갑니다/,
  )
  assert.match(
    homeSource,
    /caption: 'HERO 01 · 서울모테트 공연 기록'/,
  )
  assert.doesNotMatch(aboutSource, /COLLECTIVE PORTRAIT → JOIN/)
  assert.match(aboutSource, /<Button href="\/about" variant="secondary">/)
  assert.match(
    cssSource,
    /max-width: min\(1312px, calc\(100% - 96px\)\) !important;/,
  )
  assert.match(
    cssSource,
    /width: min\(1160px, calc\(100% - clamp\(320px, 20vw, 400px\)\)\);/,
  )
  assert.doesNotMatch(cssSource, /\.home-about-portrait \{\s+margin-bottom: -60px;/)
  assert.match(cssSource, /aspect-ratio: 164 \/ 75;/)
  assert.match(cssSource, /\[data-flow-section='about'\] \{\s+translate: none;/)
  assert.match(
    cssSource,
    /\.home-about-portrait::before,[\s\S]*\.home-about-portrait::after \{\s+display: none !important;\s+content: none !important;/,
  )
  assert.match(cssSource, /min-height: 1350px;/)
  assert.match(cssSource, /height: 600px;/)
  assert.match(cssSource, /zoom: 1 !important;/)
  assert.match(
    cssSource,
    /\.join-open-score \{\s+min-height: 972px;\s+height: 972px;/,
  )
  assert.match(
    cssSource,
    /\.join-open-score__design-canvas \{[\s\S]*height: 1080px;[\s\S]*scale: 0\.9;/,
  )
  assert.doesNotMatch(aboutSource, /home-about-portrait__handoff/)
  assert.doesNotMatch(cssSource, /\.home-about-portrait__handoff/)
  assert.doesNotMatch(
    aboutSource.slice(
      aboutSource.indexOf('function CollectivePortrait'),
      aboutSource.indexOf('export function AboutPreview'),
    ),
    /ONE VOICE|home-about-folio|GlobalIdentityPlate/,
  )
})

test('V4 portrait preserves responsive and reduced-motion-safe behavior', () => {
  assert.match(cssSource, /\.home-about-portrait__stage \{/)
  assert.match(cssSource, /@media \(max-width: 1023px\)/)
  assert.match(cssSource, /max-width: none !important;/)
  assert.match(cssSource, /@media \(max-width: 639px\)/)
  assert.match(aboutSource, /<Reveal[\s\S]*variant="fade-up"/)
  assert.match(aboutSource, /variant="soft-scale"/)
})
