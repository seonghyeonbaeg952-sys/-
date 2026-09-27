import type { ReactNode } from 'react'

/** Keep preview controls in their own flow so a tall sidebar cannot stretch their gaps. */
export function EditorWorkSurface({ placing, panel, children }: {
  placing: boolean
  panel: ReactNode
  children: ReactNode
}) {
  return <div className={`site-editor__editing-surface${placing ? ' site-editor__editing-surface--placing' : ''}`}>
    {panel}
    <div className="site-editor__canvas-stack">{children}</div>
  </div>
}
