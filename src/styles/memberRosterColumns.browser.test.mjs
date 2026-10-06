import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const browserModule = process.env.SMYC_PLAYWRIGHT_MODULE
const root = fileURLToPath(new URL('../../', import.meta.url))
const fixturePath = '/__member-columns'

function fixture(status, count = 64, longName = false) {
  const suffix = status === 'alumni' ? '--alumni' : ''
  const names = Array.from({ length: count }, (_, index) => longName && index === 0
    ? 'Alexandria-Catherine Montgomery-Wellington'
    : `Member ${String(index + 1).padStart(2, '0')}`)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/src/styles/members-archive.css">
    <style>html,body{margin:0}</style></head><body>
    <section class="members-archive"><div class="members-archive__directory"><div class="members-archive__directory-inner">
      <div class="members-archive__groups${suffix ? ` members-archive__groups${suffix}` : ''}">
        <section class="members-archive__group"><h3 class="members-archive__group-title">SOPRANO</h3>
          <ul class="members-archive__member-list${suffix ? ` members-archive__member-list${suffix}` : ''}">
            ${names.map(name => `<li class="members-archive__member"><div class="members-archive__member-copy"><strong>${name}</strong></div></li>`).join('')}
          </ul>
        </section>
      </div>
    </div></div></section></body></html>`
}

// Offline layout fixture with the owning production CSS: never uses private
// records, Supabase, stored sessions, or another running application's port.
test('member names keep row-major reading order with more alumni columns', { skip: !browserModule }, async t => {
  const vite = await createServer({ root, configFile: false, appType: 'custom', logLevel: 'silent', server: { host: '127.0.0.1', port: 0 }, plugins: [{
    name: 'member-column-fixture', configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url, 'http://fixture.invalid')
        if (url.pathname !== fixturePath) return next()
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(fixture(url.searchParams.get('status'), Number(url.searchParams.get('count') ?? 64), url.searchParams.has('long')))
      })
    },
  }] })
  let browser
  try {
    await vite.listen()
    const { chromium } = await import(browserModule)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage({ reducedMotion: 'reduce' })
    const url = `${vite.resolvedUrls.local[0].replace(/\/$/, '')}${fixturePath}`
    for (const [width, normalColumns, alumniColumns] of [[320, 3, 4], [390, 3, 4], [768, 4, 6], [1440, 6, 8]]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const [status, expectedColumns] of [['all', normalColumns], ['alumni', alumniColumns]]) {
        await t.test(`${width}px ${status}: left to right, then the next row`, async () => {
          await page.goto(`${url}?status=${status}`)
          await page.evaluate(() => document.fonts.ready)
          const layout = await page.locator('.members-archive__member-list').evaluate(list => ({
            columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
            items: [...list.children].map(item => ({ text: item.textContent, ...item.getBoundingClientRect().toJSON(), fragments: item.getClientRects().length })),
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          }))
          assert.equal(layout.columns, expectedColumns)
          assert.equal(layout.items.length, 64)
          assert.equal(new Set(layout.items.map(item => item.text)).size, 64)
          assert.equal(layout.items[0].top, layout.items[1].top)
          assert.ok(layout.items[1].left > layout.items[0].left)
          assert.ok(layout.items[expectedColumns].top > layout.items[0].top)
          assert.equal(new Set(layout.items.map(item => Math.round(item.left))).size, expectedColumns)
          assert.equal(layout.overflow, false)
          for (const item of layout.items) assert.equal(item.fragments, 1, 'a name must stay in one grid cell')
        })
      }
    }
    await page.setViewportSize({ width: 390, height: 1000 })
    for (const count of [1, 2, 5]) await t.test(`${count} members and a long name remain whole`, async () => {
      await page.goto(`${url}?status=alumni&count=${count}&long`)
      await page.evaluate(() => document.fonts.ready)
      assert.equal(await page.locator('.members-archive__member').count(), count)
      assert.ok(await page.locator('.members-archive__member').first().evaluate(item => item.getClientRects().length === 1))
      assert.ok(await page.locator('strong').first().evaluate(name => name.scrollWidth <= name.clientWidth + 1))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
    })
  } finally { await browser?.close(); await vite.close() }
})
