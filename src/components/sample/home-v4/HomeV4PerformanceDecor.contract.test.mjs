import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [carouselSource, previewSource, cssSource] = await Promise.all([
  read('./HomeV4PerformanceCarousel.tsx'),
  read('../../home/PerformanceNewsPreview.tsx'),
  read('./HomeV4PerformanceCarousel.css'),
])

test('건축 프레임은 Figma의 네 깊이선과 좌우 캡 선을 모두 렌더링한다', () => {
  for (const position of [
    'left-outer',
    'left-inner',
    'right-inner',
    'right-outer',
  ]) {
    assert.match(
      carouselSource,
      new RegExp(`home-v4-architecture__depth--${position}`),
    )
  }

  assert.match(carouselSource, /home-v4-architecture__pocket--left/)
  assert.match(carouselSource, /home-v4-architecture__pocket--right/)
})

test('건물 외곽은 소개 사진과 같은 간결한 설계선 장식을 사용한다', () => {
  assert.match(carouselSource, /<ArchitectureBlueprintFrame \/>/)
  assert.match(
    cssSource,
    /@media \(min-width: 1024px\) \{[\s\S]*home-v4-architecture__blueprint-frame \{[\s\S]*z-index: 4;[\s\S]*inset: 1\.65%;[\s\S]*pointer-events: none;/,
  )
  assert.match(
    cssSource,
    /home-v4-architecture__blueprint-frame::before,[\s\S]*home-v4-architecture__blueprint-frame::after \{[\s\S]*repeating-linear-gradient/,
  )
  for (const corner of [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]) {
    assert.match(carouselSource, new RegExp(`data-corner="${corner}"`))
  }
})

test('V4 공연 섹션은 기존 오선지에 공통 음표 표식을 사용한다', () => {
  assert.match(previewSource, /className="home-section-staff-cue--concert"/)
  assert.match(previewSource, /label="공연"/)
  assert.match(previewSource, /symbol="♪"/)
  assert.doesNotMatch(previewSource, /home-v4-performance-datum/)
  assert.doesNotMatch(carouselSource, />PERFORMANCE<\/p>/)
  assert.match(
    cssSource,
    /home-v4-performance-carousel__rail \{[\s\S]*left: clamp\(1\.25rem, 1\.72vw, 1\.55rem\);[\s\S]*width: 1\.8px;[\s\S]*background: #f4b89f;/,
  )
})

test('공연 음표 표식은 Figma의 주황색 장식 톤을 사용한다', () => {
  assert.match(
    cssSource,
    /home-section--v4-performance[\s\S]*home-section-staff-cue--concert \{[\s\S]*left: max\(4\.25rem, calc\(50vw - 40\.75rem\)\) !important;[\s\S]*top: 8\.875rem;[\s\S]*color: #d84b17 !important;/,
  )
  assert.match(
    cssSource,
    /home-section--v4-performance[\s\S]*home-section-staff-cue__note \{[\s\S]*font-size: 0\.75rem;[\s\S]*transform: none !important;/,
  )
  assert.match(
    cssSource,
    /home-section--v4-performance[\s\S]*home-section-staff-cue__label \{[\s\S]*left: 1\.125rem;[\s\S]*font-family: 'Gothic A1', sans-serif;[\s\S]*font-size: 0\.75rem;/,
  )
})

test('performance cards use the building center mask instead of a timed z-index jump', () => {
  assert.match(
    cssSource,
    /home-v4-architecture__track \{[\s\S]*z-index: auto;/,
  )
  assert.match(
    cssSource,
    /home-v4-template-face--center \{[\s\S]*z-index: 3;/,
  )
  assert.match(
    cssSource,
    /home-v4-architecture__depth-layer \{[\s\S]*z-index: 2;/,
  )
  assert.match(
    cssSource,
    /home-v4-template-face--left,[\s\S]*home-v4-template-face--right \{[\s\S]*top: 27\.39%;[\s\S]*z-index: 3;/,
  )
  assert.match(
    cssSource,
    /home-v4-architecture__foreground \{[\s\S]*z-index: 4;/,
  )
  assert.doesNotMatch(cssSource, /z-index 0s linear/)
  assert.match(carouselSource, /<ArchitectureDepthLayer \/>/)
})

test('the non-participating card repositions behind the architecture instead of crossing the stage', () => {
  assert.match(carouselSource, /const CAROUSEL_TRANSITION_MS = 660/)
  assert.match(carouselSource, /const bypassIndex =/)
  assert.match(
    carouselSource,
    /isRepositioning=\{index === repositioningIndex\}/,
  )
  assert.match(
    carouselSource,
    /programBookState !== 'front' \|\| isCarouselTransitioning/,
  )
  assert.match(
    cssSource,
    /home-v4-template-face--repositioning \{[\s\S]*z-index: 0 !important;[\s\S]*opacity: 0 !important;[\s\S]*transition: none !important;/,
  )
})
