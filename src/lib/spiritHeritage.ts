function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function resolveSpiritSectionId(id: string) {
  const aliases: Record<string, string> = {
    'spirit-motet': 'spirit-lineage',
    'spirit-faith': 'spirit-lineage',
    'spirit-values': 'spirit-lineage',
    'spirit-education': 'spirit-lineage',
    'spirit-manifesto': 'spirit-community',
  }
  return Object.hasOwn(aliases, id) ? aliases[id] : id
}

export function getSpiritAnchorScrollTop(
  currentScrollY: number,
  targetViewportTop: number,
  headerOffset = 92,
) {
  return Math.max(0, currentScrollY + targetViewportTop - headerOffset)
}

export function getAcceleratedTimelineProgress(
  sectionProgress: number,
  completionPoint = 0.68,
) {
  if (completionPoint <= 0) {
    return 1
  }

  return clampUnit(sectionProgress / completionPoint)
}

export function getNextSpiritIndex(
  currentIndex: number,
  itemCount: number,
  direction: -1 | 1,
) {
  if (itemCount <= 0) {
    return -1
  }

  return (currentIndex + direction + itemCount) % itemCount
}

export function getMilestoneRevealProgress(
  sectionProgress: number,
  milestoneIndex: number,
  milestoneCount: number,
) {
  if (milestoneCount <= 0 || milestoneIndex < 0 || milestoneIndex >= milestoneCount) {
    return 0
  }

  const progress = clampUnit(sectionProgress)
  const segmentSize = 1 / milestoneCount
  const segmentStart = milestoneIndex * segmentSize

  return clampUnit((progress - segmentStart) / segmentSize)
}
