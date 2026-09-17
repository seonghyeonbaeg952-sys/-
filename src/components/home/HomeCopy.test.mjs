import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-home-rich-copy-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { ResponsiveSupportLetter } = await vite.ssrLoadModule('/src/components/home/ResponsiveSupportLetter.tsx')
const { HomeDisplayTitleText } = await vite.ssrLoadModule('/src/components/home/HomeDisplayTitleText.tsx')
const { HomeCopy } = await vite.ssrLoadModule('/src/components/home/HomeCopy.tsx')
const { ScrollScoreBookReveal } = await vite.ssrLoadModule('/src/components/home/ScrollScoreBookReveal.tsx')
const { AboutPreview } = await vite.ssrLoadModule('/src/components/home/AboutPreview.tsx')
const { ResponsiveJoinInvitation } = await vite.ssrLoadModule('/src/components/home/ResponsiveAboutJoin.tsx')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')

function render(child, device, textStyles = {}) {
  const value = { copy: (_page, _key, fallback) => fallback, device, isPreview: false,
    documents: { home: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {}, textStyles } } }
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(SiteEditorContext.Provider, { value }, child)))
}

test('mobile support styles only the selected characters using the mobile field identity', () => {
  const content = { ...HOME_CONTENT_DEFAULTS_V2.supportLetter, responsiveTitle: '서로 함께 노래' }
  const child = createElement(ResponsiveSupportLetter, { content, viewport: 'mobile' })
  const html = render(child, 'mobile', { shared: {
    'home.mobile.supportLetter.responsiveTitle': { text: '서로 함께 노래', runs: [{ start: 3, end: 5, style: { fontSize: 31 } }] },
    'home.tablet.supportLetter.responsiveTitle': { text: '서로 함께 노래', runs: [{ start: 0, end: 2, style: { fontSize: 47 } }] },
  } })
  assert.match(html, /서로 <smyc-copy[^>]*font-size:31px[^>]*>함께<\/smyc-copy> 노래/)
  assert.doesNotMatch(html, /font-size:47px/)
})

test('selected range inside the second repeated title line preserves the existing accent element', () => {
  const child = createElement(HomeDisplayTitleText, { text: '함께 노래', fullText: '함께 노래\n함께 노래', offset: 6,
    sourceKey: 'home.current.about.title', accents: [{ role: 'emphasis', term: '노래' }] })
  const html = render(child, 'desktop', { shared: {
    'home.current.about.title': { text: '함께 노래\n함께 노래', runs: [{ start: 9, end: 11, style: { fontSize: 33 } }] },
  } })
  assert.match(html, /^함께 <span class="home-type-accent home-type-accent--emphasis"><smyc-text class="site-copy-text"><smyc-copy[^>]*font-size:33px[^>]*>노래<\/smyc-copy><\/smyc-text><\/span>$/)
})

test('unstyled title keeps the original literal text and accent DOM', () => {
  const child = createElement(HomeDisplayTitleText, { text: '함께 노래', sourceKey: 'home.current.about.title', accents: [{ role: 'emphasis', term: '노래' }] })
  assert.equal(render(child, 'desktop'), '함께 <span class="home-type-accent home-type-accent--emphasis">노래</span>')
})

test('desktop score retains plain accessibility text while formatting the second repeated line', () => {
  const content = { ...HOME_CONTENT_DEFAULTS_V2.scoreBook, eyebrowKo: '함께 노래', leftPage: { ...HOME_CONTENT_DEFAULTS_V2.scoreBook.leftPage, titleLines: ['함께 노래', '함께 노래'] } }
  const html = render(createElement(ScrollScoreBookReveal, { content }), 'desktop', { shared: {
    'home.scoreBook.leftPage.titleLines': { text: '함께 노래\n함께 노래', runs: [{ start: 6, end: 8, style: { fontSize: 35 } }] },
  } })
  assert.match(html, /<span>함께 노래<\/span><span><smyc-text class="site-copy-text"><smyc-copy[^>]*font-size:35px[^>]*>함께<\/smyc-copy> 노래<\/smyc-text><\/span>/)
  assert.match(html, /aria-label="함께 노래: 합창단 활동을 소개하는 악보 애니메이션"/)
})

