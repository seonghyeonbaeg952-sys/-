const assert = require('node:assert/strict')
const { chromium } = require('C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

async function auditViewport(browser, viewport) {
  const page = await browser.newPage({ viewport })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('http://127.0.0.1:5175/about?section=conductor', { waitUntil: 'networkidle' })
  const career = page.locator('.conductor-profile__career')
  await career.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)
  const roles = page.locator('.conductor-profile__role-trigger')

  assert.equal(await roles.count(), 3, `${viewport.width}px must expose three career controls`)
  assert.equal(await roles.nth(0).getAttribute('aria-pressed'), 'true')

  const beforeHover = await roles.nth(1).evaluate((button) => {
    const item = button.closest('li')
    const reveal = item.matches('[data-conductor-reveal]') ? item : item.querySelector('[data-conductor-reveal]')
    return { className: reveal.className, opacity: getComputedStyle(reveal).opacity }
  })
  assert.ok(Number(beforeHover.opacity) > 0.99, `career card was not visible before hover: ${JSON.stringify(beforeHover)}`)

  await roles.nth(1).hover()
  await page.waitForTimeout(280)
  assert.equal(await roles.nth(0).getAttribute('aria-pressed'), 'false')
  assert.equal(await roles.nth(1).getAttribute('aria-pressed'), 'true')
  const afterHover = await roles.nth(1).evaluate((button) => {
    const item = button.closest('li')
    const reveal = item.matches('[data-conductor-reveal]') ? item : item.querySelector('[data-conductor-reveal]')
    return { className: reveal.className, opacity: getComputedStyle(reveal).opacity }
  })
  assert.ok(Number(afterHover.opacity) > 0.99, `career card disappeared after hover: ${JSON.stringify({ beforeHover, afterHover })}`)
  if (viewport.width === 1536) {
    await career.screenshot({ path: 'C:/Users/seong/AppData/Local/Temp/conductor-career-hover.png' })
  }

  await roles.nth(2).focus()
  await page.waitForTimeout(80)
  assert.equal(await roles.nth(2).getAttribute('aria-pressed'), 'true')

  await roles.nth(0).click()
  assert.equal(await roles.nth(0).getAttribute('aria-pressed'), 'true')
  assert.deepEqual(errors, [])

  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    pressed: [...document.querySelectorAll('.conductor-profile__role-trigger')]
      .map((button) => button.getAttribute('aria-pressed')),
  }))
  assert.ok(metrics.overflow <= 1, `${viewport.width}px has ${metrics.overflow}px horizontal overflow`)

  await page.close()
  return metrics
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const results = []
  for (const viewport of [
    { width: 1536, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    results.push({ viewport, metrics: await auditViewport(browser, viewport) })
  }
  console.log(JSON.stringify(results, null, 2))
  await browser.close()
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
