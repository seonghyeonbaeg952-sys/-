import { useEffect, useId, useRef, useState, useSyncExternalStore, type DetailedHTMLProps, type ReactNode } from 'react'
import type { EditorPageId } from '../../types/siteEditor'
import { useSiteEditor } from './useSiteEditor'

declare module 'react' {
  // React's intrinsic-element augmentation requires its JSX namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'smyc-edit-target': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}

export type CanvasCopyTarget = {
  instanceId: string
  ownerPage: EditorPageId
  key: string
  text: string
  fullText: string
  offset: number
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
export function CanvasCopy({ page, id, text, fullText = text, offset = 0, children }: {
  page: EditorPageId; id: string; text: string; fullText?: string; offset?: number; children: ReactNode
}) {
  const context = useSiteEditor()
  const registry = context.isPreview ? context.canvas : undefined
  const reactId = useId()
  const instanceId = `copy-${reactId.replace(/[^A-Za-z0-9_.:-]/g, '')}`
  const element = useRef<HTMLElement>(null)
  const activeId = useSyncExternalStore(registry?.subscribe ?? subscribeNone, registry?.getActiveId ?? getNoSelection, getNoSelection)
  const active = activeId === instanceId
  const [snapshot, setSnapshot] = useState({ children })
  if (!active && snapshot.children !== children) setSnapshot({ children })

  useEffect(() => {
    const node = element.current
    if (!registry || !node || active) return
    return registry.register({ instanceId, ownerPage: page, key: id, text, fullText, offset, element: node })
  }, [registry, instanceId, page, id, text, fullText, offset, active])

  if (!registry) return children
  return <smyc-edit-target ref={element} data-canvas-target={instanceId}>{active ? snapshot.children : children}</smyc-edit-target>
}
