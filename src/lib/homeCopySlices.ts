import type { EditorTextRun } from '../types/siteEditor'

export type HomeCopyPart = {
  sourceKey?: string
  text: string
  fullText?: string
  offset?: number
  collapseWhitespace?: boolean
}

/** Match the existing trimmed, nonempty line layout while retaining UTF-16 source positions. */
export function splitHomeCopyLines(text: string): Array<{ text: string; offset: number }> {
  let offset = 0
  return text.split('\n').flatMap(raw => {
    const line = raw.trim()
    const entry = line ? [{ text: line, offset: offset + raw.indexOf(line) }] : []
    offset += raw.length + 1
    return entry
  })
}

/** Keep each CMS paragraph field's identity through the existing blank-line split. */
export function splitHomeParagraphCopy(paragraphs: readonly string[]): HomeCopyPart[] {
  return paragraphs.flatMap((fullText, index) => Array.from(fullText.matchAll(/[\s\S]*?(?:\n{2,}|$)/g)).flatMap(match => {
    const text = match[0].replace(/\n{2,}$/, '')
    return text.replace(/\s+/g, ' ').trim() ? [{
      sourceKey: `home.current.about.paragraphs.${index + 1}`,
      text, fullText, offset: match.index, collapseWhitespace: true,
    }] : []
  }))
}

/** Project ranges only through the known trim/whitespace-collapse transform. */
export function projectHomeCopyRuns(part: HomeCopyPart, runs: readonly EditorTextRun[]): { text: string; runs: EditorTextRun[] } {
  const offset = part.offset ?? 0
  const result: { text: string; runs: EditorTextRun[] } = { text: '', runs: [] }
  const append = (start: number, end: number, run: EditorTextRun) => {
    if (start >= end) return
    const previous = result.runs.at(-1)
    if (previous?.end === start && previous.style.fontFamily === run.style.fontFamily && previous.style.fontSize === run.style.fontSize) previous.end = end
    else result.runs.push({ start, end, style: run.style })
  }
  if (!part.collapseWhitespace) {
    result.text = part.text
    for (const run of runs) append(Math.max(0, run.start - offset), Math.min(part.text.length, run.end - offset), run)
    return result
  }
  for (const match of part.text.matchAll(/\S+|\s+/g)) {
    const whitespace = /^\s/.test(match[0])
    if (whitespace && (match.index === 0 || match.index + match[0].length === part.text.length)) continue
    const start = result.text.length
    const sourceStart = offset + match.index
    const text = whitespace ? ' ' : match[0]
    result.text += text
    // The first original whitespace represents a collapsed space; hidden trailing
    // whitespace never contributes a style to a different visible character.
    for (const run of runs) {
      if (whitespace) {
        if (run.start <= sourceStart && run.end > sourceStart) append(start, start + 1, run)
      } else {
        append(start + Math.max(0, run.start - sourceStart), start + Math.min(text.length, run.end - sourceStart), run)
      }
    }
  }
  return result
}
