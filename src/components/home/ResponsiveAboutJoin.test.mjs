import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import react from '@vitejs/plugin-react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom', cacheDir: 'node_modules/.vite-about-join-test', configFile: false,
  logLevel: 'silent', plugins: [react()], root: process.cwd(), server: { middlewareMode: true },
})
const { AboutPreview } = await vite.ssrLoadModule('/src/components/home/AboutPreview.tsx')
const { JoinOpenScoreCTA } = await vite.ssrLoadModule('/src/components/home/JoinOpenScoreCTA.tsx')
const { HOME_CONTENT_DEFAULTS_V2 } = await vite.ssrLoadModule('/src/constants/homeContentV2.ts')
after(() => vite.close())

function renderAt(Component, props, width) {
  const previous = globalThis.window
  globalThis.window = {
    location: { pathname: '/' },
    matchMedia: (query) => ({ matches: query.includes('1024') ? width >= 1024 : query.includes('768') ? width >= 768 : false }),
  }
  try { return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component, props))) }
  finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
}

const responsiveAbout = {
  responsiveMobileDescription: 'CMS 모바일 소개문',
  responsiveTabletDescription: 'CMS 태블릿 소개문',
  responsiveFounded: 'SINCE\n2014',
  responsiveContext: 'CMS 활동지역\nCMS 교육영역\nCMS 공연교류',
  responsiveTabletFacts: 'CMS 창단연도\nCMS 기반지역\nCMS 교육가치',
}

test('responsive About uses editable compact descriptions and facts without desktop caption/tagline', () => {
  for (const width of [390,834]) {
    const html = renderAt(AboutPreview, {
      presentation: 'collective-portrait', title: 'CMS 소개 제목', summary: '데스크톱 소개문',
      buttonLabel: 'CMS 소개 버튼', identityTagline: '데스크톱 잔여 태그라인',
      collectivePortraitImage: { src: '/public-photo.jpg', alt: 'CMS 합창단 사진', caption: '데스크톱 사진 캡션' },
      responsiveContent: responsiveAbout,
    }, width)
    assert.match(html, /data-about-presentation="responsive-collective-portrait"/)
    assert.match(html, /CMS 소개 제목|CMS 소개 버튼/)
    assert.match(html, /href="\/about"/)
    assert.match(html, /CMS 합창단 사진/)
    assert.doesNotMatch(html, /데스크톱 사진 캡션|데스크톱 잔여 태그라인|FOUNDED|BASE|FOCUS|STAGE/)
    assert.ok(html.includes(width === 390 ? 'CMS 모바일 소개문' : 'CMS 태블릿 소개문'))
    assert.ok(html.includes(width === 390 ? 'CMS 활동지역' : 'CMS 기반지역'))
    assert.doesNotMatch(html, /데스크톱 소개문/)
  }
})

const joinContent = {
  ...HOME_CONTENT_DEFAULTS_V2.joinLetter,
  title: '데스크톱 입단 제목', description: 'CMS 태블릿 입단 본문, CMS 더 긴 설명', compactDescription: 'CMS 태블릿 짧은 설명',
  ctaLabel: 'CMS 지원 버튼', secondaryCtaLabel: 'CMS 절차 버튼',
  responsiveMobileTitle: 'CMS 모바일 입단\n네 줄 제목\n셋째 줄\n마지막 줄',
  responsiveMobileDescription: 'CMS 모바일 입단 설명',
  responsiveMobileGuardianNotes: 'CMS 모바일 보호자 안내\nCMS 모바일 일정 안내',
  responsiveTabletGuardianNotes: 'CMS 태블릿 보호자 안내\nCMS 태블릿 동의 안내',
}
const joinInfo = {
  id: 'public-join', title: null, description: null, target: 'CMS 실제 모집 대상', parts: null,
  audition_process: '1. CMS 신청 절차\n2. CMS 보호자 연락\n3. CMS 음악 확인\n4. CMS 합류 안내',
  preparation: null, rehearsal_time: null, rehearsal_location: null, application_url: null, is_visible: true,
}

test('mobile Join follows target, application, steps, guardian, secondary action order with real CMS data', () => {
  const html = renderAt(JoinOpenScoreCTA, { presentation: 'figma-open-score', content: joinContent, joinInfo }, 390)
  assert.match(html, /data-presentation="responsive-open-score"/)
  const positions = ['CMS 실제 모집 대상','CMS 지원 버튼','CMS 신청 절차','CMS 모바일 보호자 안내','CMS 절차 버튼'].map(text => html.indexOf(text))
  assert.ok(positions.every(position => position >= 0))
  assert.deepEqual([...positions].sort((a,b) => a-b), positions)
  assert.match(html, /CMS 모바일 입단 설명/)
  assert.doesNotMatch(html, /join-open-score__facts|모집 대상<\/dt>|연습 안내<\/dt>|보호자 안내<\/dt>/)
  assert.match(html, /href="\/join\?section=contact#application"/)
  assert.match(html, /href="\/join\?section=process"/)
})

test('tablet Join has only one primary CTA and shows editable process and guardian copy', () => {
  const html = renderAt(JoinOpenScoreCTA, { presentation: 'figma-open-score', content: joinContent, joinInfo }, 834)
  assert.match(html, /data-presentation="responsive-open-score"/)
  assert.match(html, /CMS 실제 모집 대상/)
  assert.match(html, /CMS 음악 확인/)
  assert.match(html, /CMS 태블릿 보호자 안내/)
  assert.match(html, /CMS 태블릿 입단 본문/)
  assert.match(html, /CMS 지원 버튼/)
  assert.doesNotMatch(html, /CMS 절차 버튼|CMS 모바일 입단 설명|join-open-score__facts/)
  assert.doesNotMatch(html, /THE JOINING SCORE|FOR PARENTS/)
})

test('responsive Join does not expose a hidden recruitment record', () => {
  const html = renderAt(JoinOpenScoreCTA, { presentation: 'figma-open-score', content: joinContent, joinInfo: { ...joinInfo, is_visible: false } }, 390)
  assert.doesNotMatch(html, /CMS 실제 모집 대상|CMS 신청 절차/)
  assert.match(html, /CMS 지원 버튼/)
})

test('desktop About and Join keep legacy markup and ignore responsive-only CMS fields', () => {
  const about = renderAt(AboutPreview, { presentation: 'collective-portrait', summary: '데스크톱 소개문', responsiveContent: responsiveAbout }, 1024)
  assert.match(about, /data-about-presentation="collective-portrait"/)
  assert.match(about, /데스크톱 소개문/)
  assert.doesNotMatch(about, /CMS 모바일 소개문|CMS 태블릿 소개문|responsive-collective-portrait/)
  const join = renderAt(JoinOpenScoreCTA, { presentation: 'figma-open-score', content: joinContent, joinInfo }, 1440)
  assert.match(join, /data-presentation="figma-open-score"/)
  assert.match(join, /데스크톱 입단 제목/)
  assert.doesNotMatch(join, /CMS 모바일 입단 설명|CMS 태블릿 보호자 안내|responsive-open-score/)
})
