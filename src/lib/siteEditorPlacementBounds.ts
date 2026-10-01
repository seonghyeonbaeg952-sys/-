import type { PlacementRect } from './siteEditorPlacementProtocol'

/** Keep ordinary boxes fully inside their section. Oversized editorial text
 * remains movable while leaving a readable portion inside the viewport. */
export function placementTravelRange(
  rect: PlacementRect,
  bounds: PlacementRect,
  axis: 'left' | 'top',
  size: 'width' | 'height',
): { min: number; max: number } {
  const extent = bounds[size]
  const overflow = Math.max(0, rect[size] - extent)
  const visible = overflow > 0
    ? Math.min(extent, Math.max(Math.min(120, extent), extent - overflow))
    : rect[size]
  return {
    min: bounds[axis] + visible - rect[axis] - rect[size],
    max: bounds[axis] + extent - visible - rect[axis],
  }
}
