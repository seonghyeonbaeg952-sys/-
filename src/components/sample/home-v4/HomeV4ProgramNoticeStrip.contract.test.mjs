import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [stripSource, previewSource, cssSource] = await Promise.all([
  read('./HomeV4ProgramNoticeStrip.tsx'),
  read('../../home/PerformanceNewsPreview.tsx'),
  read('./HomeV4PerformanceCarousel.css'),
])

test('V4 프로그램 노트는 CMS 공지를 최대 세 칸으로만 표시한다', () => {
  assert.match(stripSource, /notices\.slice\(0, 3\)/)
  assert.match(stripSource, /Array\.from\(\{ length: 3 \}/)
  assert.match(stripSource, /notice\.title/)
  assert.match(stripSource, /notice\.created_at/)
  assert.doesNotMatch(stripSource, /제1회 정기연주회|제12회 정기연주회|시안4/)
})

test('V4 공연 섹션은 일반 공지 카드 대신 전용 정적 패널을 사용한다', () => {
  assert.match(previewSource, /<HomeV4ProgramNoticeStrip/)
  assert.doesNotMatch(previewSource, /presentation="v4-static-strip"/)
  assert.match(stripSource, /className="home-v4-program-note"/)
  assert.doesNotMatch(stripSource, /Reveal|card-rise/)
  assert.match(stripSource, /className="home-v4-program-note-datum"/)
  assert.match(stripSource, /ARCHITECTURAL PAPER DATUM/)
  assert.match(stripSource, /viewBox="0 0 1200 64"/)
  assert.match(stripSource, /M0 20 H558 L600 54 L642 20 H1200/)
})

test('V4 프로그램 노트는 Figma 데스크톱 기하를 유지한다', () => {
  assert.match(
    cssSource,
    /home-v4-performance-notice-wrap \{[\s\S]*width: min\(calc\(100% - clamp\(8rem, 15vw, 16rem\)\), 78rem\);/,
  )
  assert.match(
    cssSource,
    /home-section--v4-performance\[data-performance-presentation='figma-template-carousel'\] \{[\s\S]*--v4-performance-ink: #3d0b2f;[\s\S]*--v4-performance-orange: #fa4a12;[\s\S]*--v4-program-note-heading:[\s\S]*--v4-program-note-sans:/,
  )
  assert.match(
    cssSource,
    /\.home-v4-program-note \{[\s\S]*font-family: var\(--v4-program-note-sans\);/,
  )
  assert.match(cssSource, /\.home-v4-program-note \{[\s\S]*min-height: 9\.625rem;/)
  assert.match(cssSource, /grid-template-columns: minmax\(16\.5rem, 20%\) minmax\(0, 1fr\);/)
  assert.match(cssSource, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/)
  assert.match(cssSource, /border: 1px solid rgb\(246 76 14 \/ 22%\);/)
})

test('V4 performance uses the original static section below desktop width', () => {
  assert.match(previewSource, /const desktopPerformanceQuery = '\(min-width: 1024px\)'/)
  assert.match(previewSource, /useFigmaDesktopLayout/)
  assert.match(previewSource, /useOriginalResponsiveLayout/)
  assert.match(previewSource, /home-section--v4-mobile-original/)
  assert.match(previewSource, /useOriginalResponsiveLayout \? 'none' : 'card-rise'/)
  assert.match(
    cssSource,
    /@media \(max-width: 1023px\) \{[\s\S]*home-section--v4-mobile-original[\s\S]*animation: none !important;/,
  )
  assert.match(
    cssSource,
    /home-section--v4-mobile-original[\s\S]*kinetic-headline__line[\s\S]*overflow: visible;/,
  )
  assert.match(
    cssSource,
    /kinetic-headline__line[\s\S]*> span \{[\s\S]*transform: none !important;/,
  )
})

test('V4 performance and program note share the Home V4 Korean font tokens', () => {
  assert.match(cssSource, /--v4-program-note-heading: var\(--home-v4-heading\);/)
  assert.match(cssSource, /--v4-program-note-sans: var\(--home-v4-sans\);/)
  assert.match(
    cssSource,
    /home-v4-performance-carousel__copy > h2 \{[\s\S]*--home-v4-heading/,
  )
})

test('V4 desktop covers only the performance section with the optimized paper background', () => {
  assert.match(
    cssSource,
    /home-section--v4-performance\[data-performance-presentation='figma-template-carousel'\] \{[\s\S]*performance-section-paper\.webp[\s\S]*center \/ cover no-repeat !important;/,
  )
  assert.match(
    cssSource,
    /@media \(min-width: 1024px\) \{[\s\S]*home-flow-sample-chunk--stage[\s\S]*home-flow-sample-chunk__surface \{[\s\S]*background: #fbf8f2 !important;/,
  )
  assert.doesNotMatch(
    cssSource,
    /home-flow-sample-chunk__surface \{[\s\S]{0,240}performance-section-paper\.webp/,
  )
  assert.match(
    cssSource,
    /home-v4-performance-carousel \{[\s\S]*background: transparent;[\s\S]*box-shadow: none;/,
  )
  assert.match(
    cssSource,
    /home-v4-performance-carousel__stage \{[\s\S]*background: transparent;/,
  )
  assert.match(
    cssSource,
    /color-sample-theme\.public-shell-home\.public-shell-home-sample-v4[\s\S]*home-section--v4-performance/,
  )
})

test('V4 desktop performance removes the inherited gold stripe overlays', () => {
  assert.match(
    cssSource,
    /home-section--v4-performance\[data-performance-presentation='figma-template-carousel'\]::before,[\s\S]*home-section--v4-performance\[data-performance-presentation='figma-template-carousel'\]::after \{[\s\S]*background: none !important;[\s\S]*opacity: 0 !important;/,
  )
})
