import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const browserModule = process.env.SMYC_PLAYWRIGHT_MODULE
const root = fileURLToPath(new URL('../../', import.meta.url))
const fixturePath = '/__member-columns'
const archivePath = '/__member-archive'
const archiveEntry = '/__member-archive-entry.js'

const archiveRows = [
  { id: 'current-soprano', display_name: '가현단원', display_name_en: 'Current Soprano', part: 'soprano', group_type: 'staff', member_status: 'active', display_order: 0 },
  { id: 'current-bass', display_name: '나현단원', display_name_en: 'Current Bass', part: 'bass', group_type: 'university', member_status: 'active', display_order: 1 },
  ...Array.from({ length: 150 }, (_, index) => ({
    id: `former-${index}`, display_name: `단원 ${String(150 - index).padStart(3, '0')}`, display_name_en: `Member ${String(150 - index).padStart(3, '0')}`,
    part: ['soprano', 'alto', 'tenor', 'bass', 'accompanist', 'hidden'][index % 6], group_type: index % 2 ? 'staff' : 'hidden', member_status: 'alumni', display_order: index,
    name: 'PRIVATE ORIGINAL NAME', photo_url: '/PRIVATE-PHOTO.png',
  })),
]

function archiveModule() {
  return `import React from 'react'; import { createRoot } from 'react-dom/client';
    import { MembersArchiveExperience } from '/src/components/about/MembersArchiveExperience.tsx';
    import { SiteEditorContext } from '/src/components/site-editor/useSiteEditor.ts';
    import { SampleLanguageContext } from '/src/features/sample-language/useSampleLanguage.ts';
    import { translateEnglish } from '/src/features/sample-language/englishRegistry.ts';
    const params = new URLSearchParams(location.search), language = params.get('lang') ?? 'ko';
    const members = params.has('empty') ? [] : ${JSON.stringify(archiveRows)};
    const translate = (source, key) => language === 'en' ? translateEnglish(source, key) : source;
    const languageValue = { enabled: true, isSample: false, language, translate, setLanguage() {}, translateData: value => value, translateHome: value => value, href: value => value };
    const oldLabels = { 'members.status.all': '전체 단원', 'members.status.active': '현재 활동', 'members.status.alumni': '이전 활동' };
    const editorValue = { copy: (_page, key, fallback) => oldLabels[key] ?? translate(fallback, key), documents: {}, device: 'desktop', isPreview: false };
    document.documentElement.lang = language;
    createRoot(document.getElementById('root')).render(React.createElement(SampleLanguageContext.Provider, { value: languageValue },
      React.createElement(SiteEditorContext.Provider, { value: editorValue }, React.createElement(MembersArchiveExperience, { members }))));`
}

