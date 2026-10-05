import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  cacheDir: 'node_modules/.vite-hero-image-test',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const { HomeHeroSlideshow } = await vite.ssrLoadModule(
  '/src/components/home/HomeHeroSlideshow.tsx',
)
const { SampleLanguageContext } = await vite.ssrLoadModule(
  '/src/features/sample-language/useSampleLanguage.ts',
)
after(() => vite.close())

const originalUrl = 'https://example.supabase.co/storage/v1/object/public/site-images/hero/choir.jpg'
const firstSlide = {
  id: 'public-hero',
  title: 'CMS title',
  subtitle: 'CMS subtitle',
  description: 'CMS description',
  image_url: originalUrl,
  image_alt: 'CMS choir photo',
  primary_cta_label: 'CMS primary',
  primary_cta_href: '/join',
  secondary_cta_label: 'CMS secondary',
  secondary_cta_href: '/about',
  display_order: 1,
  is_visible: true,
}

function render(width, slides = [firstSlide], { coarse = false, height = 900, language = 'ko' } = {}) {
  const originalWindow = globalThis.window
  globalThis.window = {
    innerWidth: width,
    innerHeight: height,
    location: { pathname: '/' },
    matchMedia: query => ({ matches: query === '(pointer: coarse)' || query === '(any-pointer: coarse)' ? coarse : query === '(min-width: 1024px)' ? width >= 1024 : false }),
  }
  try {
    const languageContext = {
      enabled: true, isSample: false, language, setLanguage() {},
      translate: source => source, translateData: data => data, translateHome: data => data,
      href: href => href,
    }
    return renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(SampleLanguageContext, { value: languageContext },
        createElement(HomeHeroSlideshow, { slides })),
    ))
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
}

function heroImage(html) {
  return html.match(/<img\b[^>]*class="size-full object-cover object-center"[^>]*>/)?.[0] ?? ''
}

for (const width of [390, 519, 834, 1023, 1024, 1180, 1365]) {
  test(`${width}px hero uses the same CMS original without a width-only downsample`, () => {
    const image = heroImage(render(width))
    assert.ok(image.includes(`src="${originalUrl}"`), image)
    assert.doesNotMatch(image, /srcSet=|render\/image/)
    assert.match(image, /loading="eager"/)
    assert.match(image, /fetchPriority="high"/)
  })
}

test('1366px touch tablet keeps the original image and tablet composition', () => {
  const image = heroImage(render(1366, [firstSlide], { coarse: true, height: 1024 }))
  assert.ok(image.includes(`src="${originalUrl}"`), image)
  assert.doesNotMatch(image, /srcSet=|render\/image/)
})

for (const width of [1366, 1440]) {
  test(`${width}px hero retains the desktop responsive transform and image selection`, () => {
    const image = heroImage(render(width))
    assert.match(image, /sizes="100vw"/)
    assert.match(image, /render\/image\/public\/site-images\/hero\/choir.jpg\?width=3840&amp;quality=92&amp;resize=contain/)
    assert.match(image, /srcSet="[^\"]*960w[^\"]*3840w"/)
  })
}

test('original-image selection still filters hidden slides and does not eagerly render every slide', () => {
  const html = render(390, [
    { ...firstSlide, id: 'hidden', image_url: '/must-not-publish.jpg', display_order: 0, is_visible: false },
    firstSlide,
    { ...firstSlide, id: 'next', image_url: '/next-photo.jpg', display_order: 2 },
  ])
  assert.doesNotMatch(html, /must-not-publish.jpg|src="\/next-photo.jpg"/)
  assert.equal((html.match(/class="size-full object-cover object-center"/g) ?? []).length, 1)
  assert.match(html, /다음 Hero 슬라이드 보기/)
  assert.match(html, /이전 Hero 슬라이드 보기/)
})

test('tablet hero keeps an accessible playback control when multiple CMS slides are visible', () => {
  const html = render(1180, [firstSlide, { ...firstSlide, id: 'next', display_order: 2 }], { height: 820 })
  assert.match(html, /Hero 슬라이드 자동 재생 일시정지/)
  assert.match(html, /다음 Hero 슬라이드 보기/)
})

test('English hero tabs expose indexed English image names', () => {
  const html = render(390, [firstSlide, { ...firstSlide, id: 'next', display_order: 2 }], { language: 'en' })
  const names = [...html.matchAll(/<button aria-label="([^"]+)"[^>]*role="tab"/g)].map(match => match[1])
  assert.deepEqual(names, ['Show hero image 1', 'Show hero image 2'])
  names.forEach(name => assert.doesNotMatch(name, /[가-힣]/))
})

