import { getCanvasScaleMetrics } from './canvasLayout'

/** Percentage width uses the content box, not the glyph rectangle of an inline parent. */
export function getTextBoxWidthBasis(element: HTMLElement): number {
  let parent = element.parentElement
  while (parent) {
    const style = parent.ownerDocument?.defaultView?.getComputedStyle(parent)
    if (style && ['inline', 'contents'].includes(style.display)) { parent = parent.parentElement; continue }
    const rect = parent.getBoundingClientRect()
    const scale = getCanvasScaleMetrics(rect, { width: parent.offsetWidth, height: parent.offsetHeight })
    const inset = (name: string) => (Number.parseFloat(style?.getPropertyValue(name) ?? '') || 0) * scale.x
    const width = rect.width - inset('padding-left') - inset('padding-right') - inset('border-left-width') - inset('border-right-width')
    if (width > 0) return width
    parent = parent.parentElement
  }
  return 0
}

export function getTextBoxBounds(element: HTMLElement) {
  const doc = element.ownerDocument, view = doc?.defaultView
  const width = doc?.documentElement.clientWidth || view?.innerWidth || 0
  const section = element.closest('section, main')?.getBoundingClientRect()
  return { left: Math.max(0, section?.left ?? 0), right: Math.min(width, section?.right ?? width), section }
}
