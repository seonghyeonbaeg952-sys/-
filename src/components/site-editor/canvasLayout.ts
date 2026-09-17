type ParentBox = { left: number; top: number; width: number; paddingLeft: number; paddingRight: number; paddingTop: number; borderLeft: number; borderRight: number; borderTop: number }
/** A selection outline never participates in layout. Editing reuses the line box. */
export function getCanvasOverlayBox(parent: ParentBox, glyph: { left: number; top: number; right: number }, entireLine: boolean) {
  const left = entireLine ? parent.left + parent.borderLeft + parent.paddingLeft : glyph.left
  return { left, top: entireLine ? parent.top + parent.borderTop + parent.paddingTop : glyph.top,
    width: Math.max(44, parent.left + parent.width - parent.borderRight - parent.paddingRight - left), calibrate: !entireLine }
}
