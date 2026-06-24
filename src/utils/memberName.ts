import type { MemberRow } from '../types/cms'

const partLabels: Record<MemberRow['part'], string> = {
  soprano: '소프라노',
  alto: '알토',
  tenor: '테너',
  bass: '베이스',
  other: '합창단',
}

export function getMemberPartLabel(part: MemberRow['part']) {
  return partLabels[part] ?? partLabels.other
}

export function getProtectedMemberName(member: Pick<MemberRow, 'name' | 'name_display_type' | 'part'>) {
  const fallback = `${getMemberPartLabel(member.part)} 단원`
  const name = member.name?.trim()

  if (!name) {
    return fallback
  }

  if (member.name_display_type === 'full') {
    return name
  }

  if (member.name_display_type === 'partial') {
    return `${name[0]}○○`
  }

  return fallback
}
