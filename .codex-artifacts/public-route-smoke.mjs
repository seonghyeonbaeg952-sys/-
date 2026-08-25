import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const routes = [
  '/',
  '/spirit',
  '/about?section=spirit',
  '/about?section=conductor',
  '/about?section=accompanist',
  '/about?section=members',
  '/join',
  '/contact?section=support',
]

const browser = await chromium.launch({ headless: true })
const results = []

for (const route of routes) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  const response = await page.goto(`http://127.0.0.1:5175${route}`, {
    waitUntil: 'networkidle',
  })
  await page.evaluate(() => document.fonts.ready)
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.title,
  }))

  results.push({
    route,
    status: response?.status() ?? null,
    errors,
    horizontalOverflow: layout.scrollWidth - layout.clientWidth,
    title: layout.title,
  })
  await page.close()
}

await browser.close()
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`)
