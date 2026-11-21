import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Spirit maps the Figma typography roles to their original font families', async () => {
  const cssSource = await read('./spirit-heritage.css')

  assert.match(cssSource, /--spirit-display:\s*"Fraunces"/)
  assert.match(cssSource, /--spirit-editorial:\s*"Bodoni Moda"/)
  assert.match(cssSource, /--spirit-condensed:\s*"Barlow Condensed"/)
  assert.match(cssSource, /--spirit-brush:\s*"Nanum Brush Script"/)
  assert.match(cssSource, /--spirit-sans:\s*"Noto Sans KR"/)

  assert.match(cssSource, /\.spirit-heritage__display-title\s*\{[\s\S]*font-family:\s*var\(--spirit-display\)/)
  // The owner retired the manifesto, education and watermark sections.
  // Keep role contracts on the four sections that are still rendered.
  assert.match(cssSource, /\.spirit-heritage__one-voice\s*\{[\s\S]*font-family:\s*var\(--spirit-editorial\)/)
})

test('Spirit web fonts load on the Spirit route and keep the Korean print face available', async () => {
  const [spiritSource, indexSource, printSource, sharedSource] = await Promise.all([
    read('./spirit-heritage.css'),
    read('../../index.html'),
    read('../components/admin/join/join-application-print.css'),
    read('./globals.css'),
  ])

  assert.equal((spiritSource.match(/@import\s+url\("https:\/\/fonts\.googleapis\.com\/css2\?/g) ?? []).length, 1)
  for (const family of ['Barlow+Condensed', 'Bodoni+Moda', 'Fraunces', 'Nanum+Brush+Script', 'Noto+Sans+KR']) {
    assert.ok(spiritSource.includes(`family=${family}`), family)
    assert.ok(!indexSource.includes(`family=${family}`), family)
  }

  assert.match(printSource, /family=Noto\+Sans\+KR:wght@400;500;700&display=swap/)
  assert.doesNotMatch(indexSource, /fonts\.googleapis\.com\/css2/)
  assert.match(sharedSource, /font-family: "Cormorant Garamond";\s*src: url\("\/fonts\/CormorantGaramond-Variable\.woff2"\)/)
  assert.match(sharedSource, /font-family: "Gowun Batang";\s*src: url\("\/fonts\/GowunBatang-Regular\.woff2"\)/)
  assert.match(spiritSource, /font-family: "Fraunces";\s*src: url\("\/fonts\/Fraunces-Black-Latin\.woff2"\)/)
  assert.match(spiritSource, /font-family: "Barlow Condensed";\s*src: url\("\/fonts\/BarlowCondensed-SemiBold-Latin\.woff2"\)/)
})
