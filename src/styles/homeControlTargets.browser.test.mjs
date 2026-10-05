import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const browserModule = process.env.SMYC_PLAYWRIGHT_MODULE
const root = fileURLToPath(new URL('../../', import.meta.url))
const fixturePath = '/__home-control-targets'
const styles = [
  '/src/styles/globals.css',
  '/src/styles/shared-shell-fixes.css',
  '/src/styles/home-v6-fixes.css',
  '/src/components/sample/home-v4/HomeV4SampleHeader.css',
  '/src/pages/sample/HomeV4SamplePage.css',
  '/src/styles/home-responsive-layout.css',
  '/src/styles/home-tablet-figma.css',
  '/src/features/sample-language/sample-language.css',
]

// Only control markup and its real containing blocks are represented here.
// Production CSS supplies sizes/wrapping/density; no API requests or app state.
const fixture = `<!doctype html><html lang="en" data-sample-language="en"><head><meta charset="utf-8">
${styles.map(href => `<link rel="stylesheet" href="${href}">`).join('\n')}
<style>html,body{margin:0}*,*::before,*::after{box-sizing:border-box}.home-hero-layout{position:relative;width:100%;min-height:400px;padding:20px}.home-hero-section{overflow:hidden}.sample-language-switch__issue{font-family:Arial,sans-serif}</style>
</head><body><div class="public-shell-home public-shell-home-sample-v4" data-home-viewport="desktop" data-design-candidate="home-v4">
  <header class="home-v4-sample-header"><div class="home-v4-sample-header__bar max-w-content"><div class="sample-language-switch">
    <div class="sample-language-switch__issue" role="status"><p>Some English content could not be loaded. Available content is still shown.</p><button type="button">Retry</button></div>
  </div></div></header>
  <section class="home-hero-section"><div class="max-w-content home-hero-layout"><div class="home-hero-copy">
    <div class="home-hero-controls"><div class="home-hero-dots" role="tablist">${[1, 2, 3, 4].map(index => `<button type="button" class="home-hero-dot" role="tab" aria-label="Image ${index}" aria-selected="${index === 1}"></button>`).join('')}</div>
    <div class="home-hero-arrow-group"><button class="home-hero-arrow" type="button" aria-label="Pause">Ⅱ</button><button class="home-hero-arrow" type="button" aria-label="Previous">‹</button><button class="home-hero-arrow" type="button" aria-label="Next">›</button></div></div>
  </div></div></section>
</div></body></html>`

test('home controls preserve physical touch bounds through density and narrow wrapping', { skip: !browserModule }, async t => {
  const vite = await createServer({
    root, configFile: false, appType: 'custom', logLevel: 'silent', server: { host: '127.0.0.1', port: 0 },
    plugins: [{ name: 'home-control-target-fixture', configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== fixturePath) return next()
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(fixture)
      })
    } }],
  })
  let browser
  try {
    await vite.listen()
    const { chromium } = await import(browserModule)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage()
    await page.goto(`${vite.resolvedUrls.local[0].replace(/\/$/, '')}${fixturePath}`)
    for (const [width, mode] of [[320, 'mobile'], [390, 'mobile'], [768, 'tablet'], [1366, 'tablet'], [1440, 'desktop'], [1680, 'desktop'], [1920, 'desktop']]) {
      await page.setViewportSize({ width, height: 1024 })
      await page.locator('.public-shell-home').evaluate((element, mode) => { element.dataset.homeViewport = mode }, mode)
      await t.test(`${width}px hero controls are full44px targets inside every clipping ancestor`, async () => {
        const controls = await page.locator('.home-hero-controls button').evaluateAll(elements => elements.map(element => {
          const box = element.getBoundingClientRect(), clipped = []
          for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
            const bounds = ancestor.getBoundingClientRect(), style = getComputedStyle(ancestor)
            if (['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX) && (box.left < bounds.left - 0.5 || box.right > bounds.right + 0.5)) clipped.push(String(ancestor.className))
          }
          return { label: element.getAttribute('aria-label'), width: box.width, height: box.height, left: box.left, right: box.right, clipped }
        }))
        assert.equal(controls.length, 7)
        for (const control of controls) {
          assert.ok(control.width >= 43.9 && control.height >= 43.9, `${control.label}: ${control.width}x${control.height} is below physical44px`)
          assert.ok(control.left >= -0.5 && control.right <= width + 0.5, `${control.label} is outside the viewport`)
          assert.deepEqual(control.clipped, [], `${control.label} is hidden by an overflow ancestor`)
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Do not expose page-wide horizontal scrolling')
      })
      await t.test(`${width}px retry remains a full44px physical target in the scaled header`, async () => {
        const retry = page.getByRole('button', { name: 'Retry', exact: true })
        const bounds = await retry.evaluate(element => element.getBoundingClientRect().toJSON())
        assert.ok(bounds.width >= 43.9 && bounds.height >= 43.9, `Retry is ${bounds.width}x${bounds.height}`)
        assert.ok(bounds.left >= 0 && bounds.right <= width && bounds.top >= 0 && bounds.bottom <= 1024, 'Fixed error action stays inside the viewport')
        await retry.focus()
        assert.notEqual(await retry.evaluate(element => getComputedStyle(element).outlineStyle), 'none', 'Retry keyboard focus must remain visible')
      })
    }
  } finally { await browser?.close(); await vite.close() }
})