test('portrait title selection uses original CRLF and trim offsets instead of finding the first repeated word', () => {
  const title = '  함께 노래 \r\n함께 노래'
  const html = render(createElement(AboutPreview, { presentation: 'collective-portrait', title }), 'desktop', { shared: {
    'home.current.about.title': { text: title, runs: [{ start: 13, end: 15, style: { fontSize: 39 } }] },
  } })
  const heading = html.match(/<h2 id="home-about-portrait-title">([\s\S]*?)<\/h2>/)?.[1]
  assert.ok(heading)
  assert.equal((heading.match(/font-size:39px/g) ?? []).length, 1)
  assert.match(heading, /^<span>함께 <span class="home-type-accent home-type-accent--emphasis">노래<\/span><\/span><span>함께 <span class="home-type-accent home-type-accent--emphasis"><smyc-text class="site-copy-text"><smyc-copy[^>]*font-size:39px[^>]*>노래<\/smyc-copy><\/smyc-text><\/span><\/span>$/)
})

test('about paragraph fields retain their identity and selected words through whitespace and paragraph normalization', () => {
  const paragraphs = ['  앞\t함께  노래  ', '두번째\n\n마지막 노래']
  const child = createElement(AboutPreview, { presentation: 'collective-portrait', summary: paragraphs.join('\n\n'), responsiveContent: { paragraphs } })
  const html = render(child, 'desktop', { shared: {
    'home.current.about.paragraphs.1': { text: paragraphs[0], runs: [{ start: 8, end: 10, style: { fontSize: 32 } }] },
    'home.current.about.paragraphs.2': { text: paragraphs[1], runs: [{ start: 9, end: 11, style: { fontSize: 36 } }] },
  } })
  assert.match(html, /앞 함께 <smyc-copy[^>]*font-size:32px[^>]*>노래<\/smyc-copy>/)
  assert.match(html, /마지막 <smyc-copy[^>]*font-size:36px[^>]*>노래<\/smyc-copy>/)
  assert.match(render(child, 'desktop'), /<span>앞 함께 노래<br\/><\/span><span>두번째<br\/><\/span><span>마지막 노래<\/span>/)
})

test('tablet join merged description applies each field style to its own explicit source slice', () => {
  const content = { ...HOME_CONTENT_DEFAULTS_V2.joinLetter, description: '같은 노래, 숨긴 안내', compactDescription: '같은 노래' }
  const child = createElement(ResponsiveJoinInvitation, { content, viewport: 'tablet', tabletDescription: '같은 노래,\n같은 노래', fallbackGuardianNotes: [], fallbackSteps: [] })
  const html = render(child, 'tablet', { shared: {
    'home.tablet.current.join.description': { text: content.description, runs: [{ start: 3, end: 5, style: { fontSize: 31 } }] },
    'home.tablet.current.join.compactDescription': { text: content.compactDescription, runs: [{ start: 0, end: 2, style: { fontSize: 42 } }] },
  } })
  assert.match(html, /같은 <smyc-copy[^>]*font-size:31px[^>]*>노래<\/smyc-copy>,\n<smyc-copy[^>]*font-size:42px[^>]*>같은<\/smyc-copy> 노래/)
  assert.match(render(child, 'tablet'), /<p class="responsive-join__description">같은 노래,\n같은 노래<\/p>/)
  assert.doesNotMatch(html, /숨긴 안내/)
})

test('normalized source ranges preserve one styled visible space and omit trimmed whitespace', () => {
  const source = ' \t함께\u00a0\u00a0노래  '
  const child = createElement(HomeCopy, { sourceKey: 'home.current.about.paragraphs.1', text: '함께 노래',
    parts: [{ sourceKey: 'home.current.about.paragraphs.1', text: source, collapseWhitespace: true }] })
  assert.match(render(child, 'desktop', { shared: {
    'home.current.about.paragraphs.1': { text: source, runs: [{ start: 0, end: source.length, style: { fontSize: 28 } }] },
  } }), /^<smyc-text class="site-copy-text"><smyc-copy[^>]*font-size:28px[^>]*>함께 노래<\/smyc-copy><\/smyc-text>$/)
})

test('a changed visible projection never guesses which source characters should receive styles', () => {
  const child = createElement(HomeCopy, { sourceKey: 'home.current.about.paragraphs.1', text: '다른 표시',
    parts: [{ sourceKey: 'home.current.about.paragraphs.1', text: '원문', collapseWhitespace: true }] })
  assert.equal(render(child, 'desktop', { shared: {
    'home.current.about.paragraphs.1': { text: '원문', runs: [{ start: 0, end: 2, style: { fontSize: 28 } }] },
  } }), '다른 표시')
})