function fixture(status, count = 64, longName = false, language = 'ko') {
  const suffix = status === 'alumni' ? '--alumni' : ''
  const names = Array.from({ length: count }, (_, index) => longName && index === 0
    ? 'Alexandria-Catherine Montgomery-Wellington'
    : `Member ${String(index + 1).padStart(2, '0')}`)
  const list = `<ul class="members-archive__member-list${suffix ? ` members-archive__member-list${suffix}` : ''}">
    ${names.map(name => `<li class="members-archive__member"><div class="members-archive__member-copy"><strong>${name}</strong></div></li>`).join('')}
  </ul>`
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8">
    <link rel="stylesheet" href="/src/styles/members-archive.css">
    <style>html,body{margin:0}</style></head><body>
    <section class="members-archive"><div class="members-archive__directory"><div class="members-archive__directory-inner">
      ${status === 'alumni' ? list : `<div class="members-archive__groups"><section class="members-archive__group"><h3 class="members-archive__group-title">SOPRANO</h3>${list}</section></div>`}
    </div></div></section></body></html>`
}

// Offline layout fixture with the owning production CSS: never uses private
// records, Supabase, stored sessions, or another running application's port.
test('member names keep row-major reading order with more alumni columns', { skip: !browserModule }, async t => {
  const vite = await createServer({ root, configFile: false, appType: 'custom', logLevel: 'silent', server: { host: '127.0.0.1', port: 0 }, plugins: [{
    name: 'member-column-fixture', configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url, 'http://fixture.invalid')
        if (url.pathname === archivePath) {
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.end(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}</style></head><body><div id="root"></div><script type="module" src="${archiveEntry}"></script></body></html>`)
          return
        }
        if (url.pathname !== fixturePath) return next()
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(fixture(url.searchParams.get('status'), Number(url.searchParams.get('count') ?? 64), url.searchParams.has('long'), url.searchParams.get('lang') ?? 'ko'))
      })
    },
    resolveId(id) { if (id === archiveEntry) return id },
    load(id) { if (id === archiveEntry) return archiveModule() },
  }] })
  let browser
  try {
    await vite.listen()
    const { chromium } = await import(browserModule)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage({ reducedMotion: 'reduce' })
    const url = `${vite.resolvedUrls.local[0].replace(/\/$/, '')}${fixturePath}`
    for (const [width, normalColumns, alumniColumns] of [[320, 3, 3], [390, 3, 4], [768, 4, 8], [1024, 4, 11], [1440, 6, 15]]) {
      await page.setViewportSize({ width, height: 1000 })
      for (const [status, expectedColumns] of [['all', normalColumns], ['alumni', alumniColumns]]) {
        await t.test(`${width}px ${status}: left to right, then the next row`, async () => {
          await page.goto(`${url}?status=${status}`)
          await page.evaluate(() => document.fonts.ready)
          const layout = await page.locator('.members-archive__member-list').evaluate(list => ({
            columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
            bounds: list.getBoundingClientRect().toJSON(),
            availableWidth: list.parentElement.clientWidth - parseFloat(getComputedStyle(list.parentElement).paddingLeft) - parseFloat(getComputedStyle(list.parentElement).paddingRight),
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
          if (status === 'alumni') {
            assert.ok(Math.abs(layout.bounds.width - layout.availableWidth) < 1, 'alumni must use the full directory width')
            assert.ok(Math.abs(layout.items[expectedColumns - 1].right - layout.bounds.right) < 1, 'the last column must reach the right edge')
          }
          for (const item of layout.items) assert.equal(item.fragments, 1, 'a name must stay in one grid cell')
        })
      }
    }
    await page.setViewportSize({ width: 390, height: 1000 })
    for (const count of [1, 2, 5]) await t.test(`${count} members and a long name remain whole`, async () => {
      await page.goto(`${url}?status=alumni&count=${count}&long&lang=en`)
      await page.evaluate(() => document.fonts.ready)
      assert.equal(await page.locator('.members-archive__member').count(), count)
      assert.ok(await page.locator('.members-archive__member').first().evaluate(item => item.getClientRects().length === 1))
      assert.ok(await page.locator('strong').first().evaluate(name => name.scrollWidth <= name.clientWidth + 1))
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
    })
    for (const language of ['ko', 'en']) await t.test(`${language}: all-time names include current members, ignore part filters and preserve reading order`, async () => {
      await page.setViewportSize({ width: 1024, height: 1000 })
      await page.goto(`${vite.resolvedUrls.local[0]}${archivePath.slice(1)}?lang=${language}`)
      const status = page.locator('.members-archive__status-filters')
      const current = language === 'ko' ? '현단원' : 'Current members'
      const archive = language === 'ko' ? '역대단원' : 'All-time members'
      await status.getByRole('button', { name: current, exact: true }).waitFor()
      assert.equal(await status.getByRole('button').count(), 2)
      assert.equal(await page.locator('.members-archive__member').count(), 2)
      assert.equal(await status.getByRole('button', { name: current, exact: true }).getAttribute('aria-pressed'), 'true')
      await page.locator('.members-archive__part-filters').getByRole('button', { name: language === 'ko' ? '소프라노' : 'Soprano', exact: true }).click()
      assert.equal(await page.locator('.members-archive__member').count(), 1)
      await status.getByRole('button', { name: archive, exact: true }).click()
      assert.equal(await page.locator('.members-archive__member').count(), archiveRows.length)
      assert.equal(await page.locator('.members-archive__member-list').count(), 1)
      assert.equal(await page.locator('.members-archive__part-filters, .members-archive__group-title').count(), 0)
      const visibleNames = await page.locator('.members-archive__member strong').allTextContents()
      const expectedNames = [...archiveRows].sort((a, b) => a.display_name.localeCompare(b.display_name, 'ko-KR', { numeric: true })).map(row => language === 'ko' ? row.display_name : row.display_name_en)
      assert.deepEqual(visibleNames, expectedNames, 'current and former names must be in one global alphabetical list')
      assert.doesNotMatch(await page.locator('.members-archive__directory').innerText(), /PRIVATE ORIGINAL NAME|PART INDEX/)
      assert.doesNotMatch(await status.innerText(), /전체 단원|현재 활동|이전 활동/)
      assert.equal(await page.locator('.members-archive img').count(), 0)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
      await status.getByRole('button', { name: current, exact: true }).click()
      assert.equal(await page.locator('.members-archive__member').count(), 1, 'returning to current members retains their own part choice')
      assert.equal(await page.locator('.members-archive__part-filters').getByRole('button', { name: language === 'ko' ? '소프라노' : 'Soprano', exact: true }).getAttribute('aria-pressed'), 'true')
    })
    await t.test('an empty all-time archive hides parts and explains the empty state', async () => {
      await page.goto(`${vite.resolvedUrls.local[0]}${archivePath.slice(1)}?empty`)
      await page.getByRole('button', { name: '역대단원', exact: true }).click()
      assert.equal(await page.locator('.members-archive__member, .members-archive__part-filters').count(), 0)
      assert.match(await page.locator('.members-archive__empty').innerText(), /공개된 단원이 등록되면/)
    })
  } finally { await browser?.close(); await vite.close() }
})
