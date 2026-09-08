import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const projectRoot = new URL('../../../', import.meta.url)
const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})

let HistoryCueSheetExperience = null
let loadError = null

try {
  ;({ HistoryCueSheetExperience } = await vite.ssrLoadModule(
    '/src/components/about/HistoryCueSheetExperience.tsx',
  ))
} catch (error) {
  loadError = error
}

after(async () => {
  await vite.close()
})

const longCopy = '긴은 CMS 문구 '.repeat(150)
const rows = [
  {
    content: longCopy,
    display_order: 1,
    id: 'without-image',
    image_url: null,
    is_visible: true,
    month: null,
    title: null,
    year: '2014',
  },
  {
    content: '현지 무대와 문화 속에서 합창을 경험했습니다.',
    display_order: 2,
    id: 'with-image',
    image_url: 'https://cdn.example.com/tour.jpg',
    is_visible: true,
    month: '07.31—08.09',
    title: '유럽 초청연주 및 비전투어',
    year: '2018',
  },
]

function render(props = {}) {
  assert.ok(HistoryCueSheetExperience, loadError?.message)

  return renderToStaticMarkup(
    React.createElement(HistoryCueSheetExperience, {
      defaultOpenIds: ['without-image', 'with-image'],
      history: rows,
      shouldUseLegacyFallback: false,
      ...props,
    }),
  )
}

test('history Cue Sheet component is available', () => {
  assert.ok(HistoryCueSheetExperience, loadError?.message)
})

test(
  'each record uses an accessible disclosure button and labelled panel',
  { skip: !HistoryCueSheetExperience },
  () => {
    const markup = render()

    assert.equal(markup.match(/aria-expanded="true"/g)?.length ?? 0, 2)
    assert.match(markup, /aria-controls="history-cue-panel-0"/)
    assert.match(markup, /id="history-cue-panel-0"/)
    assert.match(markup, /aria-labelledby="history-cue-trigger-0"/)
    assert.match(markup, /type="button"/)
  },
)

test(
  'missing optional fields collapse cleanly while image records use contain and meaningful alt text',
  { skip: !HistoryCueSheetExperience },
  () => {
    const markup = render()

    assert.ok(markup.includes('2014년 활동 기록'))
    assert.ok(markup.includes(longCopy.trim()))
    assert.doesNotMatch(markup, />null<|>undefined</)
    assert.ok(markup.includes('2018 07.31—08.09 유럽 초청연주 및 비전투어 연혁 이미지'))
    assert.match(markup, /history-cue__record-image/)
    assert.ok(markup.includes('https://cdn.example.com/tour.jpg'))
    assert.equal(markup.match(/<img\b/g)?.length ?? 0, 2)
  },
)

test(
  'the approved 2025 concert photograph fills only the hero until CMS provides an image',
  { skip: !HistoryCueSheetExperience },
  () => {
    const markup = render({
      defaultOpenIds: [],
      history: [rows[0]],
      shouldUseLegacyFallback: false,
    })

    assert.ok(markup.includes('/images/about/smyc-11th-concert-2025.jpg'))
    assert.ok(markup.includes('2025 제11회 정기연주회 무대 사진'))
    assert.ok(markup.includes('FOLIO 18 · 2025 11TH REGULAR CONCERT'))
  },
)

test(
  'the history closing stays restrained without the decorative continuation phrase',
  { skip: !HistoryCueSheetExperience },
  () => {
    const markup = render()

    assert.match(markup, /기록은 끝나지 않고, 다음 목소리로 이어집니다\./)
    assert.doesNotMatch(markup, /To be continued\./)
  },
)

test('responsive CSS protects long copy, touch targets, image fit, and reduced motion', async () => {
  const css = await readFile(
    new URL('src/styles/history-cue-sheet.css', projectRoot),
    'utf8',
  ).catch(() => '')

  assert.match(css, /min-height:\s*44px/)
  assert.match(css, /object-fit:\s*contain/)
  assert.match(css, /overflow-wrap:\s*anywhere/)
  assert.match(css, /@media\s*\(min-width:\s*768px\)/)
  assert.match(css, /@media\s*\(min-width:\s*1200px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(css, /\.history-cue__panel\s*\{[^}]*height:\s*\d+px/s)
})

test('the public about route delegates dedicated and all-view history to Cue Sheet', async () => {
  const page = await readFile(
    new URL('src/pages/public/AboutPage.tsx', projectRoot),
    'utf8',
  )

  assert.match(page, /import \{ HistoryCueSheetExperience \}/)
  assert.match(page, /const shouldShowDedicatedHistory = activeSection === 'history'/)
  assert.match(
    page,
    /shouldShowDedicatedMembers \|\|\s*shouldShowDedicatedHistory \? null : \(/,
  )
  assert.match(page, /<HistoryCueSheetExperience/)
  assert.match(page, /compact=\{shouldShowAll\}/)
  assert.doesNotMatch(page, /function HistoryList\(/)
})
