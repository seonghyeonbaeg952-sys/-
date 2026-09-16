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

function render(width, slides = [firstSlide]) {
  const originalWindow = globalThis.window
  globalThis.window = {
    location: { pathname: '/' },
    matchMedia: query => ({ matches: query === '(min-width: 1024px)' ? width >= 1024 : width >= 768 }),
  }
  try {
    return renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(HomeHeroSlideshow, { slides }),
    ))
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
}

function heroImage(html) {
  return html.match(/<img\b[^>]*class="size-full object-cover object-center"[^>]*>/)?.[0] ?? ''
}

for (const width of [390, 519, 834, 1023]) {
  test(`${width}px hero uses the same CMS original without a width-only downsample`, () => {
    const image = heroImage(render(width))
    assert.ok(image.includes(`src="${originalUrl}"`), image)
    assert.doesNotMatch(image, /srcSet=|render\/image/)
    assert.match(image, /loading="eager"/)
    assert.match(image, /fetchPriority="high"/)
  })
}

for (const width of [1024, 1440]) {
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
