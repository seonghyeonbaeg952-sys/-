import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test, { after } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const root = new URL('../../../', import.meta.url)
const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-members-contract-test', logLevel: 'silent', server: { middlewareMode: true } })
const { MembersArchiveExperience } = await vite.ssrLoadModule('/src/components/about/MembersArchiveExperience.tsx')
after(() => vite.close())

async function sourceOrEmpty(relativePath) {
  try {
    return await readFile(new URL(relativePath, root), 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return ''
    }

    throw error
  }
}

test('단원 전용 화면은 통계 카드 없이 피그마 아카이브 컴포넌트를 사용한다', async () => {
  const page = await sourceOrEmpty('src/pages/public/AboutPage.tsx')

  assert.match(page, /MembersArchiveExperience/)
  assert.match(page, /shouldShowDedicatedMembers/)
  assert.doesNotMatch(page, /MemberHarmonyMap/)
  assert.doesNotMatch(page, /member-stat-card/)
})

test('아카이브는 현단원·역대단원만 선택하고 현단원부터 보여준다', () => {
  const component = renderToStaticMarkup(React.createElement(MembersArchiveExperience, { members: [{
    id: 'fixture', display_name: '김○', part: 'soprano', group_type: 'middle', member_status: 'active', display_order: 0,
    name: 'PRIVATE FULL NAME', photo_url: 'https://private.invalid/child-photo.png',
  }] }))

  for (const copy of [
    '함께한 모든 이름이',
    '지금의 합창단을 만듭니다.',
    '단원 아카이브',
    '현단원',
    '역대단원',
  ]) {
    assert.ok(component.includes(copy), `missing approved copy: ${copy}`)
  }

  assert.match(component, /aria-label="활동 상태 필터"/)
  assert.match(component, /aria-label="파트 필터"/)
  assert.doesNotMatch(component, />전체 단원<|>현재 활동<|>이전 활동</)
  assert.equal(component.match(/members-archive__filter-button--status/g)?.length, 2)
  assert.equal(component.match(/aria-pressed="true"/g)?.length, 2)
  assert.doesNotMatch(component, /<img\b|PRIVATE FULL NAME|private\.invalid/)
})

test('평면형 디렉터리는 반응형·접근성·감속 모션 계약을 지킨다', async () => {
  const css = await sourceOrEmpty('src/styles/members-archive.css')

  assert.match(css, /\.members-archive__directory\s*\{/)
  assert.match(css, /background:\s*#e8ecea/)
  assert.match(css, /min-height:\s*44px/)
  assert.match(css, /@media\s*\(min-width:\s*768px\)/)
  assert.match(css, /@media\s*\(min-width:\s*1366px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(css, /#000(?:000)?\b|background:\s*(?:black|#17191d)/i)
})

test('명단은 분류 제목을 유지하고 각 단원은 이름만 표시한다', () => {
  const html = renderToStaticMarkup(React.createElement(MembersArchiveExperience, { members: [
    { id: 'bass', display_name: '베이스 예시', part: 'bass', group_type: 'university', member_status: 'active', display_order: 0 },
    { id: 'staff', display_name: '스태프 예시', part: 'soprano', group_type: 'staff', member_status: 'active', display_order: 0 },
    { id: 'accompanist', display_name: '반주자 예시', part: 'accompanist', group_type: 'staff', member_status: 'alumni', display_order: 0 },
    { id: 'hidden', display_name: '파트 없는 예시', part: 'hidden', group_type: 'staff', member_status: 'active', display_order: 0 },
  ] }))
  assert.match(html, /id="member-group-bass"/)
  assert.match(html, /id="member-group-staff"/)
  assert.doesNotMatch(html, /BASS · STAFF/)
  const rows = [...html.matchAll(/<li\b[^>]*>(.*?)<\/li>/gs)].map(match => match[1])
  assert.equal(rows.length, 3)
  assert.doesNotMatch(html, /반주자 예시/)
  for (const name of ['베이스 예시', '스태프 예시', '파트 없는 예시']) {
    assert.equal(rows.find(row => row.includes(name)), `<div class="members-archive__member-copy"><strong>${name}</strong></div>`)
  }
  assert.doesNotMatch(html, /members-archive__status(?:\s|")|members-archive__current-key/)
  assert.doesNotMatch(rows.join(''), /현재 활동|함께한 단원|STAFF| · /)
  assert.doesNotMatch(html, /<img\b/)
})

test('그룹·파트 미표시 단원도 이름만 표시하고 분류에서 누락하지 않는다', () => {
  const html = renderToStaticMarkup(React.createElement(MembersArchiveExperience, { members: [
    { id: 'group-hidden', display_name: '그룹 없는 예시', part: 'soprano', group_type: 'hidden', member_status: 'active', display_order: 0 },
    { id: 'both-hidden', display_name: '이름만 공개한 예시', part: 'hidden', group_type: 'hidden', member_status: 'active', display_order: 0 },
  ] }))
  const copies = [...html.matchAll(/<div class="members-archive__member-copy">(.*?)<\/div>/gs)].map(match => match[1])
  assert.equal(copies.find(copy => copy.includes('그룹 없는 예시')), '<strong>그룹 없는 예시</strong>')
  assert.equal(copies.find(copy => copy.includes('이름만 공개한 예시')), '<strong>이름만 공개한 예시</strong>')
  assert.match(html, /id="member-group-soprano"/)
  assert.match(html, /id="member-group-members"/)
})
