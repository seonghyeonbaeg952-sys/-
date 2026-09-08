const { chromium } = require('C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const cases = [
  { height: 900, name: 'desktop-1536', width: 1536 },
  { height: 1024, name: 'tablet-768', width: 768 },
  { height: 844, name: 'mobile-390', width: 390 },
]

async function run() {
  const browser = await chromium.launch({ headless: true })
  const results = []

  for (const viewport of cases) {
    const page = await browser.newPage({ viewport })
    const runtimeErrors = []
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
    })
    page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`))

    await page.goto('http://127.0.0.1:5175/about?section=overview', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)

    const geometry = await page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const value = element.getBoundingClientRect()
        return {
          bottom: Math.round(value.bottom + window.scrollY),
          height: Math.round(value.height),
          left: Math.round(value.left),
          right: Math.round(value.right),
          top: Math.round(value.top + window.scrollY),
          width: Math.round(value.width),
        }
      }

      const buttons = [...document.querySelectorAll('.about-overview__spirit-values button')]
      const caption = document.querySelector('.about-overview__glass-caption')
      const selectorNav = document.querySelector('.about-overview-nav nav')

      return {
        caption: rect('.about-overview__glass-caption'),
        captionVisible: caption
          ? getComputedStyle(caption).visibility !== 'hidden' && caption.getBoundingClientRect().height > 0
          : false,
        clientWidth: document.documentElement.clientWidth,
        education: rect('.about-overview__education-stage'),
        founding: rect('.about-overview__founding-stage'),
        globalHorizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        intro: rect('.about-overview__intro-stage'),
        minSpiritButtonHeight: Math.min(...buttons.map((button) => button.getBoundingClientRect().height)),
        scrollWidth: document.documentElement.scrollWidth,
        selectorFullyVisible: selectorNav
          ? selectorNav.getBoundingClientRect().height > 0 && getComputedStyle(selectorNav).visibility !== 'hidden'
          : false,
        selectorHorizontalScrollAvailable: selectorNav
          ? selectorNav.scrollWidth > selectorNav.clientWidth
          : false,
        spirit: rect('.about-overview__spirit-stage'),
      }
    })

    await page.screenshot({
      fullPage: true,
      path: `output/playwright/about-${viewport.name}-full.png`,
    })

    for (const sectionId of ['overview', 'founding', 'spirit', 'education']) {
      await page.evaluate((id) => {
        const section = document.getElementById(id)
        if (!section) return
        const top = section.getBoundingClientRect().top + window.scrollY - 84
        window.scrollTo({ behavior: 'instant', top: Math.max(0, top) })
      }, sectionId)
      await page.waitForTimeout(300)
      await page.screenshot({
        path: `output/playwright/about-${viewport.name}-${sectionId}.png`,
      })
    }

    results.push({ geometry, runtimeErrors, viewport })
    await page.close()
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
