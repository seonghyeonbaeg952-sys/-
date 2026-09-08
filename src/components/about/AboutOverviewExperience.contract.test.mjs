import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../../../', import.meta.url)

async function source(relativePath) {
  return readFile(new URL(relativePath, root), 'utf8')
}

test('the public about route uses the merged editorial experience', async () => {
  const page = await source('src/pages/public/AboutPage.tsx')

  assert.match(page, /import \{ AboutOverviewExperience \}/)
  assert.match(page, /<AboutOverviewExperience/)
  assert.doesNotMatch(page, /<SpiritEducationSection/)
  assert.match(
    page,
    /shouldShowOverview \|\|\s*shouldShowDedicatedConductor \|\|\s*shouldShowDedicatedAccompanists \|\|\s*shouldShowDedicatedMembers \|\|\s*shouldShowDedicatedHistory \? null : \(/,
  )
  assert.match(page, /<AboutSectionSelector activeSection=\{activeSection\}/)
  assert.doesNotMatch(
    page,
    /shouldShowOverview \? null : \(\s*<div className="about-overview-nav">/,
  )
})

test('the About section selector keeps its accent inside the rounded top border', async () => {
  const page = await source('src/pages/public/AboutPage.tsx')
  const css = await source('src/styles/about-overview.css')
  const globals = await source('src/styles/globals.css')

  assert.match(page, /about-section-selector__accent/)
  assert.match(
    css,
    /\.about-section-selector__accent\s*\{[^}]*inset-inline:\s*16px;[^}]*top:\s*1px;/s,
  )
  assert.match(
    globals,
    /\.animated-section-tabs\s*\{[^}]*padding-block:\s*2px;/s,
  )
})

test('the experience contains concrete introduction, spirit, and education sections', async () => {
  const component = await source('src/components/about/AboutOverviewExperience.tsx')

  for (const id of ['overview', 'founding', 'spirit', 'education']) {
    assert.match(component, new RegExp(`id=["']${id}["']`))
  }

  for (const copy of [
    '청소년의 목소리로',
    '세상과 이웃을',
    '합창음악의 위대한 힘으로',
    '음악의 참된 의미와 가치를 배웁니다.',
    '잘 부르는 기술보다',
    '함께 듣는 태도를.',
    '정기연주회',
    '해외 비전투어',
  ]) {
    assert.ok(component.includes(copy), `missing concrete copy: ${copy}`)
  }

  assert.doesNotMatch(component, /정직한 음악/)
  assert.doesNotMatch(component, /정신과 교육철학/)
})

test('the experience uses optimized local photographs and a scroll-linked learning journey', async () => {
  const component = await source('src/components/about/AboutOverviewExperience.tsx')

  for (const asset of [
    '/images/about/smyc-europe-2018.webp',
    '/images/about/smyc-first-concert.webp',
    '/images/about/smyc-rehearsal.webp',
    '/images/about/learning-journey-curve.svg',
  ]) {
    assert.ok(component.includes(asset), `missing local asset reference: ${asset}`)
    await access(new URL(`public${asset}`, root))
  }

  assert.match(component, /useScroll\(/)
  assert.match(component, /about-overview__journey-progress/)
  assert.match(component, /prefersReducedMotion/)
})

test('the spirit values are real interactive controls instead of a fixed visual state', async () => {
  const component = await source('src/components/about/AboutOverviewExperience.tsx')

  assert.match(component, /useState\(0\)/)
  assert.match(component, /aria-pressed=\{isActive\}/)
  assert.match(component, /onClick=\{\(\) => setActiveSpiritIndex\(index\)\}/)
  assert.match(component, /onKeyDown=\{\(event\) => handleSpiritKeyDown\(event, index\)\}/)
  assert.doesNotMatch(component, /className=\{index === 2 \? 'is-active'/)
})

test('responsive styling protects typography, touch targets, and reduced motion', async () => {
  const css = await source('src/styles/about-overview.css')

  assert.match(css, /#fcfaf5/i)
  assert.match(css, /#17191d/i)
  assert.match(css, /#f04b23/i)
  assert.match(css, /#68233a/i)
  assert.match(css, /@media \(max-width: 767px\)/)
  assert.match(css, /@media \(min-width: 768px\) and \(max-width: 1099px\)/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /min-height:\s*44px/)
  assert.match(css, /text-wrap:\s*balance/)
  assert.match(css, /about-overview__spirit-values button/)
  assert.doesNotMatch(css, /about-overview__spirit-values article/)
})
