import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const outputDirectory = '.codex-artifacts/spirit-polish'
await mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1536, height: 900 } })
await page.goto('http://127.0.0.1:5175/spirit', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

const section = page.locator('#spirit-community')
await section.scrollIntoViewIfNeeded()
await page.waitForTimeout(900)

const measurements = await page.evaluate(() => {
  const sectionElement = document.querySelector('#spirit-community')
  const heading = sectionElement.querySelector('.spirit-heritage__community-heading')
  const title = heading.querySelector('h2')
  const photo = sectionElement.querySelector('.spirit-heritage__community-photo')
  const voices = sectionElement.querySelector('.spirit-heritage__voices')
  const closing = sectionElement.querySelector('.spirit-heritage__community-closing')
  const sectionRect = sectionElement.getBoundingClientRect()
  const headingRect = heading.getBoundingClientRect()
  const titleRect = title.getBoundingClientRect()
  const photoRect = photo.getBoundingClientRect()
  const voicesRect = voices.getBoundingClientRect()
  const closingRect = closing.getBoundingClientRect()
  const headingRuleTop = Number.parseFloat(getComputedStyle(heading, '::before').top)

  return {
    titleBottom: titleRect.bottom - sectionRect.top,
    ruleTop: headingRect.top - sectionRect.top + headingRuleTop,
    photoTop: photoRect.top - sectionRect.top,
    photoBottom: photoRect.bottom - sectionRect.top,
    voicesTop: voicesRect.top - sectionRect.top,
    closingLeft: closingRect.left - sectionRect.left,
    closingRight: closingRect.right - sectionRect.left,
    closingWidth: closingRect.width,
    sectionWidth: sectionRect.width,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }
})

await section.screenshot({ path: `${outputDirectory}/community-1536-fixed.png` })

const closing = page.locator('.spirit-heritage__community-closing')
await closing.scrollIntoViewIfNeeded()
await page.waitForTimeout(900)
const closingMotion = await closing.evaluate((element) => {
  const rect = element.getBoundingClientRect()
  const style = getComputedStyle(element)
  return {
    left: rect.left,
    right: rect.right,
    width: rect.width,
    opacity: style.opacity,
    transform: style.transform,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
  }
})
await page.screenshot({ path: `${outputDirectory}/community-closing-1536-fixed.png` })

process.stdout.write(`${JSON.stringify({ ...measurements, closingMotion }, null, 2)}\n`)
await browser.close()
