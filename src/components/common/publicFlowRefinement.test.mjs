import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const vite = await createServer({ root, configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true }, cacheDir: 'node_modules/.vite-public-flow-refinement-test' })
after(() => vite.close())
const { ContactInquiryForm } = await vite.ssrLoadModule('/src/components/contact/ContactInquiryForm.tsx')
const { JoinApplicationForm } = await vite.ssrLoadModule('/src/components/join/JoinApplicationForm.tsx')
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
const { publicLanguageHref } = await vite.ssrLoadModule('/src/features/sample-language/sampleLanguageModel.ts')
const { filterSelectPosition } = await vite.ssrLoadModule('/src/components/common/filterSelectPosition.ts')

// Static render: effects/submission handlers are never run and no real API
// requests or user data are needed to inspect these navigation destinations.
function render(component, props, language, entry) {
  const value = {
    enabled: true, isSample: false, language, setLanguage() {},
    translate: source => source, translateData: data => data, translateHome: data => data,
    href: href => publicLanguageHref(href, language, false),
  }
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [entry] },
    React.createElement(SampleLanguageContext, { value }, React.createElement(component, props))))
}

function hrefOf(html, className) {
  const href = html.match(new RegExp(`<a[^>]*class="${className}"[^>]*href="([^"]*)"`))?.[1]
  assert.ok(href, `Missing rendered ${className} link`)
  return href.replaceAll('&amp;', '&')
}

async function createComponentFixture(entry, body, style) {
  return createServer({
    root, configFile: false, appType: 'custom', logLevel: 'silent', server: { host: '127.0.0.1', port: 0 },
    plugins: [{ name: 'offline-public-component-fixture', configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url !== '/__component-fixture') return next()
        try {
          const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>*,*::before,*::after{box-sizing:border-box}body{margin:0}${style}</style></head><body>${body}<script type="module">${entry}</script></body></html>`
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.end(await server.transformIndexHtml(request.url, html))
        } catch (error) { next(error) }
      })
    } }],
  })
}

test('the contact membership action preserves English, section and application hash', () => {
  const html = render(ContactInquiryForm, { initialType: 'general' }, 'en', '/contact?lang=en#form')
  assert.equal(hrefOf(html, 'contact-atelier__action'), '/join?section=contact&lang=en#application')
})

test('the Korean contact membership action retains its original destination', () => {
  const html = render(ContactInquiryForm, { initialType: 'general' }, 'ko', '/contact#form')
  assert.equal(hrefOf(html, 'contact-atelier__action'), '/join?section=contact#application')
})

test('the explicit application return goes to the guide heading, not the previous form offset', () => {
  const joinInfo = { id: 'offline-fixture', title: '입단', recruitment_status: 'always', is_visible: true }
  for (const language of ['ko', 'en']) {
    const html = render(JoinApplicationForm, { joinInfo }, language, `/join?section=contact&lang=${language}#application`)
    const href = hrefOf(html, 'join-application__secondary')
    assert.equal(href, publicLanguageHref('/join#join-guide-title', language, false))
  }
})

test('menu bounds handle a fixed header, ample space, CSS zoom and a short viewport', () => {
  const above = filterSelectPosition({ triggerTop: 217, triggerBottom: 270, viewportTop: 73, viewportBottom: 390, optionCount: 4 })
  assert.deepEqual(above, { opensAbove: true, maxHeight: 128 })
  const below = filterSelectPosition({ triggerTop: 217, triggerBottom: 270, viewportTop: 73, viewportBottom: 900, optionCount: 4 })
  assert.equal(below.opensAbove, false)
  assert.equal(below.maxHeight, 340, 'Custom taller option rows must not be capped to the minimum option-height estimate')
  const zoomed = filterSelectPosition({ triggerTop: 217, triggerBottom: 270, viewportTop: 73, viewportBottom: 390, optionCount: 4, scale: 0.8, gap: 6.4 })
  assert.equal(zoomed.opensAbove, true)
  assert.ok(217 - 6.4 - zoomed.maxHeight * 0.8 >= 73 + 6.4 - 0.001)
  const short = filterSelectPosition({ triggerTop: 90, triggerBottom: 140, viewportTop: 73, viewportBottom: 150, optionCount: 4 })
  assert.ok(short.maxHeight >= 0)
  const invalidScale = filterSelectPosition({ triggerTop: 217, triggerBottom: 270, viewportTop: 73, viewportBottom: 390, optionCount: 4, scale: 0 })
  assert.deepEqual(invalidScale, above)
})

test('an above-opening landscape enquiry menu stays below the fixed header and restores focus on Escape', { skip: !process.env.SMYC_PLAYWRIGHT_MODULE }, async () => {
  const entry = `import { createElement, useState } from 'react'; import { createRoot } from 'react-dom/client'; import { FilterSelect } from '/src/components/common/FilterSelect.tsx'; function Fixture() { const [value, setValue] = useState('join'); return createElement(FilterSelect, {label:'Inquiry type', value, onChange:setValue, options:[{value:'general',label:'General enquiry'},{value:'join',label:'Joining enquiry'},{value:'performance',label:'Performance enquiry'},{value:'support',label:'Support enquiry'}]}); } createRoot(document.getElementById('fixture')).render(createElement(Fixture));`
  const server = await createComponentFixture(entry, '<header>Public navigation fixture</header><div id="fixture"></div>', 'header{position:fixed;top:0;left:0;right:0;height:73px;z-index:100;background:white}#fixture{position:absolute;top:217px;left:40px;width:320px}')
  let browser
  try {
    await server.listen()
    const { chromium } = await import(process.env.SMYC_PLAYWRIGHT_MODULE)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } })
    await page.goto(`${server.resolvedUrls.local[0].replace(/\/$/, '')}/__component-fixture`)
    const trigger = page.getByRole('button', { name: 'Inquiry type: Joining enquiry', exact: true })
    await trigger.click()
    const option = page.getByRole('button', { name: 'General enquiry', exact: true })
    const visibleBounds = await page.evaluate(() => ({ headerBottom: document.querySelector('header').getBoundingClientRect().bottom, menuTop: document.querySelector('.filter-select__options').getBoundingClientRect().top, optionTop: document.querySelector('.filter-select__options button').getBoundingClientRect().top }))
    assert.ok(visibleBounds.menuTop >= visibleBounds.headerBottom + 8, 'The popup must use the uncovered viewport, not the area behind the fixed header')
    assert.ok(visibleBounds.optionTop >= visibleBounds.headerBottom, 'The first enquiry option must remain visible')
    await option.click()
    await page.getByRole('button', { name: 'Inquiry type: General enquiry', exact: true }).click()
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.filter-select__options').count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Inquiry type: General enquiry', exact: true }).evaluate(element => document.activeElement === element), true)
  } finally {
    await browser?.close()
    await server.close()
  }
})

