import { useImperativeHandle, useLayoutEffect, useRef, type CSSProperties, type ElementType, type HTMLAttributes, type ReactElement } from 'react'
import { getTextLayoutDefinition } from '../../content/textLayoutCatalog'
import { resolveTextLayout } from '../../lib/siteEditorLayout'
import { useSiteEditor } from './useSiteEditor'

type NativeTextProps = HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }

/** No wrapper or style changes in the default published document. */
export function EditableLayout({ id, children, nativeTag }: { id: string; children: ReactElement<NativeTextProps>; nativeTag?: 'h1' | 'h2' | 'h3' | 'p' | 'div' }) {
  const context = useSiteEditor()
  const definition = getTextLayoutDefinition(id)
  const value = definition ? resolveTextLayout(context.documents[definition.page], context.device, id) : undefined
  const element = useRef<HTMLElement | null>(null)
  const tag = typeof children.type === 'string' ? children.type : nativeTag
  const shouldClone = Boolean(definition && tag && /^(h[1-6]|p|div|span|blockquote)$/.test(tag) && (context.isPreview || value))
  useImperativeHandle(shouldClone ? children.props.ref : undefined, () => element.current!)
  const x = value?.offsetX ?? 0
  const y = value?.offsetY ?? 0
  const hasLayout = Boolean(value)
  const width = value?.width
  const textAlign = value?.textAlign
  useLayoutEffect(() => {
    const node = element.current
    if (!node || !hasLayout) return
    // Reset to the stored origin before measuring. A previous resize may have
    // clamped the rendered offset without changing React's style prop.
    node.style.translate = `${x}px ${y}px`
    let actualX = x
    let actualY = y
    const measure = () => {
      const box = node.getBoundingClientRect()
      const section = node.closest('section, main')?.getBoundingClientRect()
      const left = box.left - actualX
      const top = box.top - actualY
      // Preserve the stored value but keep the rendered block reachable after a resize.
      const minLeft = Math.max(0, section?.left ?? 0)
      const maxRight = Math.min(document.documentElement.clientWidth, section?.right ?? window.innerWidth)
      actualX = Math.max(minLeft - left, Math.min(x, Math.max(minLeft - left, maxRight - left - box.width)))
      if (section && section.height >= box.height) actualY = Math.max(section.top - top, Math.min(y, section.bottom - top - box.height))
      node.style.translate = `${actualX}px ${actualY}px`
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    if (node.parentElement) observer.observe(node.parentElement)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [hasLayout, x, y, width, textAlign, context.isPreview])

  // nativeTag is an explicit code-only adapter for ref-forwarding motion elements.
  if (!shouldClone || !definition) return children
  const style: CSSProperties = { ...children.props.style, ...(value ? {
    translate: `${x}px ${y}px`,
    ...(value.width !== undefined ? { width: `${value.width}%`, maxWidth: '100%', height: 'auto' } : {}),
    ...(value.textAlign ? { textAlign: value.textAlign } : {}),
  } : {}) }
  const NativeElement = children.type as ElementType<NativeTextProps>
  return <NativeElement {...children.props} key={children.key} ref={element}
    {...(context.isPreview ? { 'data-site-layout': id, 'data-site-layout-group': definition.group, 'data-site-layout-value': JSON.stringify(value ?? {}) } : {})}
    {...(value ? { style } : {})} />
}
