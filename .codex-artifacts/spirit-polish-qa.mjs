import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const outputDir = new URL('./spirit-polish/', import.meta.url)
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const results = []

for (const viewport of [
  { name: 'desktop', width: 1536, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
]) {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: viewport.width, height: viewport.height },
  })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('http://127.0.0.1:5175/spirit', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)

  const metrics = await page.evaluate(() => {
    const closing = document.querySelector('.spirit-heritage__closing-card')
    const oneVoice = document.querySelector('.spirit-heritage__one-voice')
    const symbol = document.querySelector('.spirit-heritage__closing-logo')
    const educationTabs = document.querySelectorAll('.spirit-heritage__education-tabs button')
    const textSelectors = [
      '.spirit-heritage__display-title',
      '.spirit-heritage__hero-heading--mobile',
      '.spirit-heritage__lineage-title',
      '.spirit-heritage__motet-title',
      '.spirit-heritage__manifesto-heading',
      '.spirit-heritage__faith-title',
      '.spirit-heritage__values-heading',
      '.spirit-heritage__community-heading',
      '.spirit-heritage__education-title',
      '.spirit-heritage__closing-copy',
      '.spirit-heritage__one-voice',
    ]
    const visibleTextBounds = textSelectors
      .flatMap((selector) => [...document.querySelectorAll(selector)])
      .filter((element) => getComputedStyle(element).display !== 'none')
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          selector: element.className,
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        }
      })

    const closingRect = closing?.getBoundingClientRect()
    const oneVoiceRect = oneVoice?.getBoundingClientRect()
    const symbolRect = symbol?.getBoundingClientRect()

    return {
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      rootClientWidth: document.documentElement.clientWidth,
      rootScrollWidth: document.documentElement.scrollWidth,
      educationCount: educationTabs.length,
      educationLabel: document.querySelector('.spirit-heritage__education-tabs')?.getAttribute('aria-label'),
      oneVoice: oneVoiceRect && closingRect
        ? {
            fontFamily: getComputedStyle(oneVoice).fontFamily,
            fontSize: getComputedStyle(oneVoice).fontSize,
            left: oneVoiceRect.left,
            right: oneVoiceRect.right,
            cardLeft: closingRect.left,
            cardRight: closingRect.right,
            fitsCard: oneVoiceRect.left >= closingRect.left && oneVoiceRect.right <= closingRect.right,
          }
        : null,
      symbol: symbol && symbolRect
        ? {
            src: symbol.getAttribute('src'),
            currentSrc: symbol.currentSrc,
            naturalWidth: symbol.naturalWidth,
            naturalHeight: symbol.naturalHeight,
            renderedWidth: symbolRect.width,
            renderedHeight: symbolRect.height,
          }
        : null,
      visibleTextBounds,
    }
  })

  const anchors = []
  for (const id of [
    'spirit-overview',
    'spirit-lineage',
    'spirit-faith',
    'spirit-values',
    'spirit-education',
    'spirit-community',
    'spirit-join',
  ]) {
    await page.evaluate((targetId) => {
      window.location.hash = targetId
    }, id)
    await page.waitForTimeout(700)
    anchors.push(
      await page.evaluate((targetId) => {
        const target = document.getElementById(targetId)
        return {
          id: targetId,
          top: target ? Math.round(target.getBoundingClientRect().top * 10) / 10 : null,
          scrollY: Math.round(window.scrollY),
        }
      }, id),
    )
  }

  metrics.oneVoice = await page.evaluate(() => {
    const closing = document.querySelector('.spirit-heritage__closing-card')
    const oneVoice = document.querySelector('.spirit-heritage__one-voice')
    const closingRect = closing?.getBoundingClientRect()
    const oneVoiceRect = oneVoice?.getBoundingClientRect()

    return oneVoice && oneVoiceRect && closingRect
      ? {
          fontFamily: getComputedStyle(oneVoice).fontFamily,
          fontSize: getComputedStyle(oneVoice).fontSize,
          left: oneVoiceRect.left,
          right: oneVoiceRect.right,
          cardLeft: closingRect.left,
          cardRight: closingRect.right,
          fitsCard: oneVoiceRect.left >= closingRect.left && oneVoiceRect.right <= closingRect.right,
        }
      : null
  })

  await page.locator('.spirit-heritage__closing').screenshot({
    path: fileURLToPath(new URL(`${viewport.name}-closing.png`, outputDir)),
  })
  await page.locator('.spirit-heritage__education').screenshot({
    path: fileURLToPath(new URL(`${viewport.name}-education.png`, outputDir)),
  })

  results.push({ viewport, errors, metrics, anchors })
  await page.close()
}

await browser.close()
await writeFile(
  new URL('metrics.json', outputDir),
  `${JSON.stringify(results, null, 2)}\n`,
  'utf8',
)
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
