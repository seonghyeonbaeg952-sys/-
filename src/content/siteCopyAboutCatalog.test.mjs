import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { after, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-site-copy-about-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { SiteEditorContext } = await vite.ssrLoadModule('/src/components/site-editor/useSiteEditor.ts')
const components = {}
for (const [page, folder, name] of [
  ['about', 'about', 'AboutOverviewExperience'], ['conductor', 'about', 'ConductorProfileDocument'],
  ['accompanist', 'about', 'AccompanistProfiles'], ['members', 'about', 'MembersArchiveExperience'],
  ['history', 'about', 'HistoryCueSheetExperience'], ['spirit', 'spirit', 'SpiritHeritageExperience'],
]) components[page] = (await vite.ssrLoadModule(`/src/components/${folder}/${name}.tsx`))[name]
const definitions = (await vite.ssrLoadModule('/src/content/siteCopyCatalog.ts')).siteCopyDefinitions
const historyRow = { id: 'fixture-history', year: '2020', title: 'CMS 기록 제목', content: 'CMS 기록 본문', is_visible: true, display_order: 1 }
const props = {
  about: {}, conductor: { person: null }, accompanist: { people: [] }, members: { members: [] },
  history: { history: [historyRow], defaultOpenIds: ['fixture-history'], shouldUseLegacyFallback: false },
  spirit: { hero: { title: 'CMS 표제', body: 'CMS 첫 화면 본문' }, motetMeaning: { title: 'CMS 모테트 표제', body: 'CMS 모테트 본문', quote: 'CMS 인용 원문' },
    manifestoText: 'CMS 문단1\n\nCMS 문단2\n\nCMS 문단3\n\nCMS 문단4', values: [{ number: '01', title: 'CMS 가치', summary: 'CMS 요약', description: 'CMS 설명' }],
    cta: { title: 'CMS 참여 표제', body: 'CMS 참여 본문', ctaLabel: 'CMS 입단', ctaUrl: '/join', secondaryCtaLabel: 'CMS 후원', secondaryCtaUrl: '/contact?section=support' } },
}
// Captured from the original components before connecting any editor consumers.
const approvedMarkupHashes = {
  about: '84bf70717f7e9875902f9e6167e165123ce2ad67ab0a963e23779c1e873e0a97', conductor: '6f214445187ff3db0bf8ef71b9449e901ef53e63d0b1b3d59fd65fbda5ac665e',
  accompanist: '1b4451b43221301500ed45ce3737a0da4af8166e58063ed01311ab948b0ff46b', members: '8ea908322f108bddadbfdb887323b9d4ca502cd655395c0926d9d9a384f30f2a',
  history: '49dd95e8e8601b19c93aa4cea85853572b74afff47b6e39cc945800988ac9e49', spirit: '86009e4bedec6a759ec050ac401e09ee02e9b82e9a5ec61029790e352fe6a94d',
}
function render(page, { copy = (_page, _key, fallback) => fallback, values = props[page] } = {}) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(SiteEditorContext, { value: { copy, documents: {}, device: 'desktop', isPreview: false } }, React.createElement(components[page], values))))
}

for (const [page, text] of Object.entries({ about: '청소년의 목소리로', conductor: '지휘자 소개', accompanist: '반주자 소개', members: '함께한 모든 이름이', history: '한 줄의 기록이', spirit: '정신은 선언이 아니라' })) {
  test(`${page} title reads its own page key even when rendered outside that route`, () => {
    const calls = []
    const html = render(page, { copy(target, key, fallback) { calls.push({ target, key, fallback }); return fallback === text ? 'OVERRIDE-SENTINEL' : fallback } })
    assert.ok(html.includes('OVERRIDE-SENTINEL'))
    const call = calls.find(item => item.fallback === text)
    assert.equal(call.target, page)
    assert.ok(call.key.startsWith(`${page}.`))
  })
  test(`${page} without overrides preserves every original rendered character, tag and line break`, () => {
    assert.equal(createHash('sha256').update(render(page)).digest('hex'), approvedMarkupHashes[page])
  })
}

test('catalog entries are unique and every observed consumer carries the original catalog fallback', () => {
  assert.ok(definitions.length > 80, 'the fixed-copy catalog must cover the six assigned components')
  const lookup = new Map(definitions.map(field => [field.key, field]))
  assert.equal(lookup.size, definitions.length)
  const seen = new Set()
  const copy = (page, key, fallback) => {
    const field = lookup.get(key)
    assert.ok(field, `missing catalog entry: ${key}`)
    assert.equal(field.page, page)
    assert.equal(field.defaultValue, fallback)
    seen.add(key)
    return fallback
  }
  for (const page of Object.keys(components)) render(page, { copy })
  render('history', { copy, values: { history: [], shouldUseLegacyFallback: false } })
  render('history', { copy, values: { ...props.history, compact: true, history: [{ ...historyRow, content: '' }] } })
  render('accompanist', { copy, values: { people: [{ id: 'person', name: 'CMS 이름', description: 'CMS 반주자 원문', education_items: 'CMS 학력', current_roles: 'CMS 활동', message: 'CMS 인사 원문' }] } })
  assert.ok(seen.size > 80)
})

