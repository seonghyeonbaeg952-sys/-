const { chromium } = require('C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 } })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('http://127.0.0.1:5175/about?section=conductor', { waitUntil: 'networkidle' })
  await page.locator('.conductor-profile__education').waitFor({ state: 'visible' })
  await page.evaluate(() => document.fonts.ready)

  const section = await page.locator('.conductor-profile__education').evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    top: element.getBoundingClientRect().top + window.scrollY,
  }))
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  const sampleScrolls = [
    section.top - viewportHeight * 0.68,
    section.top,
    section.top + section.height * 0.25,
    section.top + section.height * 0.5,
    section.top + section.height * 0.75,
    section.top + section.height - viewportHeight,
    section.top + section.height,
  ]

  const samples = []
  for (const requestedScroll of sampleScrolls) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), requestedScroll)
    await page.waitForTimeout(80)
    samples.push(await page.evaluate((requested) => {
      const root = document.querySelector('.conductor-profile')
      const education = document.querySelector('.conductor-profile__education')
      const curve = document.querySelector('.conductor-profile__education-curve--progress')
      const steps = [...document.querySelectorAll('.conductor-profile__education-step')]
      const rect = education.getBoundingClientRect()
      return {
        active: steps.find((step) => step.classList.contains('is-active'))?.textContent?.trim() ?? null,
        clipPath: getComputedStyle(curve).clipPath,
        progress: root.style.getPropertyValue('--conductor-education-progress'),
        rectBottom: Math.round(rect.bottom),
        rectTop: Math.round(rect.top),
        requestedScroll: Math.round(requested),
        scrollY: Math.round(window.scrollY),
      }
    }, requestedScroll))
  }

  console.log(JSON.stringify({ errors, section, samples, viewportHeight }, null, 2))
  await browser.close()
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
