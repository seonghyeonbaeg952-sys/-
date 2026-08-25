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

test('Spirit closing typography fits phone width and education semantics match five tabs', async () => {
  const [componentSource, cssSource] = await Promise.all([
    read('../components/spirit/SpiritHeritageExperience.tsx'),
    read('./spirit-heritage.css'),
  ])

  assert.match(componentSource, /aria-label="성장의 다섯 단계"/)
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

test('desktop Spirit section geometry preserves the final Figma composition', async () => {
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
    /@media \(min-width: 1340px\) \{[\s\S]*\.spirit-heritage__lineage-track\s*\{[\s\S]*top:\s*82px;[\s\S]*left:\s*524px;/,
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
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-grid\s*\{[\s\S]*grid-template-columns:\s*608px 640px;[\s\S]*gap:\s*40px;[\s\S]*align-items:\s*start;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__backdrop-word\s*\{[\s\S]*font-size:\s*clamp\(12rem, 21\.25vw, 19\.125rem\);[\s\S]*letter-spacing:\s*-0\.06em;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-prelude\s*\{[\s\S]*margin-top:\s*27px !important;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-title h2\s*\{[\s\S]*margin-top:\s*-2px;[\s\S]*font-size:\s*54px;[\s\S]*line-height:\s*60px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-title em\s*\{[\s\S]*font-size:\s*64px;[\s\S]*line-height:\s*60px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-line\s*\{[\s\S]*height:\s*60px;[\s\S]*line-height:\s*60px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__vertical-stroke\s*\{[\s\S]*top:\s*120px;[\s\S]*left:\s*-14px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-glass\s*\{[\s\S]*padding:\s*33px 48px 34px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__calligraphic-note\s*\{[\s\S]*margin-left:\s*41px;[\s\S]*font-size:\s*40px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__motet-body\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*109px;[\s\S]*left:\s*49px;[\s\S]*font-size:\s*17px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__quote-card\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*293px;[\s\S]*left:\s*49px;[\s\S]*width:\s*min\(500px, calc\(100% - 98px\)\);[\s\S]*height:\s*174px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__quote-card blockquote\s*\{[\s\S]*width:\s*470px;[\s\S]*font-size:\s*23px;[\s\S]*line-height:\s*1\.45;/,
  )
  assert.match(cssSource, /\.spirit-heritage__manifesto\s*\{[\s\S]*padding:\s*88px 0 85px;/)
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-heading h2\s*\{[\s\S]*font-size:\s*50px;[\s\S]*line-height:\s*62px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-line\s*\{[\s\S]*height:\s*62px;[\s\S]*line-height:\s*62px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-line--listen\s*\{[\s\S]*padding-left:\s*50px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-line--final\s*\{[\s\S]*padding-left:\s*0;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-heading h2 strong\s*\{[\s\S]*font-size:\s*66px;[\s\S]*line-height:\s*62px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-heading small\s*\{[\s\S]*top:\s*58px;[\s\S]*font-size:\s*14px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-row\s*\{[\s\S]*min-height:\s*214px;[\s\S]*padding:\s*41px 0;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-row:first-child\s*\{[\s\S]*min-height:\s*194px;[\s\S]*padding:\s*21px 0;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-row h3\s*\{[\s\S]*margin-top:\s*8px;[\s\S]*font-size:\s*26px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__manifesto-row > p:last-child\s*\{[\s\S]*width:\s*760px;[\s\S]*margin-top:\s*4px !important;[\s\S]*font-size:\s*16px;[\s\S]*line-height:\s*1\.74;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-photo\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*212px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-heading::before\s*\{[\s\S]*width:\s*420px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__education-interactive\s*\{[\s\S]*padding-top:\s*60px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__education-panel::after\s*\{[\s\S]*height:\s*86px;/,
  )
})

test('community composition stays centered while reveal motion owns transforms', async () => {
  const [componentSource, cssSource] = await Promise.all([
    read('../components/spirit/SpiritHeritageExperience.tsx'),
    read('./spirit-heritage.css'),
  ])

  assert.match(
    cssSource,
    /\.spirit-heritage__community-heading::before\s*\{[\s\S]*top:\s*184px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-heading::after\s*\{[\s\S]*top:\s*183px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-closing\s*\{[\s\S]*right:\s*0;[\s\S]*left:\s*0;[\s\S]*margin:\s*0 auto;/,
  )
  assert.doesNotMatch(
    cssSource,
    /\.spirit-heritage__community-closing\s*\{[^}]*transform:\s*translateX\(-50%\)/,
  )
  assert.match(
    componentSource,
    /community-line--middle[\s\S]*<strong>하나의<\/strong>[\s\S]*<\/span>[\s\S]*community-line--last[\s\S]*공동체가 됩니다\./,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-line\s*\{[\s\S]*font-size:\s*33px;[\s\S]*line-height:\s*44px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-line--middle\s*\{[\s\S]*padding-left:\s*36px;[\s\S]*font-size:\s*64px;[\s\S]*line-height:\s*64px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-line--last\s*\{[\s\S]*padding-left:\s*76px;[\s\S]*font-size:\s*49px;[\s\S]*line-height:\s*64px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-heading > p\s*\{[\s\S]*width:\s*540px;[\s\S]*font-size:\s*17px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-closing\s*\{[\s\S]*font-size:\s*28px;[\s\S]*line-height:\s*1\.54;/,
  )
  assert.match(
    componentSource,
    /voiceConstellationCopy\.closing\.replace\(' 서로를', '\\n서로를'\)/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__community-closing\s*\{[\s\S]*white-space:\s*pre-line;/,
  )
})

test('values section preserves the Figma editorial rhythm and panel baseline', async () => {
  const [componentSource, cssSource] = await Promise.all([
    read('../components/spirit/SpiritHeritageExperience.tsx'),
    read('./spirit-heritage.css'),
  ])

  assert.match(
    componentSource,
    /values-line">\s*우리가 <strong>한 음<\/strong>을[\s\S]*values-line--middle">[\s\S]*대하는 네 가지[\s\S]*values-line--last">[\s\S]*태도/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__values-grid\s*\{[\s\S]*grid-template-columns:\s*458px 768px;[\s\S]*gap:\s*70px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__values-heading h2\s*\{[\s\S]*font-size:\s*46px;[\s\S]*line-height:\s*54px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__values-line\s*\{[\s\S]*height:\s*54px;[\s\S]*line-height:\s*54px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__values-heading h2 strong\s*\{[\s\S]*font-size:\s*58px;[\s\S]*line-height:\s*54px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__values-lead\s*\{[\s\S]*margin-top:\s*28px !important;[\s\S]*line-height:\s*1\.72;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__tab-list\s*\{[\s\S]*gap:\s*22px;[\s\S]*margin-top:\s*53px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__value-tab\s*\{[\s\S]*grid-template-columns:\s*72px 1fr;[\s\S]*min-height:\s*94px;[\s\S]*padding:\s*18px 19px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__value-panel-wrap\s*\{[\s\S]*align-items:\s*start;[\s\S]*min-height:\s*806px;[\s\S]*padding-top:\s*250px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__value-panel\s*\{[\s\S]*height:\s*556px;[\s\S]*padding:\s*22px 44px 52px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__value-number\s*\{[\s\S]*font-size:\s*122px;[\s\S]*line-height:\s*1;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__value-panel h3\s*\{[\s\S]*margin-top:\s*38px;[\s\S]*font-size:\s*39px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__value-panel::after\s*\{[\s\S]*right:\s*-1px;[\s\S]*left:\s*auto;[\s\S]*height:\s*96px;/,
  )
})

test('faith section matches the Figma title cadence, copy rhythm, and scripture cards', async () => {
  const [componentSource, cssSource] = await Promise.all([
    read('../components/spirit/SpiritHeritageExperience.tsx'),
    read('./spirit-heritage.css'),
  ])

  assert.match(componentSource, /faith-line--generation">다음 세대의<\/span>/)
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-grid\s*\{[\s\S]*grid-template-columns:\s*560px 668px;[\s\S]*gap:\s*68px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-watermark\s*\{[\s\S]*top:\s*-18px;[\s\S]*left:\s*calc\(50% - 70px\);[\s\S]*font-size:\s*196px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-line\s*\{[\s\S]*height:\s*56px;[\s\S]*font-size:\s*46px;[\s\S]*line-height:\s*56px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-line--generation\s*\{[\s\S]*height:\s*60px;[\s\S]*margin-top:\s*4px;[\s\S]*padding-left:\s*26px;[\s\S]*font-size:\s*48px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-line--last\s*\{[\s\S]*height:\s*60px;[\s\S]*padding-left:\s*74px;[\s\S]*font-size:\s*48px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-title h2 strong\s*\{[\s\S]*font-size:\s*58px;[\s\S]*line-height:\s*56px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-title h2 em\s*\{[\s\S]*font-size:\s*66px;[\s\S]*line-height:\s*60px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-title::before,\s*\.spirit-heritage__faith-title::after\s*\{[\s\S]*left:\s*26px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-title::before\s*\{[\s\S]*top:\s*194px;[\s\S]*width:\s*430px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-copy > \.spirit-heritage__faith-lead\s*\{[\s\S]*width:\s*560px;[\s\S]*margin-top:\s*32px !important;[\s\S]*font-size:\s*18px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-lead \+ p\s*\{[\s\S]*margin-top:\s*32px !important;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__faith-copy > p\s*\{[\s\S]*width:\s*510px;[\s\S]*margin-top:\s*82px !important;[\s\S]*font-size:\s*16px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__scripture-list\s*\{[\s\S]*align-content:\s*start;[\s\S]*gap:\s*46px;[\s\S]*padding-top:\s*78px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__scripture-card\s*\{[\s\S]*height:\s*282px;[\s\S]*padding:\s*0;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__scripture-card blockquote\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*80px;[\s\S]*left:\s*30px;[\s\S]*width:\s*584px;[\s\S]*font-size:\s*24px;/,
  )
  assert.match(
    cssSource,
    /\.spirit-heritage__scripture-card small\s*\{[\s\S]*position:\s*absolute;[\s\S]*top:\s*186px;[\s\S]*left:\s*30px;[\s\S]*width:\s*584px;/,
  )
  assert.match(
    cssSource,
    /@media \(min-width: 1200px\) \{[\s\S]*\.spirit-heritage__faith-copy > p:nth-of-type\(1\)[\s\S]*top:\s*212px;[\s\S]*nth-of-type\(2\)[\s\S]*top:\s*306px;[\s\S]*nth-of-type\(3\)[\s\S]*top:\s*444px;[\s\S]*nth-of-type\(4\)[\s\S]*top:\s*582px;/,
  )
})

test('Spirit hash navigation bypasses global smooth scrolling for its final alignment', async () => {
  const componentSource = await read('../components/spirit/SpiritHeritageExperience.tsx')

  assert.match(
    componentSource,
    /root\.style\.setProperty\('scroll-behavior', 'auto', 'important'\)/,
  )
  assert.match(componentSource, /root\.style\.removeProperty\('scroll-behavior'\)/)
})
