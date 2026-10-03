type FilterSelectPositionInput = {
  triggerTop: number
  triggerBottom: number
  viewportTop: number
  viewportBottom: number
  optionCount: number
  scale?: number
  gap?: number
}

export function filterSelectPosition({ triggerTop, triggerBottom, viewportTop, viewportBottom, optionCount, scale = 1, gap = 8 }: FilterSelectPositionInput) {
  const effectiveScale = Number.isFinite(scale) && scale > 0 ? scale : 1
  const limit = Math.min(Math.max(0, viewportBottom - viewportTop) / 2, 340 * effectiveScale)
  const required = Math.min((Math.max(0, optionCount) * 44 + 18) * effectiveScale, limit)
  const above = Math.max(0, triggerTop - viewportTop - gap * 2)
  const below = Math.max(0, viewportBottom - triggerBottom - gap * 2)
  const opensAbove = below < required && above > below
  return { opensAbove, maxHeight: Math.min(limit, opensAbove ? above : below) / effectiveScale }
}
