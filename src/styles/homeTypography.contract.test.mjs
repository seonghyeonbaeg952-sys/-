import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('the public home self-hosts its Korean display faces and assigns each a clear role', async () => {
  const [globalsSource, homeSource, indexSource] = await Promise.all([
    read('./globals.css'),
    read('../pages/sample/HomeV4SamplePage.css'),
    read('../../index.html'),
  ])

  assert.match(
    globalsSource,
    /@font-face\s*\{[\s\S]*font-family:\s*"Hahmlet";[\s\S]*Hahmlet-Variable\.woff2[\s\S]*font-weight:\s*100 900;[\s\S]*font-display:\s*swap;/,
  )
  assert.match(
    globalsSource,
    /--font-heading-kr:\s*\r?\n\s*"Hahmlet",\s*"AritaBuri"/,
  )
  assert.match(
    globalsSource,
    /@font-face\s*\{[\s\S]*font-family:\s*"Grandiflora One";[\s\S]*GrandifloraOne-Regular\.woff2[\s\S]*font-display:\s*swap;/,
  )
  assert.match(
    globalsSource,
    /@font-face\s*\{[\s\S]*font-family:\s*"Gowun Batang";[\s\S]*GowunBatang-Bold\.woff2[\s\S]*font-weight:\s*700;[\s\S]*font-display:\s*swap;/,
  )
  assert.match(globalsSource, /--font-lyric-kr:[\s\S]*"Gowun Batang"/)
  assert.match(globalsSource, /--font-ornament-kr:[\s\S]*"Grandiflora One"/)
  assert.match(
    homeSource,
    /--home-v4-heading:\s*\r?\n\s*Hahmlet,\s*AritaBuri/,
  )
  assert.doesNotMatch(homeSource, /@import\s+url\([^)]*fonts\.googleapis\.com/)
  assert.match(homeSource, /\.home-type-accent--emphasis[\s\S]*var\(--font-lyric-kr\)/)
  assert.match(homeSource, /\.home-type-accent--quiet[\s\S]*font-weight:\s*300/)
  assert.match(homeSource, /\.home-type-accent--ornament[\s\S]*var\(--font-ornament-kr\)/)
  assert.doesNotMatch(indexSource, /family=(?:Hahmlet|Grandiflora\+One)/)
})

test('the about and join sections use one Hahmlet family for their Korean copy', async () => {
  const homeSource = await read('../pages/sample/HomeV4SamplePage.css')

  assert.match(
    homeSource,
    /--home-v4-korean-section-font:\s*var\(--home-v4-heading\);/,
  )

  const koreanCopySelectors = [
    '.home-about-portrait #home-about-portrait-title',
    '.home-about-portrait #home-about-portrait-title *',
    '.home-about-portrait__copy',
    '.home-about-portrait__copy p',
    '.home-about-portrait__cta a',
    '.home-about-portrait .home-section-staff-cue__label',
    '.join-open-score__mobile-rail-label',
    '.join-open-score .home-section-staff-cue__label',
    '.join-open-score__title',
    '.join-open-score__title *',
    '.join-open-score__description',
    '.join-open-score .join-open-score__cta',
    '.join-open-score__fact dt',
    '.join-open-score__fact dd',
    '.join-open-score__process-heading h3',
    '.join-open-score__step h4',
    '.join-open-score__step p',
    '.join-open-score__guardian li',
  ]

  koreanCopySelectors.forEach((selector) => {
    assert.match(homeSource, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  assert.match(
    homeSource,
    /font-family:\s*var\(--home-v4-korean-section-font\);/,
  )
})
