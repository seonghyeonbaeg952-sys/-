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
    ['active-soprano', 'former-soprano', 'active-staff'],
  )
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

test('베이스와 스태프를 분리하고 새 파트와 기존 기타 단원을 한 번씩 유지한다', () => {
  const groups = memberArchive.groupPublicMembersForArchive(additionalMembers)
  const ids = key => groups.find(group => group.key === key)?.members.map(member => member.id).sort()
  assert.deepEqual(ids('bass'), ['bass'])
  assert.deepEqual(ids('staff'), ['staff-accompanist', 'staff-bass', 'staff-hidden'])
  assert.deepEqual(ids('accompanist'), ['accompanist'])
  assert.deepEqual(ids('members'), ['hidden', 'other'])
  assert.deepEqual(groups.flatMap(group => group.members.map(member => member.id)).sort(),
    ['accompanist', 'bass', 'hidden', 'other', 'staff-accompanist', 'staff-bass', 'staff-hidden'])
})

test('반주자 필터는 스태프 반주자도 찾고 스태프 필터는 모든 스태프 파트를 유지한다', () => {
  const ids = filter => memberArchive.filterPublicMembersForArchive(additionalMembers, 'all', filter).map(member => member.id).sort()
  assert.deepEqual(ids('bass'), ['bass'])
  assert.deepEqual(ids('staff'), ['staff-accompanist', 'staff-bass', 'staff-hidden'])
  assert.deepEqual(ids('accompanist'), ['accompanist', 'staff-accompanist'])
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