test('English hero offers an English pause action while autoplay is running', () => {
  const html = render(390, [firstSlide, { ...firstSlide, id: 'next', display_order: 2 }], { language: 'en' })
  assert.match(html, /aria-label="Pause hero slideshow autoplay"/)
})

test('Korean hero retains indexed image names and the default pause action', () => {
  const html = render(390, [firstSlide, { ...firstSlide, id: 'next', display_order: 2 }])
  assert.match(html, /aria-label="1번째 Hero 이미지 보기"/)
  assert.match(html, /aria-label="2번째 Hero 이미지 보기"/)
  assert.match(html, /aria-label="Hero 슬라이드 자동 재생 일시정지"/)
})

test('hero playback and image selection survive language changes without resetting state', { skip: !process.env.SMYC_PLAYWRIGHT_MODULE }, async () => {
  const entry = `
    import { createElement, useState } from 'react';
    import { createRoot } from 'react-dom/client';
    import { MemoryRouter } from 'react-router';
    import { HomeHeroSlideshow } from '/src/components/home/HomeHeroSlideshow.tsx';
    import { SampleLanguageContext } from '/src/features/sample-language/useSampleLanguage.ts';
    const slides = ${JSON.stringify([ { ...firstSlide, image_url: '' }, { ...firstSlide, id: 'next', image_url: '', display_order: 2 } ])};
    function Fixture() {
      const [language, setLanguage] = useState('en');
      const value = { enabled: true, isSample: false, language, setLanguage,
        translate: text => text, translateData: data => data, translateHome: data => data, href: href => href };
      return createElement(MemoryRouter, null, createElement(SampleLanguageContext, { value },
        createElement('button', { onClick: () => setLanguage(current => current === 'en' ? 'ko' : 'en') }, 'Switch fixture language'),
        createElement(HomeHeroSlideshow, { slides, intervalMs: 60000 })));
    }
    createRoot(document.getElementById('fixture')).render(createElement(Fixture));`
  const server = await createServer({
    root: process.cwd(), configFile: false, appType: 'custom', logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [{ name: 'offline-hero-controls-language-fixture', configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url !== '/__hero-controls-fixture') return next()
        try {
          const html = `<!doctype html><html><head><meta charset="utf-8"><title>Hero controls language fixture</title><style>.home-hero-controls button{min-width:44px;min-height:44px}</style></head><body><div id="fixture"></div><script type="module">${entry}</script></body></html>`
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.end(await server.transformIndexHtml(request.url, html))
        } catch (error) { next(error) }
      })
    } }],
  })
  let browser
  try {
    await server.listen()
    const { chromium } = await import(process.env.SMYC_PLAYWRIGHT_MODULE)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const origin = new URL(server.resolvedUrls.local[0]).origin
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
    await page.goto(`${origin}/__hero-controls-fixture`)
    await page.getByRole('tab').nth(1).click()
    const playback = page.locator('.home-hero-arrow-group button').first()
    await playback.click()
    assert.equal(await playback.getAttribute('aria-label'), 'Resume hero slideshow autoplay')
    assert.equal(await page.locator('.home-hero-autoplay-progress').getAttribute('data-paused'), 'true')
    assert.equal(await page.getByRole('tab', { name: 'Show hero image 2', exact: true }).getAttribute('aria-selected'), 'true')

    await page.getByRole('button', { name: 'Switch fixture language', exact: true }).click()
    assert.equal(await playback.getAttribute('aria-label'), 'Hero 슬라이드 자동 재생 시작')
    assert.equal(await page.getByRole('tab', { name: '2번째 Hero 이미지 보기', exact: true }).getAttribute('aria-selected'), 'true')
    assert.equal(await page.locator('.home-hero-autoplay-progress').getAttribute('data-paused'), 'true')

    await page.getByRole('button', { name: 'Switch fixture language', exact: true }).click()
    await page.getByRole('button', { name: 'Resume hero slideshow autoplay', exact: true }).click()
    assert.equal(await playback.getAttribute('aria-label'), 'Pause hero slideshow autoplay')
    assert.equal(await page.locator('.home-hero-autoplay-progress').getAttribute('data-paused'), 'false')
    assert.equal(await page.getByRole('tab', { name: 'Show hero image 2', exact: true }).getAttribute('aria-selected'), 'true')
    await page.locator('.home-hero-arrow-group button').last().click()
    assert.equal(await page.getByRole('tab', { name: 'Show hero image 1', exact: true }).getAttribute('aria-selected'), 'true')
    assert.deepEqual(errors, [])
  } finally {
    await browser?.close()
    await server.close()
  }
})
