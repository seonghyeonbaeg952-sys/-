import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Spirit maps the Figma typography roles to their original font families', async () => {
  const [cssSource, indexSource] = await Promise.all([
    read('./spirit-heritage.css'),
    read('../../index.html'),
  ])

  assert.match(cssSource, /--spirit-display:\s*"Fraunces"/)
  assert.match(cssSource, /--spirit-editorial:\s*"Bodoni Moda"/)
  assert.match(cssSource, /--spirit-condensed:\s*"Barlow Condensed"/)
  assert.match(cssSource, /--spirit-statement:\s*"Song Myung"/)
  assert.match(cssSource, /--spirit-brush:\s*"Nanum Brush Script"/)
  assert.match(cssSource, /--spirit-sans:\s*"Noto Sans KR"/)

  assert.match(cssSource, /\.spirit-heritage__display-title\s*\{[\s\S]*font-family:\s*var\(--spirit-display\)/)
  // The owner retired the manifesto, education and watermark sections.
  // Keep role contracts on the four sections that are still rendered.
  assert.match(cssSource, /\.spirit-heritage__one-voice\s*\{[\s\S]*font-family:\s*var\(--spirit-editorial\)/)

  for (const family of [
    'Barlow+Condensed',
    'Bodoni+Moda',
    'Fraunces',
    'Nanum+Brush+Script',
    'Noto+Sans+KR',
    'Song+Myung',
  ]) {
    assert.match(indexSource, new RegExp(`family=${family.replace(/\+/g, '\\+')}`))
  }
})
