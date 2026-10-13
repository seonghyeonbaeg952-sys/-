import { useLayoutEffect, useRef } from 'react'
import type { EditorTextLayout } from '../../types/siteEditor'
import { getCanvasScaleMetrics } from './canvasLayout'
import { getTextBoxBounds } from './textBoxGeometry'

/** Only explicitly edited boxes are constrained; untouched page markup stays untouched. */
export function useTextBoxLayout(layout?: EditorTextLayout) {
  const element = useRef<HTMLElement | null>(null)
  const x = layout?.offsetX ?? 0, y = layout?.offsetY ?? 0
  const width = layout?.width, align = layout?.textAlign, enabled = Boolean(layout)
  const lineHeight = layout?.lineHeight
  useLayoutEffect(() => {
    const node = element.current
    if (!node || !enabled) return
    node.style.translate = `${x}px ${y}px`
    let actualX = x, actualY = y
    let frame = 0
    const sectionNode = node.closest('section, main')
    const layoutNodes: HTMLElement[] = []
    for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
      layoutNodes.push(parent)
      if (parent === sectionNode) break
    }
    const entering = () => layoutNodes.some(target => {
      if (!target.style.transform || target.style.transform === 'none') return false
      const transform = node.ownerDocument.defaultView?.getComputedStyle(target).transform.replace(/\s/g, '')
      return transform && !['none', 'matrix(1,0,0,1,0,0)', 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)'].includes(transform)
    })
    const measure = () => {
      // Entrance transforms are not the stored box position. Clamping their
      // intermediate rectangles can leave a permanent offset after refresh.
      if (entering()) return
      let box = node.getBoundingClientRect()
      const scale = getCanvasScaleMetrics(box, { width: node.offsetWidth, height: node.offsetHeight })
      const { left: minLeft, right: maxRight, section } = getTextBoxBounds(node)
      if (width !== undefined) {
        // A small screen must not resurrect the old 100%-of-column restriction.
        const maxWidth = `${Math.max(0, maxRight - minLeft) / scale.x}px`
        if (node.style.maxWidth !== maxWidth) node.style.maxWidth = maxWidth
        box = node.getBoundingClientRect()
      }
      const left = box.left - actualX * scale.x, top = box.top - actualY * scale.y
      actualX = Math.max((minLeft - left) / scale.x, Math.min(x, Math.max((minLeft - left) / scale.x, (maxRight - left - box.width) / scale.x)))
      if (section && section.height >= box.height) actualY = Math.max((section.top - top) / scale.y, Math.min(y, (section.bottom - top - box.height) / scale.y))
      const translate = `${actualX}px ${actualY}px`
      if (node.style.translate !== translate) node.style.translate = translate
    }
    const scheduleMeasure = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => { frame = 0; measure() })
    }
    measure()
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(node)
    if (node.parentElement) observer.observe(node.parentElement)
    const section = node.closest('section, main')
    if (section) observer.observe(section)
    // Motion writes transform to style. Observe the box and its reveal parents
    // so the final resting frame is checked without an idle polling loop.
    const motionObserver = new MutationObserver(scheduleMeasure)
    for (const target of layoutNodes) motionObserver.observe(target, { attributes: true, attributeFilter: ['style'] })
    window.addEventListener('resize', scheduleMeasure)
    return () => { observer.disconnect(); motionObserver.disconnect(); window.cancelAnimationFrame(frame); window.removeEventListener('resize', scheduleMeasure) }
  }, [element, enabled, x, y, width, align, lineHeight])
  return element
}
