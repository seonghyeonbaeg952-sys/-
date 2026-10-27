import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Spirit uses a scalable SMY vector while keeping raster social fallbacks', async () => {
  const [componentSource, brandSource, indexSource, svgSource, seoSource] =
    await Promise.all([
      read('../components/spirit/SpiritHeritageExperience.tsx'),
      read('../constants/brand.ts'),
      read('../../index.html'),
      read('../../public/images/brand/smyc-symbol-vector.svg'),
      read('../components/common/SeoHead.tsx'),
    ])

  assert.match(componentSource, /src="\/images\/brand\/smyc-symbol-vector\.svg"/)
  assert.match(brandSource, /symbolTransparentPath: '\/images\/brand\/smyc-symbol-vector\.svg'/)
  assert.match(indexSource, /type="image\/svg\+xml" href="\/images\/brand\/smyc-symbol-vector\.svg"/)
  assert.match(indexSource, /rel="apple-touch-icon" href="\/images\/brand\/smyc-symbol-transparent-hd\.png"/)
  assert.match(seoSource, /smyc-symbol-transparent-hd\.png/)
  assert.match(svgSource, /viewBox="0 0 111 122"/)
  assert.match(svgSource, /<path\b/)
  assert.doesNotMatch(svgSource, /<image\b/)

  const sCurve = svgSource.slice(svgSource.indexOf('M 17.111 74.560'))
  assert.ok((sCurve.match(/\sC\s/g) ?? []).length >= 8)
  assert.doesNotMatch(sCurve, /\sL\s/)
})

test('Spirit closing typography fits phone width', async () => {
  const cssSource = await read('./spirit-heritage.css')
  assert.match(
    cssSource,
    /@media \(max-width: 479px\) \{[\s\S]*\.spirit-heritage__one-voice \{[\s\S]*font-size: 57px;/,
  )
})

test('Spirit closing ornaments and baselines follow the Figma CTA geometry', async () => {
  const cssSource = await read('./spirit-heritage.css')

  assert.match(
    cssSource,
    /\.spirit-heritage__closing-copy > p:not\(\.spirit-heritage__eyebrow\)/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__closing-card::before\s*\{[\s\S]*width:\s*164px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__closing-card::after\s*\{[\s\S]*height:\s*76px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__one-voice\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*175px;[\s\S]*left:\s*759px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__one-voice::before\s*\{[\s\S]*width:\s*390px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__one-voice::after\s*\{[\s\S]*width:\s*82px;/,
  )
  assert.match(
    cssSource,
    /@media \(max-width: 899px\) \{[\s\S]*\.spirit-heritage__closing-glow\s*\{[\s\S]*display:\s*none;/,
  )
  assert.match(
    cssSource,
    /@media \(max-width: 479px\) \{[\s\S]*\.spirit-heritage__one-voice\s*\{[\s\S]*top:\s*409px;[\s\S]*left:\s*21px;/,
  )
})

test('desktop Spirit retains the opening and lineage composition', async () => {
  const cssSource = await read('./spirit-heritage.css')

  assert.match(
    cssSource,
    /\.spirit-heritage__display-title\s*\{[\s\S]*top:\s*112px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__origin-card::before\s*\{[\s\S]*width:\s*96px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__lineage-title > p\s*\{[\s\S]*font-size:\s*39px;[\s\S]*line-height:\s*50px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__lineage-title h2\s*\{[\s\S]*margin-top:\s*0;[\s\S]*font-size:\s*60px;[\s\S]*line-height:\s*68px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__lineage-title h2 span\s*\{[\s\S]*padding-left:\s*60px;[\s\S]*font-size:\s*68px;[\s\S]*line-height:\s*68px;/,
  )
})

// The retired manifesto, values, faith and education sections no longer have
// geometry contracts. The rendered four-section and community-copy contracts
// live in siteCopyAboutCatalog.test.mjs.

test('Spirit hash navigation bypasses global smooth scrolling for its final alignment', async () => {
  const componentSource = await read('../components/spirit/SpiritHeritageExperience.tsx')

  assert.match(
    componentSource,
    /root\.style\.setProperty\('scroll-behavior', 'auto', 'important'\)/,
  )
  assert.match(componentSource, /root\.style\.removeProperty\('scroll-behavior'\)/)
})
