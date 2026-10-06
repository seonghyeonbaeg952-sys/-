import assert from 'node:assert/strict'
import { test } from 'node:test'

const memberArchive = await import('./memberName.ts')

const members = [
  {
    display_name: '김○○',
    display_order: 3,
    group_type: 'high',
    id: 'active-soprano',
    member_status: 'active',
    part: 'soprano',
  },
  {
    display_name: '박○○',
    display_order: 2,
    group_type: 'university',
    id: 'former-soprano',
    member_status: 'alumni',
    part: 'soprano',
  },
  {
    display_name: '이○○',
    display_order: 1,
    group_type: 'staff',
    id: 'active-staff',
    member_status: 'active',
    part: 'other',
  },
]

test('전체 상태는 현재 활동 단원과 이전 활동 단원을 한 아카이브에 유지한다', () => {
  assert.equal(typeof memberArchive.filterPublicMembersForArchive, 'function')

  const result = memberArchive.filterPublicMembersForArchive(
    members,
    'all',
    'all',
  )

  assert.deepEqual(
    result.map((member) => member.id),
    ['active-staff', 'former-soprano', 'active-soprano'],
  )
})

const orderedMembers = [
  { id: 'late-alphabetically-first', display_name: '가늦은이름', display_name_en: 'First English', display_order: 10, part: 'tenor', group_type: 'alumni', member_status: 'alumni' },
  { id: 'tie-na', display_name: '나성주', display_name_en: 'Second English', display_order: 1, part: 'tenor', group_type: 'university', member_status: 'active' },
  { id: 'tie-kim-ju', display_name: '김주훈', display_name_en: 'Third English', display_order: 1, part: 'tenor', group_type: 'staff', member_status: 'active' },
  { id: 'first-by-cms', display_name: '이준식', display_name_en: 'Last English', display_order: 0, part: 'tenor', group_type: 'staff', member_status: 'active' },
  { id: 'tie-kim-jun', display_name: '김준경', display_name_en: 'Fourth English', display_order: 1, part: 'tenor', group_type: 'university', member_status: 'active' },
]

test('CMS 표시 순서를 먼저 적용하고 같은 숫자끼리 공개 한국어 이름의 가나다순으로 정렬한다', () => {
  const originalIds = orderedMembers.map(member => member.id)
  assert.deepEqual(memberArchive.filterPublicMembersForArchive(orderedMembers, 'all', 'all').map(member => member.id),
    ['first-by-cms', 'tie-kim-ju', 'tie-kim-jun', 'tie-na', 'late-alphabetically-first'])
  assert.deepEqual(orderedMembers.map(member => member.id), originalIds, 'sorting must not mutate CMS data')
})

test('파트별 현단원 명단도 CMS 순서와 가나다순 동률 기준을 유지한다', () => {
  const current = memberArchive.filterPublicMembersForArchive(orderedMembers, 'active', 'tenor')
  assert.deepEqual(memberArchive.groupPublicMembersForArchive(current).find(group => group.key === 'tenor').members.map(member => member.id),
    ['first-by-cms', 'tie-kim-ju', 'tie-kim-jun', 'tie-na'])
})

test('순서와 보호된 공개 이름이 같은 단원은 원본 이름 대신 ID로 안정적으로 정렬한다', () => {
  const rows = [
    { ...orderedMembers[0], id: 'masked-b', display_name: '김○', display_order: 0, name: '가PRIVATE', display_name_en: 'A masked' },
    { ...orderedMembers[0], id: 'masked-a', display_name: '김○', display_order: 0, name: '하PRIVATE', display_name_en: 'Z masked' },
  ]
  assert.deepEqual(memberArchive.filterPublicMembersForArchive(rows, 'all', 'all').map(member => member.id), ['masked-a', 'masked-b'])
})

test('상태와 파트 필터를 독립적으로 조합한다', () => {
  assert.equal(typeof memberArchive.filterPublicMembersForArchive, 'function')

  assert.deepEqual(
    memberArchive
      .filterPublicMembersForArchive(members, 'alumni', 'soprano')
      .map((member) => member.id),
    ['former-soprano'],
  )
  assert.deepEqual(
    memberArchive
      .filterPublicMembersForArchive(members, 'active', 'staff')
      .map((member) => member.id),
    ['active-staff'],
  )
})

test('파트별 디렉터리는 모든 공개 단원을 누락 없이 한 번만 배치한다', () => {
  assert.equal(typeof memberArchive.groupPublicMembersForArchive, 'function')

  const groups = memberArchive.groupPublicMembersForArchive(members)
  const groupedIds = groups.flatMap((group) =>
    group.members.map((member) => member.id),
  )

  assert.deepEqual(groups.map((group) => group.key), [
    'soprano',
    'alto',
    'tenor',
    'bass',
    'staff',
    'accompanist',
    'members',
  ])
  assert.deepEqual(groupedIds.sort(), members.map((member) => member.id).sort())
})

