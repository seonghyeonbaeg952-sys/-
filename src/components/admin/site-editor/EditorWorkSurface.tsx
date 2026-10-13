import type { ReactNode } from 'react'

/** Visibility must never unmount the inspector's unapplied numeric input. */
export function EditorWorkSurface({ placing, panel, children, panelOpen = true, panelLocked = false,
  panelId = 'site-editor-inspector', panelLabel, onPanelToggle }: {
  placing: boolean
  panel: ReactNode
  children: ReactNode
  panelOpen?: boolean
  panelLocked?: boolean
  panelId?: string
  panelLabel?: string
  onPanelToggle?: () => void
}) {
  return <div className={`site-editor__editing-surface${placing ? ' site-editor__editing-surface--placing' : ''}`} data-inspector-open={placing && panelOpen}>
    <div className="site-editor__canvas-stack">{children}</div>
    {placing && panel ? <aside className="site-editor__inspector" aria-label="선택 문구 속성">
      <div className="site-editor__inspector-heading">
        <div><strong>선택 속성</strong><span title={panelLabel}>{panelLabel ?? '문구를 선택하세요'}</span></div>
        {onPanelToggle ? <button type="button" aria-controls={panelId} aria-expanded={panelOpen}
          aria-label={panelOpen ? '선택 속성 접기' : '선택 속성 펼치기'} disabled={panelLocked}
          onClick={() => { if (!panelLocked) onPanelToggle() }}>{panelOpen ? '접기' : '펼치기'}</button> : null}
      </div>
      <div id={panelId} hidden={!panelOpen}>{panel}</div>
    </aside> : null}
  </div>
}
