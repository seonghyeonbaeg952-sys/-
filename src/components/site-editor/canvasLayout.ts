type ParentBox = { left: number; top: number; width: number; paddingLeft: number; paddingRight: number; paddingTop: number; borderLeft: number; borderRight: number; borderTop: number }
type Box = { left: number; top: number; width: number; height: number }
/** DOM rectangles are visual pixels; a scaled page still lays out children in CSS pixels. */
export function getCanvasScaleMetrics(visual: { width: number; height: number }, layout: { width: number; height: number }) {
  const ratio = (visible: number, original: number) => original > 0 && Number.isFinite(visible / original) && visible > 0 ? visible / original : 1
  return { x: ratio(visual.width, layout.width), y: ratio(visual.height, layout.height) }
}
export function toCanvasLayoutPixels(visualPixels: number, scale: number) {
  return visualPixels / scale
}
/** A title that is visually one line should not acquire an artificial column break on selection. */
export function shouldAutoExpandCanvasLine(text: string, glyphHeight: number, lineHeight: number): boolean {
  return !/[\r\n]/.test(text) && lineHeight > 0 && glyphHeight <= lineHeight * 1.55
}
/** A selection outline never participates in layout. Editing reuses the line box. */
export function getCanvasOverlayBox(parent: ParentBox, glyph: { left: number; top: number; right: number }, entireLine: boolean, inline?: { naturalWidth: number; alignment: 'left' | 'center' | 'right' }) {
  if (!entireLine && inline) {
    const start = parent.left + parent.borderLeft + parent.paddingLeft
    const end = parent.left + parent.width - parent.borderRight - parent.paddingRight
    const anchor = inline.alignment === 'center' ? (glyph.left + glyph.right) / 2 : inline.alignment === 'right' ? glyph.right : glyph.left
    const available = inline.alignment === 'center' ? 2 * Math.min(anchor - start, end - anchor)
      : inline.alignment === 'right' ? anchor - start : end - anchor
    const width = Math.max(44, Math.min(inline.naturalWidth, available))
    const left = inline.alignment === 'center' ? anchor - width / 2 : inline.alignment === 'right' ? anchor - width : anchor
    return { left: Math.max(start, Math.min(left, end - width)), top: glyph.top, width, calibrate: true }
  }
  const left = entireLine ? parent.left + parent.borderLeft + parent.paddingLeft : glyph.left
  return { left, top: entireLine ? parent.top + parent.borderTop + parent.paddingTop : glyph.top,
    width: Math.max(44, parent.left + parent.width - parent.borderRight - parent.paddingRight - left), calibrate: !entireLine }
}

/** Current content only: original hidden glyph bounds must never prevent shrink. */
export function getCanvasLiveBounds(editor: Box, glyph: Box | null, minimumHeight: number): Box {
  const visible = glyph && glyph.width > 0 && glyph.height > 0 ? glyph : null
  const left = Math.min(editor.left, visible?.left ?? editor.left), top = Math.min(editor.top, visible?.top ?? editor.top)
  const right = Math.max(editor.left + editor.width, visible ? visible.left + visible.width : editor.left)
  const bottom = Math.max(editor.top + Math.max(editor.height, minimumHeight), visible ? visible.top + visible.height : editor.top)
  return { left, top, width: right - left, height: bottom - top }
}
