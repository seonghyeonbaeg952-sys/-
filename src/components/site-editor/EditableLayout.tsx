import { useImperativeHandle, type CSSProperties, type ElementType, type HTMLAttributes, type ReactElement } from 'react'
import { getTextLayoutDefinition } from '../../content/textLayoutCatalog'
import { resolveTextLayout } from '../../lib/siteEditorLayout'
import { useSiteEditor } from './useSiteEditor'
import { useTextBoxLayout } from './useTextBoxLayout'
import './site-editor-text-box.css'

type NativeTextProps = HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }

/** No wrapper or style changes in the default published document. */
export function EditableLayout({ id, children, nativeTag }: { id: string; children: ReactElement<NativeTextProps>; nativeTag?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span' }) {
  const context = useSiteEditor()
  const definition = getTextLayoutDefinition(id)
  const layout = definition ? resolveTextLayout(context.documents[definition.page], context.device, id) : undefined
  const value = definition?.positionOnly && layout ? {
    ...(layout.offsetX !== undefined ? { offsetX: layout.offsetX } : {}),
    ...(layout.offsetY !== undefined ? { offsetY: layout.offsetY } : {}),
  } : layout
  const element = useTextBoxLayout(value)
  const tag = typeof children.type === 'string' ? children.type : nativeTag
  const shouldClone = Boolean(definition && tag && /^(h[1-6]|p|div|span|blockquote)$/.test(tag) && (context.isPreview || value))
  useImperativeHandle(shouldClone ? children.props.ref : undefined, () => element.current!)
  const x = value?.offsetX ?? 0
  const y = value?.offsetY ?? 0

  // nativeTag is an explicit code-only adapter for ref-forwarding motion elements.
  if (!shouldClone || !definition) return children
  const style: CSSProperties = { ...children.props.style, ...(value ? {
    translate: `${x}px ${y}px`,
    ...(value.width !== undefined ? { width: `${value.width}%`, maxWidth: 'none', height: 'auto' } : {}),
    ...(value.textAlign ? { textAlign: value.textAlign } : {}),
    ...(value.lineHeight !== undefined ? { lineHeight: value.lineHeight, '--site-copy-line-height': value.lineHeight, height: 'auto' } : {}),
  } : {}) }
  const NativeElement = children.type as ElementType<NativeTextProps>
  return <NativeElement {...children.props} key={children.key} ref={element}
    {...(value?.width !== undefined ? { 'data-site-manual-width': '' } : {})}
    {...(value?.lineHeight !== undefined ? { 'data-site-manual-line-height': '' } : {})}
    {...(context.isPreview ? { 'data-site-layout': id, 'data-site-layout-group': definition.group, 'data-site-layout-value': JSON.stringify(value ?? {}) } : {})}
    {...(value ? { style } : {})} />
}
