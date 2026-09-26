import { useLayoutEffect, useRef } from 'react'
import type { EditorTextLayout } from '../../types/siteEditor'
import { getCanvasScaleMetrics } from './canvasLayout'
import { getTextBoxBounds } from './textBoxGeometry'

/** Only explicitly edited boxes are constrained; untouched page markup stays untouched. */
export function useTextBoxLayout(layout?: EditorTextLayout) {
  const element = useRef<HTMLElement | null>(null)
  const x = layout?.offsetX ?? 0, y = layout?.offsetY ?? 0
  const width = layout?.width, align = layout?.textAlign, enabled = Boolean(layout)
  useLayoutEffect(() => {
    const node = element.current
    if (!node || !enabled) return
    node.style.translate = `${x}px ${y}px`
    let actualX = x, actualY = y
    const measure = () => {
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
      node.style.translate = `${actualX}px ${actualY}px`
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    if (node.parentElement) observer.observe(node.parentElement)
    const section = node.closest('section, main')
    if (section) observer.observe(section)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [element, enabled, x, y, width, align])
  return element
}
