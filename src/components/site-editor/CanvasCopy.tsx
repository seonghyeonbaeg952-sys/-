import { useEffect, useId, useState, useSyncExternalStore, type CSSProperties, type DetailedHTMLProps, type ReactNode } from 'react'
import type { EditorPageId } from '../../types/siteEditor'
import { getTextLayoutDefinition } from '../../content/textLayoutCatalog'
import { resolveTextLayout } from '../../lib/siteEditorLayout'
import { useSiteEditor } from './useSiteEditor'
import { useTextBoxLayout } from './useTextBoxLayout'
import './site-editor-text-box.css'

declare module 'react' {
  // React's intrinsic-element augmentation requires its JSX namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'smyc-edit-target': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

export type CanvasCopyPart = { key?: string; text: string; fullText?: string; offset?: number; collapseWhitespace?: boolean }

export type CanvasCopyTarget = {
  instanceId: string
  ownerPage: EditorPageId
  key: string
  text: string
  fullText: string
  offset: number
  parts?: readonly CanvasCopyPart[]
  element: HTMLElement
}

export type CanvasCopyRegistry = {
  register: (target: CanvasCopyTarget) => () => void
  subscribe: (listener: () => void) => () => void
  getActiveId: () => string | null
}

const subscribeNone = () => () => {}
const getNoSelection = () => null

/** Only a connected administrator preview registers explicit source identities. */
export function CanvasCopy({ page, id, text, fullText = text, offset = 0, parts, children, layoutTarget = true }: {
  page: EditorPageId; id: string; text: string; fullText?: string; offset?: number; parts?: readonly CanvasCopyPart[]; children: ReactNode; layoutTarget?: boolean
}) {
  const context = useSiteEditor()
  const registry = context.isPreview ? context.canvas : undefined
  const definition = layoutTarget ? getTextLayoutDefinition(id) : undefined
  const layout = definition?.page === page ? resolveTextLayout(context.documents[page], context.device, id) : undefined
  const reactId = useId()
  const instanceId = `copy-${reactId.replace(/[^A-Za-z0-9_.:-]/g, '')}`
  const element = useTextBoxLayout(layout)
  const activeId = useSyncExternalStore(registry?.subscribe ?? subscribeNone, registry?.getActiveId ?? getNoSelection, getNoSelection)
  const active = activeId === instanceId
  const [snapshot, setSnapshot] = useState({ children })
  if (!active && snapshot.children !== children) setSnapshot({ children })

  useEffect(() => {
    const node = element.current
    if (!registry || !node || active) return
    return registry.register({ instanceId, ownerPage: page, key: id, text, fullText, offset, ...(parts ? { parts } : {}), element: node })
  }, [registry, instanceId, page, id, text, fullText, offset, parts, active, element])

  if (!registry && !layout) return children
  const style: CSSProperties | undefined = layout ? { display: 'inline-block', verticalAlign: 'baseline',
    translate: `${layout.offsetX ?? 0}px ${layout.offsetY ?? 0}px`,
    ...(layout.width !== undefined ? { width: `${layout.width}%`, maxWidth: 'none', height: 'auto' } : {}),
    ...(layout.textAlign ? { textAlign: layout.textAlign } : {}) } : undefined
  return <smyc-edit-target ref={element} style={style}
    {...(layout?.width !== undefined ? { 'data-site-manual-width': '' } : {})}
    {...(registry ? { 'data-canvas-target': instanceId, 'data-canvas-copy-key': id, 'data-canvas-owner-page': page } : {})}
    {...(context.isPreview && definition?.page === page ? { 'data-site-layout': id, 'data-site-layout-group': definition.group, 'data-site-layout-value': JSON.stringify(layout ?? {}) } : {})}>
    {active ? snapshot.children : children}
  </smyc-edit-target>
}
