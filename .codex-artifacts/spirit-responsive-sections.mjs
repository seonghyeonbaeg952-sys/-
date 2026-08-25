import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const outputDir = new URL('./spirit-responsive-sections/', import.meta.url)
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })

for (const viewport of [
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('http://127.0.0.1:5175/spirit', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content: 'header, [data-site-header] { visibility: hidden !important; }',
  })

  for (const [name, selector] of [
    ['manifesto', '.spirit-heritage__manifesto'],
    ['faith', '.spirit-heritage__faith'],
    ['values', '.spirit-heritage__values'],
    ['community', '.spirit-heritage__community'],
  ]) {
    const locator = page.locator(selector)
    await locator.scrollIntoViewIfNeeded()
    await page.waitForTimeout(120)
    await locator.screenshot({
      path: fileURLToPath(new URL(`${viewport.name}-${name}.png`, outputDir)),
    })
  }

  await page.close()
}

await browser.close()
