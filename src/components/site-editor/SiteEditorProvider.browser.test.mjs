import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPublicationFixtureServer } from './siteEditorProvider.browser-fixture.mjs'

const browserModule = process.env.SMYC_PLAYWRIGHT_MODULE
test('first English publication loading preserves an unsent enquiry through cancellation and completion', { skip: !browserModule }, async () => {
  const vite = await createPublicationFixtureServer()
  let browser
  try {
    const { chromium } = await import(browserModule)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage()
    await page.goto(`${vite.resolvedUrls.local[0]}__publication-test`)
    const subject = page.locator('#contact-title')
    await subject.fill('Unsent regression draft')
    await page.getByRole('button', { name: 'English fixture', exact: true }).click()
    await page.getByRole('status').waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Korean fixture', exact: true }).click()
    await subject.waitFor({ state: 'visible' })
    assert.equal(await subject.inputValue(), 'Unsent regression draft')
    await page.getByRole('button', { name: 'English fixture', exact: true }).click()
    await page.getByRole('status').waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Finish English publication', exact: true }).click()
    await subject.waitFor({ state: 'visible' })
    assert.equal(await subject.inputValue(), 'Unsent regression draft')
    assert.equal(await page.locator('vite-error-overlay').count(), 0)
  } finally { await browser?.close(); await vite.close() }
})
