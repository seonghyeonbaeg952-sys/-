import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [componentSource, cssSource, scoreBookSource, v4Source, homeContentSource] =
  await Promise.all([
    read('./HomeSpiritChorusOrbit.tsx'),
    read('../../styles/home-spirit-chorus-orbit.css'),
    read('./HomeSpiritScoreBook.tsx'),
    read('../../pages/sample/HomeV4SamplePage.tsx'),
    read('../../constants/homeContentV2.ts'),
  ])

test('V4 정신 섹션은 기존 전역 오선지 레일을 중복 생성하지 않는다', () => {
  assert.match(componentSource, /<HomeSectionStaffCue/)
  assert.doesNotMatch(componentSource, /StaffFlowRail/)
  assert.doesNotMatch(componentSource, /score-flow-rail/)
})

test('V4에서만 chorus orbit 프레젠테이션을 선택한다', () => {
  assert.match(scoreBookSource, /'chorus-orbit'/)
  assert.match(v4Source, /spiritPresentation="chorus-orbit"/)
})

test('데스크톱 정신 섹션은 CMS 교체 가능한 고화질 배경 영상을 안전하게 재생한다', () => {
  assert.match(componentSource, /wrapper\.backgroundVideoUrl/)
  assert.match(componentSource, /wrapper\.backgroundPosterUrl/)
  assert.match(componentSource, /preload="metadata"/)
  assert.match(componentSource, /disablePictureInPicture/)
  assert.match(componentSource, /loop/)
  assert.match(componentSource, /muted/)
  assert.match(componentSource, /playsInline/)
  assert.match(componentSource, /prefersReducedMotion/)
  assert.match(componentSource, /video\.pause\(\)/)
  assert.match(componentSource, /video\.play\(\)/)
  assert.match(cssSource, /object-fit: contain;/)
  assert.match(cssSource, /home-spirit-chorus-orbit__video-scrim/)
  assert.match(homeContentSource, /backgroundVideoUrl/)
  assert.match(homeContentSource, /backgroundPosterUrl/)
  assert.match(homeContentSource, /orbitHeadline/)
})

test('정신 데이터는 CMS 오버라이드를 유지하고 다섯 값을 렌더링한다', () => {
  assert.match(componentSource, /getAboutSectionCopy/)
  assert.match(componentSource, /home_spirit_\$\{page\.id\}/)
  assert.match(componentSource, /movementLabels = \[/)
  assert.match(componentSource, /pages\.map\(\(page, index\)/)
})

test('원형의 다섯 문구는 hover와 키보드 focus로 원래 CMS 문구를 공개한다', () => {
  assert.match(componentSource, /className="home-spirit-chorus-orbit__value-trigger"/)
  assert.match(componentSource, /onPointerEnter=\{\(\) => showHoveredPage\(index\)\}/)
  assert.match(componentSource, /onFocus=\{\(\) => setFocusedIndex\(index\)\}/)
  assert.match(componentSource, /aria-controls="home-spirit-chorus-orbit-detail"/)
  assert.match(componentSource, /aria-expanded=\{activeIndex === index\}/)
  assert.match(componentSource, /activePage\.title/)
  assert.match(componentSource, /activePage\.body/)
  assert.match(componentSource, /event\.key === 'Escape'/)
  assert.match(componentSource, /}, 160\)/)
  assert.match(cssSource, /opacity 200ms ease/)
  assert.match(cssSource, /__value-trigger:focus-visible/)
})

test('모션은 한 번 실행되는 6.2초 타임라인이며 reduced motion을 지원한다', () => {
  assert.match(cssSource, /spirit-orbit-voice-journey 6200ms/)
  assert.doesNotMatch(cssSource, /infinite/)
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(cssSource, /\.home-spirit-chorus-orbit__voice-path \{[\s\S]*display: none;/)
})

test('정신 섹션은 4:3 영상 비율과 하단 전환 여백을 유지한다', () => {
  assert.match(
    cssSource,
    /min-height: clamp\(860px, 52vw, 930px\);/,
  )
  assert.match(cssSource, /margin-bottom: clamp\(172px, 14vw, 232px\) !important;/)
  assert.match(cssSource, /padding-block: 0 !important;/)
})

test('정신 섹션 우측 하단의 개발용 모션 문구를 노출하지 않는다', () => {
  assert.doesNotMatch(componentSource, /PURPOSEFUL MOTION/)
  assert.doesNotMatch(cssSource, /home-spirit-chorus-orbit__runtime/)
})

test('short desktop browser heights preserve the CTA breathing room', () => {
  assert.match(
    cssSource,
    /@media \(max-height: 850px\) and \(min-width: 1024px\)/,
  )
  assert.match(cssSource, /--orbit-size: clamp\(380px, 28vw, 420px\);/)
  assert.match(
    cssSource,
    /@media \(max-height: 790px\) and \(min-width: 1024px\)/,
  )
  assert.match(cssSource, /--orbit-size: clamp\(370px, 26vw, 400px\);/)
})
