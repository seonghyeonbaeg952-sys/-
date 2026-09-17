import { createElement, Fragment, type CSSProperties, type ReactNode } from 'react'
import { EDITOR_FONT_FAMILIES, resolveTextRuns } from '../../lib/siteEditorTextStyles'
import type { EditorPageId, EditorTextRun } from '../../types/siteEditor'
import { useSiteEditor } from './useSiteEditor'
import { CanvasCopy } from './CanvasCopy'

type Props = {
  page: EditorPageId
  id: string
  text: string
  fullText?: string
  offset?: number
  children?: ReactNode
  lineBreaks?: boolean
}

function lines(text: string, enabled: boolean) {
  return enabled ? text.split('\n').map((line, i) => <Fragment key={i}>{i ? <br /> : null}{line}</Fragment>) : text
}

/** Render only explicit ranges, never HTML or a best-effort match against DOM text. */
export function TextRunContent({ text, runs, offset = 0, lineBreaks = false }: {
  text: string; runs: EditorTextRun[]; offset?: number; lineBreaks?: boolean
}) {
  const children: ReactNode[] = []
  let cursor = 0
  for (const run of runs) {
    const start = Math.max(0, run.start - offset)
    const end = Math.min(text.length, run.end - offset)
    if (end <= start) continue
    if (start > cursor) children.push(<Fragment key={`plain-${cursor}`}>{lines(text.slice(cursor, start), lineBreaks)}</Fragment>)
    const font = run.style.fontFamily ? EDITOR_FONT_FAMILIES[run.style.fontFamily] : undefined
    const size = run.style.fontSize === undefined ? undefined : `${run.style.fontSize}px`
    const { color, fontWeight, fontStyle, textDecoration } = run.style
    const style = {
      fontFamily: font, fontSize: size, color, fontWeight, fontStyle, textDecoration,
      '--site-copy-font': font, '--site-copy-size': size, '--site-copy-color': color,
      '--site-copy-weight': fontWeight, '--site-copy-slant': fontStyle, '--site-copy-decoration': textDecoration,
    } as CSSProperties
    // A fixed inert inline tag avoids legacy `heading span` layout rules that
    // would otherwise turn a selected word into an extra block or ornament.
    children.push(createElement('smyc-copy', {
      key: `style-${start}`, className: 'site-copy-format',
      'data-site-copy-font': font ? '' : undefined, 'data-site-copy-size': size ? '' : undefined,
      'data-site-copy-color': color ? '' : undefined, 'data-site-copy-weight': fontWeight ? '' : undefined,
      'data-site-copy-slant': fontStyle ? '' : undefined, 'data-site-copy-decoration': textDecoration ? '' : undefined,
      style,
    }, lines(text.slice(start, end), lineBreaks)))
    cursor = end
  }
  if (cursor < text.length) children.push(<Fragment key={`plain-${cursor}`}>{lines(text.slice(cursor), lineBreaks)}</Fragment>)
  return <>{children}</>
}

export function FormattedCopy({ page, id, text, fullText = text, offset = 0, children, lineBreaks }: Props) {
  const { documents, device } = useSiteEditor()
  const runs = resolveTextRuns(documents[page], device, id, fullText)
  // Existing accents, literal whitespace and element structure remain untouched
  // until the administrator explicitly formats this exact text.
  const canFormat = runs.some(run => run.start < offset + text.length && run.end > offset) && fullText.slice(offset, offset + text.length) === text
  // A previously anonymous text item must remain one item inside flex/grid
  // headings, even when it now contains several differently formatted runs.
  const content = canFormat
    ? createElement('smyc-text', { className: 'site-copy-text' }, <TextRunContent text={text} runs={runs} offset={offset} lineBreaks={lineBreaks} />)
    : children ?? text
  return <CanvasCopy page={page} id={id} text={text} fullText={fullText} offset={offset}>{content}</CanvasCopy>
}
