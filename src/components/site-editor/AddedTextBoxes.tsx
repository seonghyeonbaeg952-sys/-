import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { EditorPageId, SiteEditorDocument } from '../../types/siteEditor'
import { listEditorTextBoxes } from '../../lib/siteEditorAddedBoxes'
import { FormattedCopy } from './FormattedCopy'
import { useSiteEditor } from './useSiteEditor'

/** Added boxes live in a real section's flow until an editor explicitly moves them. */
export function AddedTextBoxes({ page, document }: { page: EditorPageId; document?: SiteEditorDocument }) {
  const { copy } = useSiteEditor()
  const boxes = useMemo(() => listEditorTextBoxes(document, page), [document, page])
  const [targets, setTargets] = useState<Map<string, HTMLElement>>(new Map())
  useEffect(() => {
    if (!boxes.length) return
    const collect = () => {
      const next = new Map<string, HTMLElement>()
      for (const box of boxes) {
        const node = window.document.getElementById(box.anchor) ?? (box.anchor.startsWith('class-')
          ? (() => {
            const matches = window.document.querySelectorAll<HTMLElement>(`main section.${box.anchor.slice(6)}`)
            return matches.length === 1 ? matches[0] : null
          })() : null)
        if (node instanceof HTMLElement && ['SECTION', 'MAIN'].includes(node.tagName)) next.set(box.id, node)
      }
      setTargets(previous => previous.size === next.size && [...next].every(([key, node]) => previous.get(key) === node) ? previous : next)
      return next.size === boxes.length
    }
    if (collect()) return
    const observer = new MutationObserver(() => { if (collect()) observer.disconnect() })
    observer.observe(window.document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [boxes])
  return boxes.flatMap(box => {
    const target = targets.get(box.id)
    if (!target?.isConnected) return []
    const text = copy(page, box.id, box.text)
    return [createPortal(<p data-site-added-box={box.id} style={{ display: 'block', maxWidth: '100%', minWidth: 0,
      margin: '16px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
      <FormattedCopy page={page} id={box.id} text={text} lineBreaks>{text}</FormattedCopy>
    </p>, target, box.id)]
  })
}
