import type { MemberRow, PublicMemberRow } from '../types/cms'

export type MemberArchiveStatusFilter = 'all' | 'active' | 'alumni'
export type MemberArchivePartFilter =
  | 'all'
  | 'soprano'
  | 'alto'
  | 'tenor'
  | 'bass'
  | 'accompanist'
  | 'staff'

export type MemberArchiveGroupKey =
  | 'soprano'
  | 'alto'
  | 'tenor'
  | 'bass'
  | 'staff'
  | 'accompanist'
  | 'members'

export interface MemberArchiveGroup {
  key: MemberArchiveGroupKey
  label: string
  members: PublicMemberRow[]
}

const partLabels: Record<MemberRow['part'], string> = {
  soprano: '소프라노',
  alto: '알토',
  tenor: '테너',
  bass: '베이스',
  accompanist: '반주자',
  hidden: '미표시',
  other: '합창단',
}

const groupLabels: Record<MemberRow['group_type'], string> = {
  elementary: '초등부',
  middle: '중등부',
  high: '고등부',
  university: '대학부',
  staff: '스태프',
  hidden: '미표시',
  alumni: '역대단원',
}

const statusLabels: Record<NonNullable<MemberRow['member_status']>, string> = {
  active: '현재단원',
  alumni: '역대단원',
}

export function getMemberPartLabel(part: MemberRow['part']) {
  return partLabels[part] ?? partLabels.other
}

export function getMemberGroupLabel(groupType: MemberRow['group_type']) {
  return groupLabels[groupType] ?? '단원'
}

export function getMemberStatus(member: Pick<MemberRow, 'group_type' | 'member_status'>) {
  return member.member_status ?? (member.group_type === 'alumni' ? 'alumni' : 'active')
}

export function getMemberStatusLabel(status: MemberRow['member_status']) {
  return status ? statusLabels[status] : statusLabels.active
}

function getAnonymousMemberName(part: MemberRow['part'], language: 'ko' | 'en') {
  if (part === 'hidden' || part === 'other') {
    return language === 'en' ? 'Choir member' : '합창단 단원'
  }
  if (part === 'accompanist') {
    return language === 'en' ? 'Accompanist' : '반주자'
  }
  return language === 'en'
    ? `${part[0].toUpperCase()}${part.slice(1)} member`
    : `${getMemberPartLabel(part)} 단원`
}

export function getProtectedMemberName(
  member: Pick<MemberRow, 'name' | 'name_display_type' | 'part'>,
) {
  const fallback = getAnonymousMemberName(member.part, 'ko')
  const name = member.name?.trim()

  if (!name) {
    return fallback
  }

  if (member.name_display_type === 'full') {
    return name
  }

  if (member.name_display_type === 'partial') {
    return `${name[0]}○`
  }

  return fallback
}

export function getPublicMemberName(
  member: Pick<PublicMemberRow, 'display_name' | 'display_name_en' | 'part'>,
  language: 'ko' | 'en' = 'ko',
) {
  const publicName = language === 'en' ? member.display_name_en?.trim() || member.display_name?.trim() : member.display_name?.trim()
  if (publicName) return publicName
  return getAnonymousMemberName(member.part, language)
}

const memberNameCollator = new Intl.Collator('ko-KR', {
  numeric: true,
  sensitivity: 'base',
})

function comparePublicMembers(left: PublicMemberRow, right: PublicMemberRow) {
  const byOrder = left.display_order - right.display_order

  if (byOrder !== 0) {
    return byOrder
  }

  const byName = memberNameCollator.compare(
    getPublicMemberName(left),
    getPublicMemberName(right),
  )

  if (byName !== 0) {
    return byName
  }

  return left.id.localeCompare(right.id)
}

export function filterPublicMembersForArchive(
  members: PublicMemberRow[],
  statusFilter: MemberArchiveStatusFilter,
  partFilter: MemberArchivePartFilter,
) {
  return members
    .filter((member) => {
      if (
        statusFilter !== 'all' &&
        getMemberStatus(member) !== statusFilter
      ) {
        return false
      }

      if (partFilter === 'all') {
        return true
      }

      if (partFilter === 'staff') {
        return member.group_type === 'staff'
      }

      return member.part === partFilter
    })
    .sort(comparePublicMembers)
}

export function groupPublicMembersForArchive(
  members: PublicMemberRow[],
): MemberArchiveGroup[] {
  const sortedMembers = [...members].sort(comparePublicMembers)

  return [
    {
      key: 'soprano',
      label: 'SOPRANO',
      members: sortedMembers.filter(
        (member) => member.part === 'soprano',
      ),
    },
    {
      key: 'alto',
      label: 'ALTO',
      members: sortedMembers.filter(
        (member) => member.part === 'alto',
      ),
    },
    {
      key: 'tenor',
      label: 'TENOR',
      members: sortedMembers.filter(
        (member) => member.part === 'tenor',
      ),
    },
    {
      key: 'bass',
      label: 'BASS',
      members: sortedMembers.filter(
        (member) => member.part === 'bass',
      ),
    },
    {
      key: 'staff',
      label: 'STAFF',
      members: sortedMembers.filter(
        (member) => member.group_type === 'staff' && (member.part === 'other' || member.part === 'hidden'),
      ),
    },
    {
      key: 'accompanist',
      label: 'ACCOMPANISTS',
      members: sortedMembers.filter(
        (member) => member.part === 'accompanist',
      ),
    },
    {
      key: 'members',
      label: 'MEMBERS',
      members: sortedMembers.filter(
        (member) =>
          member.group_type !== 'staff' &&
          (member.part === 'other' || member.part === 'hidden'),
      ),
    },
  ]
}
