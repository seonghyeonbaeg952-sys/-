import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  cacheDir: 'node_modules/.vite-orbit-motion-test',
  configFile: false,
  logLevel: 'silent',
  server: { middlewareMode: true },
})
after(() => vite.close())
const { HomeSpiritChorusOrbit } = await vite.ssrLoadModule('/src/components/home/HomeSpiritChorusOrbit.tsx')
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')

function renderHeadline(text, { formatted = false, preview = false, reducedMotion = false } = {}) {
  const originalWindow = globalThis.window
  globalThis.window = {
    innerWidth: 1440,
    innerHeight: 900,
    matchMedia: query => ({ matches: query === '(min-width: 1024px)' || (reducedMotion && query === '(prefers-reduced-motion: reduce)') }),
  }
  const textStyles = formatted ? { shared: {
    'home.spiritWrapper.orbitHeadline': { text, runs: [{ start: 0, end: text.length, style: { fontSize: 40 } }] },
  } } : {}
  const value = {
    copy: (_page, _key, fallback) => fallback,
    device: 'desktop',
    isPreview: preview,
    documents: { home: { schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {}, textStyles } },
    ...(preview ? { canvas: { register: () => () => {}, subscribe: () => () => {}, getActiveId: () => null } } : {}),
  }
  try {
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
      React.createElement(SiteEditorContext, { value },
        React.createElement(HomeSpiritChorusOrbit, {
          sections: [], wrapper: { ...HOME_CONTENT_DEFAULTS_V2.spiritWrapper, orbitHeadline: text },
        }))))
    const heading = html.match(/<h2\b[^>]*id="home-spirit-chorus-orbit-heading"[^>]*>([\s\S]*?)<\/h2>/)?.[1]
    assert.ok(heading, 'The real desktop component must render its headline')
    const lines = [...heading.matchAll(/<span\b([^>]*)>([\s\S]*?)<\/span>/g)].map(match => ({
      text: match[2].replace(/<[^>]*>/g, ''),
      delay: match[1].match(/--orbit-line-delay:([\d.]+)ms/)?.[1],
    }))
    return { html, heading, lines }
  } finally {
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  }
}

// A fourth or later line reverting to zero delay must fail these consumer tests.
for (const { name, text, words, delays } of [
  { name: 'one line', text: '함께 노래합니다', words: ['함께 노래합니다'], delays: ['940'] },
  { name: 'original three lines', text: '정직한 음악을\n함께 부르고\n다음 세대에 전합니다',
    words: ['정직한 음악을', '함께 부르고', '다음 세대에 전합니다'], delays: ['940', '1080', '1220'] },
  { name: 'reported four-line Korean copy', text: '함께 듣고 노래하며,\n작품의 깊이와\n공동체의 가치를\n다음 세대에 이어갑니다.',
    words: ['함께 듣고 노래하며,', '작품의 깊이와', '공동체의 가치를', '다음 세대에 이어갑니다.'],
    delays: ['940', '1080', '1220', '1360'] },
  { name: 'six lines after another CMS edit', text: '첫 줄\n둘째 줄\n셋째 줄\n넷째 줄\n다섯째 줄\n여섯째 줄',
    words: ['첫 줄', '둘째 줄', '셋째 줄', '넷째 줄', '다섯째 줄', '여섯째 줄'],
    delays: ['940', '1080', '1220', '1360', '1500', '1640'] },
  { name: 'blank lines and CRLF do not create empty animation steps', text: '\r\n  첫 줄 \r\n\r\n둘째 줄\n 셋째 줄 \n넷째 줄\n',
    words: ['첫 줄', '둘째 줄', '셋째 줄', '넷째 줄'], delays: ['940', '1080', '1220', '1360'] },
]) {
  test(`${name}: every rendered line gets its ordered reveal delay`, () => {
    const { lines } = renderHeadline(text)
    assert.deepEqual(lines.map(line => line.text), words)
    assert.deepEqual(lines.map(line => line.delay), delays)
  })
}

for (const preview of [false, true]) {
  test(`formatted ${preview ? 'CMS preview' : 'public'} copy retains its font sizes and line order`, () => {
    const { heading, lines } = renderHeadline('첫 줄\n둘째 줄\n셋째 줄\n넷째 줄', { formatted: true, preview })
    assert.equal((heading.match(/font-size:40px/g) ?? []).length, 4)
    assert.deepEqual(lines.map(line => line.delay), ['940', '1080', '1220', '1360'])
  })
}

test('reduced-motion visitors still start with the complete text available', () => {
  const { html, lines } = renderHeadline('첫 줄\n둘째 줄\n셋째 줄\n넷째 줄', { reducedMotion: true })
  assert.match(html, /data-orbit-motion="entered"/)
  assert.deepEqual(lines.map(line => line.text), ['첫 줄', '둘째 줄', '셋째 줄', '넷째 줄'])
})
