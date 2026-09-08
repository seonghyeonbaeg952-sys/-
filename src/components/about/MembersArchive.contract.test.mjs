import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../../../', import.meta.url)

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

test('아카이브는 현재·이전 상태와 파트를 각각 조작할 수 있다', async () => {
  const component = await sourceOrEmpty(
    'src/components/about/MembersArchiveExperience.tsx',
  )

  for (const copy of [
    '함께한 모든 이름이',
    '지금의 합창단을 만듭니다.',
    '단원 아카이브',
    '전체 단원',
    '현재 활동',
    '이전 활동',
  ]) {
    assert.ok(component.includes(copy), `missing approved copy: ${copy}`)
  }

  assert.match(component, /aria-label="활동 상태 필터"/)
  assert.match(component, /aria-label="파트 필터"/)
  assert.match(component, /aria-pressed=/)
  assert.doesNotMatch(component, /<img\b|ImageTile|photo_url/)
})

test('평면형 디렉터리는 반응형·접근성·감속 모션 계약을 지킨다', async () => {
  const css = await sourceOrEmpty('src/styles/members-archive.css')

  assert.match(css, /\.members-archive__directory\s*\{/)
  assert.match(css, /background:\s*#e8ecea/)
  assert.match(css, /min-height:\s*44px/)
  assert.match(css, /@media\s*\(min-width:\s*768px\)/)
  assert.match(css, /@media\s*\(min-width:\s*1200px\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.doesNotMatch(css, /#000(?:000)?\b|background:\s*(?:black|#17191d)/i)
})
