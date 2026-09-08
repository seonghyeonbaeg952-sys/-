const { chromium } = require('C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

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

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { height: 900, width: 1440 } })
  const results = []

  for (const route of routes) {
    const pageErrors = []
    const handler = (error) => pageErrors.push(error.message)
    page.on('pageerror', handler)

    const response = await page.goto(`http://127.0.0.1:5175${route}`, {
      waitUntil: 'networkidle',
    })
    await page.locator('main').waitFor({ state: 'visible' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(
      () => (document.querySelector('main')?.textContent?.trim().length || 0) > 100,
      undefined,
      { timeout: 8000 },
    )
    await page.waitForTimeout(350)

    const state = await page.evaluate(() => {
      const heading = document.querySelector('main h1, main h2')
      const main = document.querySelector('main')
      return {
        heading: heading?.textContent?.replace(/\s+/g, ' ').trim() || null,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        mainTextLength: main?.textContent?.trim().length || 0,
      }
    })

    results.push({
      ...state,
      pageErrors,
      route,
      status: response?.status() || null,
    })
    page.off('pageerror', handler)
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
