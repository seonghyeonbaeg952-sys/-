import { EDITOR_FONT_FAMILIES, validateTextStyles } from '../../lib/siteEditorTextStyles'
import type { EditorTextRun } from '../../types/siteEditor'

export type CanvasDomSelection = { start: number; end: number }
type DomPoint = { node: Node; offset: number }
type TextMap = { text: string; positions: Map<Node, number[]>; points: DomPoint[] }

const isText = (node: Node) => node.nodeType === 3
const tag = (node: Node) => node.nodeType === 1 ? node.nodeName.toUpperCase() : ''
const isBlock = (node: Node) => tag(node) === 'DIV' || tag(node) === 'P'
const childrenOf = (node: Node) => Array.from(node.childNodes)

function hasContent(node: Node): boolean {
  return isText(node) ? Boolean(node.textContent) : isBlock(node) || tag(node) === 'BR' || childrenOf(node).some(hasContent)
}

/** One canonical text model for reading, native DOM positions and reverse caret placement. */
function scan(root: Node): TextMap {
  const positions = new Map<Node, number[]>()
  const points: DomPoint[] = []
  const priorities: number[] = []
  const state = { pendingBlock: false, forceBreak: false }
  let text = ''

  const remember = (node: Node, offset: number, position = text.length, priority = 1) => {
    const offsets = positions.get(node) ?? []
    offsets[offset] = position
    positions.set(node, offsets)
    if (priority > (priorities[position] ?? 0)) {
      points[position] = { node, offset }
      priorities[position] = priority
    }
  }
  const lineBreak = (before: DomPoint, after: DomPoint) => {
    remember(before.node, before.offset, text.length, 2)
    text += '\n'
    remember(after.node, after.offset, text.length, 2)
  }
  const flushBlock = (before: DomPoint, after: DomPoint) => {
    if (state.pendingBlock && (state.forceBreak || !text.endsWith('\n'))) lineBreak(before, after)
    state.pendingBlock = false
    state.forceBreak = false
  }

  const visitChildren = (node: Node, tail: boolean) => {
    const children = childrenOf(node)
    const lastContent = children.findLastIndex(hasContent)
    remember(node, 0)
    children.forEach((child, index) => {
      remember(node, index)
      visit(child, tail && index >= lastContent, { node, offset: index }, { node, offset: index + 1 })
      remember(node, index + 1)
    })
  }
  const visit = (node: Node, tail: boolean, before: DomPoint, after: DomPoint) => {
    if (isText(node)) {
      const value = node.textContent ?? ''
      if (value) flushBlock(before, { node, offset: 0 })
      const start = text.length
      for (let offset = 0; offset <= value.length; offset += 1) remember(node, offset, start + offset, 3)
      text += value
      return
    }
    if (tag(node) === 'BR') {
      flushBlock(before, { node, offset: 0 })
      remember(node, 0)
      // A final BR on an otherwise empty line is the browser's caret placeholder.
      if (!(tail && (!text || text.endsWith('\n')))) lineBreak(before, after)
      return
    }
    if (isBlock(node)) {
      if (state.pendingBlock) flushBlock(before, { node, offset: 0 })
      else if (text && !text.endsWith('\n')) lineBreak(before, { node, offset: 0 })
      const start = text.length
      visitChildren(node, true)
      state.forceBreak = (state.pendingBlock && state.forceBreak) || start === text.length
      state.pendingBlock = true
      return
    }
    if (hasContent(node)) flushBlock(before, { node, offset: 0 })
    visitChildren(node, tail)
  }

  if (isText(root)) visit(root, true, { node: root, offset: 0 }, { node: root, offset: root.textContent?.length ?? 0 })
  else visitChildren(root, true)
  return { text, positions, points }
}

export function readCanvasPlainText(root: Node): string {
  return scan(root).text
}

/** Backward native selections are returned as a normalized UTF-16 interval. */
export function captureCanvasSelection(root: HTMLElement): CanvasDomSelection | null {
  try {
    const selection = root.ownerDocument?.getSelection()
    if (!selection || selection.rangeCount === 0 || !selection.anchorNode || !selection.focusNode) return null
    const { positions } = scan(root)
    const anchor = positions.get(selection.anchorNode)?.[selection.anchorOffset]
    const focus = positions.get(selection.focusNode)?.[selection.focusOffset]
    if (anchor === undefined || focus === undefined) return null
    return { start: Math.min(anchor, focus), end: Math.max(anchor, focus) }
  } catch { return null }
}

/** Clamps stale offsets; caller reversal is retained when the native API permits it. */
export function restoreCanvasSelection(root: HTMLElement, range: CanvasDomSelection): void {
  try {
    if (!Number.isFinite(range.start) || !Number.isFinite(range.end)) return
    const document = root.ownerDocument
    const selection = document?.getSelection()
    if (!selection) return
    const { text, points } = scan(root)
    const clamp = (offset: number) => Math.max(0, Math.min(text.length, Math.trunc(offset)))
    const start = clamp(range.start), end = clamp(range.end)
    const anchor = points[start] ?? { node: root, offset: 0 }, focus = points[end] ?? { node: root, offset: 0 }
    if (typeof selection.setBaseAndExtent === 'function') selection.setBaseAndExtent(anchor.node, anchor.offset, focus.node, focus.offset)
    else {
      const nativeRange = document.createRange()
      const first = start <= end ? anchor : focus, last = start <= end ? focus : anchor
      nativeRange.setStart(first.node, first.offset)
      nativeRange.setEnd(last.node, last.offset)
      selection.removeAllRanges()
      selection.addRange(nativeRange)
    }
  } catch { /* A detached or replaced input host must not crash the editor. */ }
}

/** Call only at explicit paint/undo boundaries, never during composition or native input. */
export function paintCanvasText(root: HTMLElement, text: string, runs: readonly EditorTextRun[]): void {
  const document = root.ownerDocument
  if (!document) return
  const fragment = document.createDocumentFragment()
  const appendText = (parent: Node, value: string) => {
    value.split('\n').forEach((line, index) => {
      if (index) parent.appendChild(document.createElement('br'))
      if (line) parent.appendChild(document.createTextNode(line))
    })
  }
  const safeRuns = validateTextStyles({ shared: { canvas: { text, runs } } }) ? [] : runs
  let cursor = 0
  for (const run of safeRuns) {
    if (run.start > cursor) appendText(fragment, text.slice(cursor, run.start))
    const node = document.createElement('smyc-copy')
    node.setAttribute('data-canvas-run', '')
    if (run.style.fontFamily !== undefined) node.style.fontFamily = EDITOR_FONT_FAMILIES[run.style.fontFamily]
    if (run.style.fontSize !== undefined) node.style.fontSize = `${run.style.fontSize}px`
    if (run.style.color !== undefined) node.style.color = run.style.color
    if (run.style.fontWeight !== undefined) node.style.fontWeight = String(run.style.fontWeight)
    if (run.style.fontStyle !== undefined) node.style.fontStyle = run.style.fontStyle
    if (run.style.textDecoration !== undefined) node.style.textDecoration = run.style.textDecoration
    appendText(node, text.slice(run.start, run.end))
    fragment.appendChild(node)
    cursor = run.end
  }
  if (cursor < text.length) appendText(fragment, text.slice(cursor))
  if (text.endsWith('\n')) fragment.appendChild(document.createElement('br'))
  root.replaceChildren(fragment)
}
