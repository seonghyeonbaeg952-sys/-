import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
// Static SSR assertions do not need HMR. Avoid watching unrelated OneDrive
// reference artifacts, which can raise native fs.watch UNKNOWN errors.
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true, watch: null } })
const { SiteImage } = await vite.ssrLoadModule('/src/features/site-photos/SiteImage.tsx')
const { SitePhotosContext } = await vite.ssrLoadModule('/src/features/site-photos/useSitePhoto.ts')
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
after(async () => { await vite.close() })
test('static photo markup tests do not watch unrelated workspace artifacts', () => {
  assert.equal(Object.keys(vite.watcher.getWatched()).length, 0)
})
test('without a published replacement the image boundary preserves the original DOM byte-for-byte', () => {
  const props = { alt: 'Choir', lang: 'en', decoding: 'async', fetchPriority: 'high', className: 'portrait', src: '/images/about/smyc-europe-2018.webp', width: 640 }
  assert.equal(renderToStaticMarkup(React.createElement(SiteImage, props)), renderToStaticMarkup(React.createElement('img', props)))
})
test('published replacements change the photo and correct-language description without changing class or dimensions', () => {
  const value = { src: 'https://example.com/public.webp', altKo: '공개된 합창단 사진', altEn: 'Published choir photograph', positionX: 25, positionY: 40 }
  const language = { enabled: true, isSample: false, language: 'en', setLanguage() {}, translate: text => text, translateData: data => data, translateHome: data => data, href: href => href }
  const image = React.createElement(SiteImage, { src: '/images/about/smyc-europe-2018.webp', alt: 'Original choir photo', className: 'portrait', width: 640 })
  const html = renderToStaticMarkup(React.createElement(SampleLanguageContext.Provider, { value: language }, React.createElement(SitePhotosContext.Provider, { value: { 'about-europe': { published: value, draft: { ...value, src: 'https://example.com/private-draft.webp' } } } }, image)))
  assert.match(html, /src="https:\/\/example.com\/public.webp"/)
  assert.match(html, /alt="Published choir photograph"/)
  assert.match(html, /class="portrait"/)
  assert.match(html, /width="640"/)
  assert.match(html, /object-position:25% 40%/)
  assert.doesNotMatch(html, /private-draft/)
})