test('copy overrides never replace domain CMS originals, private member names or navigation destinations', () => {
  const changed = (_page, _key, fallback) => `EDITED:${fallback}`
  const conductor = render('conductor', { copy: changed, values: { person: { name: 'CMS 지휘자', profile_summary: 'CMS 프로필 원문', current_roles: 'CMS 현직', photo_url: '/images/profile-fixture.jpg' } } })
  assert.ok(conductor.includes('CMS 프로필 원문')); assert.ok(conductor.includes('CMS 현직')); assert.ok(!conductor.includes('EDITED:CMS'))
  const history = render('history', { copy: changed })
  assert.ok(history.includes('CMS 기록 본문')); assert.ok(!history.includes('EDITED:CMS 기록'))
  const spirit = render('spirit', { copy: changed })
  for (const text of ['CMS 첫 화면 본문', 'CMS 모테트 본문', 'CMS 인용 원문', 'CMS 문단1', 'CMS 가치', 'CMS 참여 본문']) assert.ok(spirit.includes(text))
  assert.ok(!spirit.includes('EDITED:CMS'))
  assert.match(spirit, /href="\/join"/)
  assert.match(spirit, /href="\/contact\?section=support"/)
})

test('static array labels and disclosure actions are editable without changing their functional values', () => {
  for (const [page, original] of [['about', '음악적 역량과 예술성'], ['about', '정기연주회'], ['members', '전체 단원'], ['history', '모두 접기'], ['spirit', '합창 기본기'], ['spirit', '조율하기'], ['spirit', '서울모테트합창단의 시작']]) {
    const html = render(page, { copy: (_page, _key, fallback) => fallback === original ? 'ARRAY-OVERRIDE' : fallback })
    assert.ok(html.includes('ARRAY-OVERRIDE'), `${page}: ${original}`)
  }
  const members = render('members', { copy: (_page, _key, fallback) => fallback === '전체 단원' ? '현재 활동' : fallback })
  assert.match(members, /aria-pressed="true"[^>]*>현재 활동<\/button>/)
})

test('member metadata labels can change while the safe display name and grouping remain intact', () => {
  const html = render('members', { values: { members: [{ id: 'safe-fixture', display_name: '이○', part: 'soprano', group_type: 'middle', member_status: 'active', display_order: 0, name: 'PRIVATE FULL NAME' }] },
    copy: (_page, _key, fallback) => fallback === '중등부' ? 'GROUP-OVERRIDE' : fallback })
  assert.ok(html.includes('GROUP-OVERRIDE'))
  assert.ok(html.includes('이○'))
  assert.match(html, /id="member-group-soprano"/)
  assert.ok(!html.includes('PRIVATE FULL NAME'))
})

test('English roles, decorative labels and accessible names are editable in their original language', () => {
  for (const [page, original, values] of [
    ['about', 'VOICES'], ['conductor', 'CURRENT'],
    ['accompanist', 'Piano Accompanist', { people: [{ id: 'fixture', name: 'CMS 반주자' }] }],
    ['members', 'All voices.'], ['members', 'All voices. One archive.'],
    ['history', 'PERFORMANCE INDEX'], ['spirit', 'MOTET'],
  ]) {
    const html = render(page, { values: values ?? props[page], copy: (_page, _key, fallback) => fallback === original ? 'ENGLISH-EDIT' : fallback })
    assert.ok(html.includes('ENGLISH-EDIT'), `${page}: ${original}`)
  }
})

test('English array captions and profile labels are editable while functional grouping and domain data remain intact', () => {
  for (const [page, original] of [['about', 'MUSICAL ARTISTRY'], ['about', 'BREATHE'], ['about', 'FOUNDED IN SEOUL'], ['spirit', 'NOW']]) {
    assert.ok(render(page, { copy: (_page, _key, fallback) => fallback === original ? 'CAPTION-EDIT' : fallback }).includes('CAPTION-EDIT'), original)
  }
  const members = render('members', { values: { members: [{ id: 'fixture', display_name: '김○', part: 'soprano', group_type: 'middle', member_status: 'active', display_order: 0 }] },
    copy: (_page, _key, fallback) => fallback === 'SOPRANO' ? 'GROUP-CAPTION' : fallback })
  assert.ok(members.includes('GROUP-CAPTION')); assert.match(members, /id="member-group-soprano"/)
  const conductor = render('conductor', { copy: (_page, _key, fallback) => `EDIT:${fallback}` })
  assert.ok(conductor.includes('2014 — PRESENT')); assert.ok(conductor.includes('KIM HYUNG-SU'))
  assert.ok(conductor.includes('EDIT:KIM HYUNG-SU'), 'The formerly hardcoded English profile label now has its own explicit editor key')
})
