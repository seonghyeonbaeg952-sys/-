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
    'bass-staff',
  ])
  assert.deepEqual(groupedIds.sort(), members.map((member) => member.id).sort())
})
