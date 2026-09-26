import type { PlacementBlock } from '../../../lib/siteEditorPlacementProtocol'
import type { EditorTextLayout } from '../../../types/siteEditor'
import { EDITOR_TEXT_WIDTH_MIN, EDITOR_TEXT_WIDTH_MAX } from '../../../lib/siteEditorLayout'

/** Geometry is display-only; the controller separately validates IDs and saved-value CAS. */
export function constrainLayoutInput(block: PlacementBlock, next: EditorTextLayout | undefined): { value: EditorTextLayout | undefined; limited: boolean } {
  const value = next ? { ...next } : undefined
  let limited = false
  if (value) {
    if (value.width !== undefined && block.widthBasis) {
      const available = Math.max(0, block.bounds.left + block.bounds.width - block.rect.left)
      const maximum = Math.max(EDITOR_TEXT_WIDTH_MIN, Math.min(EDITOR_TEXT_WIDTH_MAX, available / block.widthBasis * 100))
      const width = Math.max(EDITOR_TEXT_WIDTH_MIN, Math.min(maximum, value.width))
      limited ||= width !== value.width
      value.width = Math.floor(width * 10) / 10
    }
    for (const [key, axis, size] of [['offsetX', 'left', 'width'], ['offsetY', 'top', 'height']] as const) {
      if (value[key] === undefined) continue
      const rendered = key === 'offsetX' ? block.renderedOffsets?.x : block.renderedOffsets?.y
      const original = block.rect[axis] - (rendered ?? block.value[key] ?? 0)
      const min = block.bounds[axis] - original
      const max = Math.max(min, block.bounds[axis] + block.bounds[size] - original - block.rect[size])
      const constrained = Math.max(-2000, Math.min(2000, Math.max(min, Math.min(max, value[key]))))
      limited ||= constrained !== value[key]
      value[key] = Math.round(constrained * 10) / 10
    }
  }
  return { value, limited }
}

export function alignLayoutToBlock(block: PlacementBlock, reference: PlacementBlock, axis: 'x' | 'y'): EditorTextLayout | null {
  if (block.id === reference.id || block.group !== reference.group) return null
  const key = axis === 'x' ? 'offsetX' : 'offsetY', start = axis === 'x' ? 'left' : 'top', size = axis === 'x' ? 'width' : 'height'
  const rendered = axis === 'x' ? block.renderedOffsets?.x : block.renderedOffsets?.y
  return { ...block.value, [key]: Math.round(((rendered ?? block.value[key] ?? 0) + reference.rect[start] + reference.rect[size] / 2 - block.rect[start] - block.rect[size] / 2) * 10) / 10 }
}
