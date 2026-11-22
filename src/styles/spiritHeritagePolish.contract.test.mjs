import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Spirit uses a scalable SMY vector while keeping raster social fallbacks', async () => {
  const [componentSource, brandSource, indexSource, svgSource, seoSource, favicon, fallbackIcon] =
    await Promise.all([
      read('../components/spirit/SpiritHeritageExperience.tsx'),
      read('../constants/brand.ts'),
      read('../../index.html'),
      read('../../public/images/brand/smyc-symbol-vector.svg'),
      read('../components/common/SeoHead.tsx'),
      readFile(new URL('../../public/favicon.png', import.meta.url)),
      readFile(new URL('../../public/favicon.ico', import.meta.url)),
    ])

  assert.match(componentSource, /src="\/images\/brand\/smyc-symbol-vector\.svg"/)
  assert.match(brandSource, /symbolTransparentPath: '\/images\/brand\/smyc-symbol-vector\.svg'/)
  assert.match(indexSource, /rel="icon" type="image\/png" sizes="96x96" href="\/favicon\.png"/)
  assert.equal(favicon.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(favicon.readUInt32BE(16), 96)
  assert.equal(favicon.readUInt32BE(20), 96)
  assert.equal(fallbackIcon.readUInt16LE(2), 1)
  assert.equal(fallbackIcon.readUInt16LE(4), 4)
  assert.deepEqual([6, 22, 38, 54].map(offset => [fallbackIcon[offset], fallbackIcon[offset + 1]]), [[16, 16], [32, 32], [48, 48], [96, 96]])
  assert.match(indexSource, /rel="apple-touch-icon" href="\/images\/brand\/smyc-symbol-transparent-hd\.png"/)
  assert.match(seoSource, /smyc-symbol-transparent-hd\.png/)
  assert.match(svgSource, /viewBox="0 0 111 122"/)
  assert.match(svgSource, /<path\b/)
  assert.doesNotMatch(svgSource, /<image\b/)

  const sCurve = svgSource.slice(svgSource.indexOf('M 17.111 74.560'))
  assert.ok((sCurve.match(/\sC\s/g) ?? []).length >= 8)
  assert.doesNotMatch(sCurve, /\sL\s/)
})

// Closing uses content flow instead of the retired fixed Figma coordinates.
// Copy editing and semantics are covered in siteCopyAboutCatalog.test.mjs;
// phone/tablet/wide layout is checked against rendered viewport evidence.

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
