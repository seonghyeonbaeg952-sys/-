import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent',
  cacheDir: 'node_modules/.vite-score-motion-test', server: { middlewareMode: true } })
after(() => vite.close())
const { ScrollScoreBookReveal } = await vite.ssrLoadModule('/src/components/home/ScrollScoreBookReveal.tsx')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')
const styles = (await Promise.all(['home-v6-fixes.css', 'home-score-redesign.css'].map(file =>
  readFile(new URL(`../../styles/${file}`, import.meta.url), 'utf8')))).join('\n')

// Desktop base rules only: mobile/reduced-motion blocks intentionally force
// the final page visible and must not be mistaken for the animated scene.
function* baseRules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let depth = 0, start = 0, opening = 0
  for (let index = 0; index < text.length; index++) {
    if (text[index] === '{') { if (depth === 0) opening = index; depth++ }
    if (text[index] !== '}') continue
    depth--
    if (depth !== 0) continue
    const selector = text.slice(start, opening).trim()
    if (!selector.startsWith('@')) yield [selector, text.slice(opening + 1, index)]
    start = index + 1
  }
}

function spreadOpacity(open) {
  let expression
  for (const [selectors, body] of baseRules(styles)) {
    if (!selectors.split(',').some(value => ['.motet-score-spread', '.motet-score-scroll-section .motet-score-spread'].includes(value.trim()))) continue
    const opacity = body.match(/\bopacity:\s*([^;]+);/)?.[1]
    if (opacity) expression = opacity
  }
  assert.ok(expression, 'Read the opacity from the real production stylesheet')
  const numeric = expression.replace(/var\(--book-open(?:,\s*0)?\)/g, String(open)).replace(/calc\((.*)\)/, '($1)')
  assert.match(numeric, /^[\d\s.()+*/-]+$/)
  return new Function(`return ${numeric}`)()
}

function render(width, reducedMotion = false) {
  const original = globalThis.window
  globalThis.window = { matchMedia: () => ({ matches: width >= 1024 && !reducedMotion }) }
  try {
    return renderToStaticMarkup(React.createElement(MemoryRouter, null,
      React.createElement(ScrollScoreBookReveal, { content: HOME_CONTENT_DEFAULTS_V2.scoreBook })))
  } finally {
    if (original === undefined) delete globalThis.window
    else globalThis.window = original
  }
}

test('before the first desktop frame, the closed cover cannot show ghost pages or VOICE text', () => {
  const html = render(1440)
  const open = Number(html.match(/--book-open:([\d.]+)/)?.[1])
  assert.equal(open, 0)
  assert.equal(spreadOpacity(open), 0, 'Closed interior pages must be completely invisible, not 8% visible')
  assert.match(html, /--cover-opacity:1\.0000/)
  assert.match(html, /--paper-reveal:0\.0000/)
})

test('opening still develops smoothly into fully visible pages without a static ghost floor', () => {
  assert.equal(spreadOpacity(0.25), 0.25)
  assert.equal(spreadOpacity(1), 1)
})

for (const { width, reduced } of [{ width: 390, reduced: false }, { width: 768, reduced: false }, { width: 1440, reduced: true }]) {
  test(`${width}px ${reduced ? 'reduced motion' : 'responsive'} keeps the final text and actions ready`, () => {
    const html = render(width, reduced)
    assert.match(html, /--paper-reveal:1\.0000/)
    assert.match(html, /motet-score-final-sheet is-interactive/)
    assert.doesNotMatch(html, /class="motet-score-flutter-page"/)
  })
}
