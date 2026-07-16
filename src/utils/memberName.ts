import type { MemberRow, PublicMemberRow } from '../types/cms'

const partLabels: Record<MemberRow['part'], string> = {
  soprano: '소프라노',
  alto: '알토',
  tenor: '테너',
  bass: '베이스',
  other: '합창단',
}

const groupLabels: Record<MemberRow['group_type'], string> = {
  elementary: '초등부',
  middle: '중등부',
  high: '고등부',
  university: '대학부',
  staff: '스태프',
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

export function getProtectedMemberName(
  member: Pick<MemberRow, 'name' | 'name_display_type' | 'part'>,
) {
  const fallback = `${getMemberPartLabel(member.part)} 단원`
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
  member: Pick<PublicMemberRow, 'display_name' | 'part'>,
) {
  return member.display_name?.trim() || `${getMemberPartLabel(member.part)} 단원`
}
