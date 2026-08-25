import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const outputDir = new URL('./spirit-sections-current/', import.meta.url)
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.goto('http://127.0.0.1:5175/spirit', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

for (const [name, selector] of [
  ['hero', '.spirit-heritage__hero'],
  ['timeline', '.spirit-heritage__lineage'],
  ['motet', '.spirit-heritage__motet'],
  ['manifesto', '.spirit-heritage__manifesto'],
  ['faith', '.spirit-heritage__faith'],
  ['values', '.spirit-heritage__values'],
  ['community', '.spirit-heritage__community'],
  ['education', '.spirit-heritage__education'],
  ['cta', '.spirit-heritage__closing'],
]) {
  const locator = page.locator(selector)
  await locator.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1100)
  await locator.screenshot({
    path: fileURLToPath(new URL(`${name}.png`, outputDir)),
  })
}

await browser.close()