for (const copy of [
  { language: 'en', label: 'Inquiry type', selected: 'General enquiry', next: 'Joining enquiry' },
  { language: 'ko', label: '문의 유형', selected: '일반 문의', next: '입단 문의' },
]) {
  test(`${copy.language} filter group reuses the localized label while keyboard selection and Escape keep working`, { skip: !process.env.SMYC_PLAYWRIGHT_MODULE }, async () => {
    const entry = `import { createElement, useState } from 'react'; import { createRoot } from 'react-dom/client'; import { FilterSelect } from '/src/components/common/FilterSelect.tsx'; function Fixture() { const [value, setValue] = useState('general'); return createElement(FilterSelect, { label: ${JSON.stringify(copy.label)}, value, onChange: setValue, options: [{ value: 'general', label: ${JSON.stringify(copy.selected)} }, { value: 'join', label: ${JSON.stringify(copy.next)} }] }); } createRoot(document.getElementById('fixture')).render(createElement(Fixture));`
    const server = await createComponentFixture(entry, '<div id="fixture"></div>', '#fixture{margin:80px 24px;width:280px}')
    let browser
    try {
      await server.listen()
      const { chromium } = await import(process.env.SMYC_PLAYWRIGHT_MODULE)
      browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${server.resolvedUrls.local[0].replace(/\/$/, '')}/__component-fixture`)
      const trigger = page.getByRole('button', { name: `${copy.label}: ${copy.selected}`, exact: true })
      await trigger.focus()
      await trigger.press('Space')
      const group = page.getByRole('group')
      assert.equal(await group.getAttribute('aria-label'), copy.label)
      if (copy.language === 'en') assert.doesNotMatch(await group.getAttribute('aria-label'), /[가-힣]/)
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true')
      assert.equal(await page.getByRole('button', { name: copy.selected, exact: true }).evaluate(element => element === document.activeElement), true)
      await page.keyboard.press('ArrowDown')
      assert.equal(await page.getByRole('button', { name: copy.next, exact: true }).evaluate(element => element === document.activeElement), true)
      await page.keyboard.press('Escape')
      assert.equal(await group.count(), 0)
      assert.equal(await trigger.evaluate(element => element === document.activeElement), true)
      await trigger.press('Space')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      assert.equal(await page.getByRole('button', { name: `${copy.label}: ${copy.next}`, exact: true }).getAttribute('aria-expanded'), 'false')
      assert.deepEqual(errors, [])
    } finally {
      await browser?.close()
      await server.close()
    }
  })
}

test('Escape from a pinned desktop flyout restores its opener once without reopening another menu', { skip: !process.env.SMYC_PLAYWRIGHT_MODULE }, async () => {
  const entry = `import {createElement} from 'react'; import {createRoot} from 'react-dom/client'; import {MemoryRouter} from 'react-router'; import {HomeV4SampleHeader} from '/src/components/sample/home-v4/HomeV4SampleHeader.tsx'; createRoot(document.getElementById('fixture')).render(createElement(MemoryRouter, null, createElement(HomeV4SampleHeader, {mode:'production',transparentAtTop:false})));`
  const server = await createComponentFixture(entry, '<div id="fixture" class="public-shell"></div>', '')
  let browser
  try {
    await server.listen()
    const { chromium } = await import(process.env.SMYC_PLAYWRIGHT_MODULE)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const localOrigin = new URL(server.resolvedUrls.local[0]).origin
    await page.route('**/*', route => new URL(route.request().url()).origin === localOrigin ? route.continue() : route.abort())
    await page.goto(`${localOrigin}/__component-fixture`)
    const opener = page.getByRole('button', { name: '공연·소식', exact: true })
    await opener.focus()
    await opener.press('Enter')
    await page.waitForFunction(() => document.querySelector('header')?.getAttribute('data-desktop-menu-pinned') === 'true')
    await page.getByRole('button', { name: '후원·문의', exact: true }).focus()
    await page.locator('#home-v4-desktop-mega-menu a').first().focus()
    await page.keyboard.press('Escape')
    await page.waitForFunction(element => document.activeElement === element, await opener.elementHandle(), { timeout: 5000 })
    assert.equal(await page.locator('#home-v4-desktop-mega-menu').count(), 0, 'One Escape must close the flyout without reopening it from restored focus')
    assert.equal(await opener.getAttribute('aria-expanded'), 'false')
  } finally {
    await browser?.close()
    await server.close()
  }
})
