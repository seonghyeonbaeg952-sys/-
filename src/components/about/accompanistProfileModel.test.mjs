import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})

const { buildAccompanistProfileModel } = await vite.ssrLoadModule(
  '/src/components/about/accompanistProfileModel.ts',
)

const projectRoot = new URL('../../../', import.meta.url)

after(async () => {
  await vite.close()
})

test('학력과 현직 경력을 CMS bio의 빈 줄과 현) 표기를 기준으로 분리한다', () => {
  const model = buildAccompanistProfileModel({
    bio: [
      '계원예술고등학교 졸업',
      '이화여자대학교 피아노 전공 졸업',
      '',
      '현) 서울모테트청소년합창단 반주자',
      '단국대 성악과 반주',
    ].join('\n'),
    current_roles: null,
    education_items: null,
  })

  assert.deepEqual(model.education, [
    '계원예술고등학교 졸업',
    '이화여자대학교 피아노 전공 졸업',
  ])
  assert.deepEqual(model.current, [
    '서울모테트청소년합창단 반주자',
    '단국대 성악과 반주',
  ])
})

test('구조화된 CMS 항목이 있으면 bio보다 우선한다', () => {
  const model = buildAccompanistProfileModel({
    bio: '이 문장은 구조화된 항목이 있을 때 목록으로 사용하지 않습니다.',
    current_roles: '["서울모테트청소년합창단 반주자", "대학 성악과 반주"]',
    education_items: '피아노과 졸업\n반주 전공 석사 졸업',
  })

  assert.deepEqual(model.education, ['피아노과 졸업', '반주 전공 석사 졸업'])
  assert.deepEqual(model.current, ['서울모테트청소년합창단 반주자', '대학 성악과 반주'])
})

test('박정화 프로필 사진만 반응형 compact 크기를 사용한다', async () => {
  const [component, css] = await Promise.all([
    readFile(new URL('src/components/about/AccompanistProfiles.tsx', projectRoot), 'utf8'),
    readFile(new URL('src/styles/accompanist-profiles.css', projectRoot), 'utf8'),
  ])

  assert.match(
    component,
    /data-portrait-size=\{name === '박정화' \? 'compact' : undefined\}/,
  )
  assert.match(
    css,
    /\[data-portrait-size='compact'\][^{]*\.accompanist-profile__portrait\s*\{[^}]*max-width:\s*288px/s,
  )
  assert.match(
    css,
    /@media \(max-width: 700px\)[\s\S]*\[data-portrait-size='compact'\][^{]*\.accompanist-profile__portrait\s*\{[^}]*width:\s*min\(232px, 100%\)/,
  )
})
