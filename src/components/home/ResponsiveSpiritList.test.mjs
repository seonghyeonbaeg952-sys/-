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
const { resolveHomeContentForDevice, getHomeEditorFields } = await vite.ssrLoadModule('/src/lib/homeDeviceContent.ts')
const { resolveEnglishHomeCopy } = await vite.ssrLoadModule('/src/features/sample-language/sampleEnglishCopy.ts')
const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')

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
  responsiveLabel1: '편집한 합창단 정신',
  responsiveLabel2: '편집한 연혁',
  responsiveLabel3: '편집한 공동체',
  responsiveLabel4: '편집한 입단과 후원',
  responsiveLabel5: '이전 다섯째 항목',
}

function renderAtWidth(width, content = wrapper) {
  const originalWindow = globalThis.window
  globalThis.window = {
    innerWidth: width,
    innerHeight: 900,
    matchMedia() {
      return {
        matches: false,
      }
    },
  }

  try {
    return renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(HomeSpiritChorusOrbit, { sections: [], wrapper: content }),
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

for (const width of [390, 834, 1023, 1024]) {
  test(`${width}px에서는 CMS 반응형 문구와 네 정신 구간을 표시한다`, () => {
    const markup = renderAtWidth(width)

    assert.ok(markup.includes('편집한 반응형 상단 문구'))
    assert.ok(markup.includes('편집한 첫 줄\n편집한 둘째 줄'))
    assert.ok(markup.includes('편집한 소개 첫 줄\n편집한 소개 둘째 줄'))
    assert.ok(markup.includes('편집한 정신 자세히'))
    assert.equal(markup.match(/<li\b/g)?.length, 4)
    for (const label of [
      '편집한 합창단 정신',
      '편집한 연혁',
      '편집한 공동체',
      '편집한 입단과 후원',
    ]) {
      assert.ok(markup.includes(label), label)
    }
    assert.ok(!markup.includes('이전 다섯째 항목'))
    assert.match(markup, /href="\/spirit"/)
    assert.equal(markup.match(/<a\b/g)?.length, 1)
    assert.doesNotMatch(markup, /<video\b|role="tablist"|role="tabpanel"/)
    assert.ok(!markup.includes('데스크톱 첫 줄'))
  })
}

for (const [device, width] of [['mobile', 390], ['tablet', 834]]) {
  test(`${device} shows the Spirit page order in Korean and English`, () => {
    const retiredKey = `home.${device}.spiritWrapper.responsiveLabel5`
    const korean = resolveHomeContentForDevice({ [retiredKey]: '이전 다섯째 항목' }, device)
    const english = resolveEnglishHomeCopy(korean, {}, device, translateEnglish)
    assert.ok(!getHomeEditorFields(device).some(({ key }) => key === retiredKey))

    function listLabels(html) {
      return [...html.matchAll(/<li\b[^>]*>[\s\S]*?<\/span><span>([^<]+)<\/span><\/li>/g)].map(match => match[1])
    }
    assert.deepEqual(listLabels(renderAtWidth(width, korean.spiritWrapper)), ['합창단 정신', '이어 온 정신과 연혁', '함께 부르는 공동체', '입단과 후원'])
    assert.deepEqual(listLabels(renderAtWidth(width, english.spiritWrapper)), ['Our Spirit', 'Our Heritage', 'A community of voices', 'Joining and support'])
  })
}

for (const width of [1440]) {
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
    assert.ok(!markup.includes('편집한 합창단 정신'))
  })
}
