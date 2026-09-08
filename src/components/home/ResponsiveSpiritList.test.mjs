import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  cacheDir: 'node_modules/.vite-concert-spirit-test',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const { HomeSpiritChorusOrbit } = await vite.ssrLoadModule(
  '/src/components/home/HomeSpiritChorusOrbit.tsx',
)
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule(
  '/src/constants/homeContentV2.ts',
)

after(async () => {
  await vite.close()
})

const wrapper = {
  ...HOME_CONTENT_DEFAULTS_V2.spiritWrapper,
  orbitEyebrow: '데스크톱 전용 상단 문구',
  orbitHeadline: '데스크톱 첫 줄\n데스크톱 둘째 줄',
  ctaLabel: '데스크톱 자세히',
  responsiveEyebrow: '편집한 반응형 상단 문구',
  responsiveTitle: '편집한 첫 줄\n편집한 둘째 줄',
  responsiveDescription: '편집한 소개 첫 줄\n편집한 소개 둘째 줄',
  responsiveCtaLabel: '편집한 정신 자세히',
  responsiveLabel1: '편집한 이름',
  responsiveLabel2: '편집한 정직한 음악',
  responsiveLabel3: '편집한 교회음악',
  responsiveLabel4: '편집한 공동체',
  responsiveLabel5: '편집한 다음 세대',
}

function renderAtWidth(width) {
  const originalWindow = globalThis.window
  globalThis.window = {
    matchMedia(query) {
      return {
        matches: query === '(min-width: 1024px)' && width >= 1024,
      }
    },
  }

  try {
    return renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(HomeSpiritChorusOrbit, { sections: [], wrapper }),
      ),
    )
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = originalWindow
    }
  }
}

for (const width of [390, 834, 1023]) {
  test(`${width}px에서는 CMS 반응형 문구와 다섯 정신을 함께 표시한다`, () => {
    const markup = renderAtWidth(width)

    assert.ok(markup.includes('편집한 반응형 상단 문구'))
    assert.ok(markup.includes('편집한 첫 줄\n편집한 둘째 줄'))
    assert.ok(markup.includes('편집한 소개 첫 줄\n편집한 소개 둘째 줄'))
    assert.ok(markup.includes('편집한 정신 자세히'))
    assert.equal(markup.match(/<li\b/g)?.length, 5)
    for (const label of [
      '편집한 이름',
      '편집한 정직한 음악',
      '편집한 교회음악',
      '편집한 공동체',
      '편집한 다음 세대',
    ]) {
      assert.ok(markup.includes(label), label)
    }
    assert.match(markup, /href="\/spirit"/)
    assert.equal(markup.match(/<a\b/g)?.length, 1)
    assert.doesNotMatch(markup, /<video\b|role="tablist"|role="tabpanel"/)
    assert.ok(!markup.includes('데스크톱 첫 줄'))
  })
}

for (const width of [1024, 1440]) {
  test(`${width}px에서는 반응형 CMS 변경이 기존 영상과 원형 정신 표현에 영향을 주지 않는다`, () => {
    const markup = renderAtWidth(width)

    assert.ok(markup.includes('데스크톱 전용 상단 문구'))
    assert.ok(markup.includes('데스크톱 첫 줄'))
    assert.ok(markup.includes('데스크톱 둘째 줄'))
    assert.ok(markup.includes('데스크톱 자세히'))
    assert.match(markup, /<video\b/)
    assert.equal(markup.match(/<button\b/g)?.length, 5)
    assert.equal(markup.match(/aria-controls="home-spirit-chorus-orbit-detail"/g)?.length, 5)
    assert.ok(!markup.includes('편집한 첫 줄'))
    assert.ok(!markup.includes('편집한 이름'))
  })
}
