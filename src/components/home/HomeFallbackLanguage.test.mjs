import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', cacheDir: 'node_modules/.vite-home-fallback-language-test', server: { middlewareMode: true } })
after(() => vite.close())
const load = path => vite.ssrLoadModule(`/src/${path}`)
const { JoinOpenScoreCTA } = await load('components/home/JoinOpenScoreCTA.tsx')
const { HomeSpiritChorusOrbit } = await load('components/home/HomeSpiritChorusOrbit.tsx')
const { SupportLetterFold } = await load('components/home/SupportLetterFold.tsx')
const { SampleLanguageContext } = await load('features/sample-language/useSampleLanguage.ts')
const { SiteEditorContext } = await load('components/site-editor/useSiteEditor.ts')
const { translateEnglish } = await load('features/sample-language/englishRegistry.ts')
const { mapHomeContentCopy, resolveHomeEditorContent } = await load('lib/homeEditorOverrides.ts')

function render(Component, props, english) {
  const previousWindow = globalThis.window
  globalThis.window = {
    location: { pathname: english ? '/sample/' : '/' },
    matchMedia: query => ({ matches: query === '(min-width: 1024px)' }),
  }
  const translate = english ? translateEnglish : source => source
  const original = resolveHomeEditorContent({}, {}, 'desktop')
  const content = english ? mapHomeContentCopy(original, 'desktop', (_key, sourceKey, value) => translate(value, sourceKey)) : original
  const language = { enabled: english, language: english ? 'en' : 'ko', translate, translateData: value => value, translateHome: value => value, href: href => href, setLanguage() {} }
  const editor = { copy: (_page, key, fallback) => translate(fallback, key), documents: {}, device: 'desktop', isPreview: false }
  try {
    return renderToStaticMarkup(createElement(MemoryRouter, null,
      createElement(SampleLanguageContext, { value: language },
        createElement(SiteEditorContext, { value: editor }, createElement(Component, props(content))))))
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
}

const elementSequence = html => html.match(/<\/?[a-z][a-z0-9-]*(?=[\s/>])/g)

test('join score translates inline facts and guardian defaults without changing its object markup', () => {
  const props = content => ({ presentation: 'figma-open-score', content: content.joinLetter })
  const original = render(JoinOpenScoreCTA, props, false)
  const english = render(JoinOpenScoreCTA, props, true)
  for (const source of ['유소년반 · 청소년반 · 대학부', '일정·장소는 입단 안내에서 확인', '지원 후 보호자 연락처로 안내', '보호자 연락으로 일정 안내', '사진·개인정보 동의는 별도']) {
    assert.ok(original.includes(source), source)
    assert.ok(!english.includes(source), source)
    assert.ok(english.includes(translateEnglish(source)), source)
  }
  assert.deepEqual(elementSequence(english), elementSequence(original))
})

test('all five orbit labels and their accessible prefixes translate while nodes and video stay intact', () => {
  const props = content => ({ sections: [], wrapper: content.spiritWrapper })
  const original = render(HomeSpiritChorusOrbit, props, false)
  const english = render(HomeSpiritChorusOrbit, props, true)
  for (const source of ['이름', '정직한 음악', '교회음악', '공동체', '다음 세대']) {
    assert.ok(english.includes(`aria-label="${translateEnglish(source)}:`), source)
    assert.ok(english.includes(`<span>${translateEnglish(source)}</span>`), source)
  }
  assert.equal((english.match(/data-orbit-node=/g) ?? []).length, 5)
  assert.equal((english.match(/<video\b/g) ?? []).length, 1)
  assert.deepEqual(elementSequence(english), elementSequence(original))
})

test('support letter translates all six use labels and retains the original contact values and elements', () => {
  const props = content => ({ content: content.supportLetter, settings: { phone: '02-000-0000', address: '원본 주소' } })
  const original = render(SupportLetterFold, props, false)
  const english = render(SupportLetterFold, props, true)
  for (const source of ['악보와 교육 자료', '배움의 기초를 단단하게', '연습과 공연 준비', '좋은 무대를 차분하게', '다음 세대 합창교육', '다음 목소리를 오래도록']) {
    assert.ok(original.includes(source), source)
    assert.ok(english.includes(translateEnglish(source)), source)
  }
  assert.ok(english.includes('원본 주소'))
  assert.ok(english.includes('02-000-0000'))
  assert.deepEqual(elementSequence(english), elementSequence(original))
})