const additionalMembers = [
  { id: 'bass', display_name: 'Bass fixture', part: 'bass', group_type: 'university', member_status: 'active', display_order: 0 },
  { id: 'staff-bass', display_name: 'Staff fixture', part: 'bass', group_type: 'staff', member_status: 'active', display_order: 0 },
  { id: 'staff-accompanist', display_name: 'Staff accompanist', part: 'accompanist', group_type: 'staff', member_status: 'active', display_order: 0 },
  { id: 'accompanist', display_name: 'Accompanist fixture', part: 'accompanist', group_type: 'university', member_status: 'alumni', display_order: 0 },
  { id: 'staff-hidden', display_name: 'Staff hidden part', part: 'hidden', group_type: 'staff', member_status: 'active', display_order: 0 },
  { id: 'hidden', display_name: 'Hidden part fixture', part: 'hidden', group_type: 'middle', member_status: 'active', display_order: 0 },
  { id: 'other', display_name: 'Legacy other fixture', part: 'other', group_type: 'high', member_status: 'active', display_order: 0 },
]

test('파트가 지정된 스태프를 해당 파트에 합치고 미표시·기타 단원을 한 번씩 유지한다', () => {
  const groups = memberArchive.groupPublicMembersForArchive(additionalMembers)
  const ids = key => groups.find(group => group.key === key)?.members.map(member => member.id).sort()
  assert.deepEqual(ids('bass'), ['bass', 'staff-bass'])
  assert.deepEqual(ids('staff'), ['staff-hidden'])
  assert.deepEqual(ids('accompanist'), ['accompanist', 'staff-accompanist'])
  assert.deepEqual(ids('members'), ['hidden', 'other'])
  assert.deepEqual(groups.flatMap(group => group.members.map(member => member.id)).sort(),
    ['accompanist', 'bass', 'hidden', 'other', 'staff-accompanist', 'staff-bass', 'staff-hidden'])
})

test('반주자 필터는 스태프 반주자도 찾고 스태프 필터는 모든 스태프 파트를 유지한다', () => {
  const ids = filter => memberArchive.filterPublicMembersForArchive(additionalMembers, 'all', filter).map(member => member.id).sort()
  assert.deepEqual(ids('bass'), ['bass', 'staff-bass'])
  assert.deepEqual(ids('staff'), ['staff-accompanist', 'staff-bass', 'staff-hidden'])
  assert.deepEqual(ids('accompanist'), ['accompanist', 'staff-accompanist'])
})

test('모든 성부와 반주 파트의 스태프는 해당 명단에 한 번만 표시된다', () => {
  const parts = ['soprano', 'alto', 'tenor', 'bass', 'accompanist']
  const members = parts.map((part, index) => ({ id: `staff-${part}`, display_name: `Member ${index}`, part, group_type: 'staff', member_status: 'active', display_order: index }))
  const groups = memberArchive.groupPublicMembersForArchive(members)
  for (const part of parts) {
    assert.deepEqual(groups.find(group => group.key === part)?.members.map(member => member.id), [`staff-${part}`])
    assert.deepEqual(memberArchive.filterPublicMembersForArchive(members, 'all', part).map(member => member.id), [`staff-${part}`])
  }
  assert.equal(groups.find(group => group.key === 'staff')?.members.length, 0)
  assert.equal(groups.flatMap(group => group.members).length, 5)
  assert.equal(memberArchive.filterPublicMembersForArchive(members, 'all', 'staff').length, 5)
})

test('미표시 파트는 이름 공개 설정을 바꾸지 않고 이름 비공개 시 중립적인 이름을 쓴다', () => {
  const hidden = { part: 'hidden', name: 'PRIVATE NAME', name_display_type: 'hidden', display_name: null, display_name_en: null }
  assert.equal(memberArchive.getProtectedMemberName(hidden), '합창단 단원')
  assert.equal(memberArchive.getProtectedMemberName({ ...hidden, name_display_type: 'partial' }), 'P○')
  assert.equal(memberArchive.getPublicMemberName(hidden, 'ko'), '합창단 단원')
  assert.equal(memberArchive.getPublicMemberName(hidden, 'en'), 'Choir member')
  assert.equal(memberArchive.getPublicMemberName({ ...hidden, display_name: '공개 이름' }, 'ko'), '공개 이름')
  assert.equal(memberArchive.getPublicMemberName({ ...hidden, part: 'accompanist' }, 'en'), 'Accompanist')
})
