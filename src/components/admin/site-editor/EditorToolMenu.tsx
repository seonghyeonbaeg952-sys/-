import type { ReactNode } from 'react'

/** Native disclosure keeps secondary commands mounted and keyboard accessible. */
export function EditorToolMenu({ label, disabled = false, children }: {
  label: string
  disabled?: boolean
  children: ReactNode
}) {
  return <details className="site-editor__tool-menu" onKeyDown={event => {
    if (event.key !== 'Escape' || event.nativeEvent.isComposing || !event.currentTarget.open || !event.currentTarget.contains(event.target as Node)) return
    event.preventDefault(); event.stopPropagation()
    event.currentTarget.open = false
    event.currentTarget.querySelector('summary')?.focus()
  }} onBlur={event => {
    // A portal modal makes the background inert. Keep its trigger visible for
    // AdminModal's focus restoration; its own Escape handler closes the dialog.
    if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.ownerDocument.querySelector('[role="dialog"][aria-modal="true"]')) event.currentTarget.open = false
  }}>
    <summary aria-disabled={disabled} title={disabled ? '문구 편집이나 처리를 마친 뒤 사용할 수 있습니다.' : undefined}
      onClick={event => { if (disabled) event.preventDefault() }}>{label}</summary>
    <div className="site-editor__tool-menu-content">{children}</div>
  </details>
}
