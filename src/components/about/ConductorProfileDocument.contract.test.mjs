import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test, { after } from 'node:test'

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const projectRoot = new URL('../../../', import.meta.url)
const exactParagraphOne =
  '2014년 서울모테트음악재단 설립과 함께 창단된 서울모테트청소년합창단을 지도하고 있는 지휘자 김형수는 지난 35년 동안 서울모테트합창단(프로단체) 단원 겸 수석 부지휘자로 활동해 왔으며  특별히 미래 사회와 음악계를 이끌어 갈 다음 세대를 위한 창조적인 대한으로 모테트 음악재단 산하에 설립된 청소년 아카데미와 청소년합창단을 교육하고 있다.'
const exactParagraphTwo =
  '학부에서는 성악을, 대학원에서 지휘(합창)를 공부하였고 Midwest University 교회음악 박사과정을 취득했다. 또한 교회음악의 성경적 이해와 연구를 위해 신대원에서 신학(M.Div)을 졸업하고 해오름교회, 길교회 음악목사를 역임하였으며, 침신대학교, 남부대학교대학원, 동양대학교, 백석문화대학, 남부대학교 대학원에서 강사를 역임하였다.'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})

const { ConductorProfileDocument } = await vite.ssrLoadModule(
  '/src/components/about/ConductorProfileDocument.tsx',
)

after(async () => {
  await vite.close()
})

function render(person = null) {
  return renderToStaticMarkup(
    React.createElement(ConductorProfileDocument, { person }),
  )
}

test('CMS 내용이 없으면 승인된 두 문단을 글자 그대로 표시한다', () => {
  const markup = render()

  assert.ok(markup.includes(exactParagraphOne))
  assert.ok(markup.includes(exactParagraphTwo))
  assert.ok(markup.includes('KIM HYUNG-SU'))
})

test('단일 프로필 섹션에 프로필과 합창단 사진만 한 장씩 표시한다', () => {
  const markup = render()

  assert.equal(markup.match(/<section\b/g)?.length ?? 0, 1)
  assert.equal(markup.match(/<img\b/g)?.length ?? 0, 2)
  assert.doesNotMatch(markup, /conductor-profile__education/)
  assert.doesNotMatch(markup, /conductor-profile__experience/)
  assert.doesNotMatch(markup, /conductor-profile__signature/)
})

test('기본 프로필과 공연 사진은 승인된 로컬 원본을 사용한다', async () => {
  const markup = render()
  const assets = [
    '/images/about/conductor/kim-hyung-su-profile.jpg',
    '/images/about/conductor/smyc-performance-2026.jpg',
  ]

  for (const asset of assets) {
    assert.ok(markup.includes(`src="${asset}"`))
    await access(new URL(`public${asset}`, projectRoot))
  }
})

test('CMS 프로필 본문과 현재 역할 및 이미지가 기본값보다 우선한다', () => {
  const markup = render({
    activity_images:
      'https://cdn.example.com/performance.jpg | 서울모테트청소년합창단 연주 사진 | 2026 정기연주회',
    bio: '호환용 약력',
    current_roles: '서울모테트청소년합창단 지휘자\n서울모테트음악재단 상임이사',
    name: '김형수',
    photo_url: 'https://cdn.example.com/profile.jpg',
    profile_image_alt: '김형수 지휘자 공식 프로필',
    profile_summary: 'CMS 첫 문단\n\nCMS 둘째 문단',
    role: '지휘자',
  })

  assert.ok(markup.includes('CMS 첫 문단'))
  assert.ok(markup.includes('CMS 둘째 문단'))
  assert.doesNotMatch(markup, /호환용 약력/)
  assert.ok(markup.includes('서울모테트청소년합창단 지휘자'))
  assert.ok(markup.includes('서울모테트음악재단 상임이사'))
  assert.ok(markup.includes('src="https://cdn.example.com/profile.jpg"'))
  assert.ok(markup.includes('alt="김형수 지휘자 공식 프로필"'))
  assert.ok(markup.includes('src="https://cdn.example.com/performance.jpg"'))
  assert.ok(markup.includes('alt="서울모테트청소년합창단 연주 사진"'))
})

test('현재 CMS 레거시 구조에서는 description을 약력으로, bio를 현직 목록으로 표시한다', () => {
  const markup = render({
    bio: [
      '현)서울모테트청소년합창단 지휘자',
      '(재)서울모테트음악재단 상임이사 겸',
      '서울모테트합창단 수석부지휘자',
    ].join('\n'),
    current_roles: null,
    description: `${exactParagraphOne}\n${exactParagraphTwo}`,
    name: '김형수',
    photo_url: null,
    profile_summary: '   ',
    role: '지휘자',
  })

  assert.ok(markup.includes(exactParagraphOne))
  assert.ok(markup.includes(exactParagraphTwo))
  assert.ok(markup.includes('서울모테트청소년합창단 지휘자'))
  assert.ok(
    markup.includes(
      '(재)서울모테트음악재단 상임이사 겸 서울모테트합창단 수석부지휘자',
    ),
  )
})

test('반응형 스타일은 동적 높이와 reduced-motion 안전장치를 유지한다', async () => {
  const css = await readFile(
    new URL('src/styles/conductor-profile.css', projectRoot),
    'utf8',
  )

  assert.match(css, /@media \(max-width: 900px\)/)
  assert.match(css, /@media \(max-width: 620px\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(css, /\.conductor-profile__document\s*\{[^}]*height:\s*\d+px/s)
})
