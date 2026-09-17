import { createElement, type ReactNode } from 'react'
import { homeAllEditorFields } from '../../lib/homeDeviceContent'
import { homeRichCopySourceKeys } from '../../content/homeRichCopyKeys'
import { projectHomeCopyRuns, type HomeCopyPart } from '../../lib/homeCopySlices'
import { resolveTextRuns } from '../../lib/siteEditorTextStyles'
import { FormattedCopy, TextRunContent } from '../site-editor/FormattedCopy'
import { CanvasCopy, type CanvasCopyPart } from '../site-editor/CanvasCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'

type HomeCopyProps = {
  sourceKey: string
  text: string
  fullText?: string
  offset?: number
  children?: ReactNode
  parts?: readonly HomeCopyPart[]
}

const homeFieldKeys = new Map(homeAllEditorFields.map(field => [`${field.device}:${field.sourceKey}`, field.key]))

/** Field identity is explicit; attributes and the content data remain plain strings. */
export function HomeCopy({ sourceKey, text, fullText, offset, children, parts }: HomeCopyProps) {
  const { device, documents } = useSiteEditor()
  if (parts) {
    const projected = parts.map(part => {
      const partKey = part.sourceKey ? homeFieldKeys.get(`${device}:${part.sourceKey}`) : undefined
      const source = part.fullText ?? part.text
      const sourceOffset = part.offset ?? 0
      const supported = part.sourceKey && homeRichCopySourceKeys[device].has(part.sourceKey)
      const runs = partKey && supported && source.slice(sourceOffset, sourceOffset + part.text.length) === part.text
        ? resolveTextRuns(documents.home, device, partKey, source) : []
      return projectHomeCopyRuns(part, runs)
    })
    const matches = projected.map(part => part.text).join('') === text
    const content = matches && projected.some(part => part.runs.length)
      ? createElement('smyc-text', { className: 'site-copy-text' }, projected.map((part, index) => <TextRunContent key={index} text={part.text} runs={part.runs} />))
      : children ?? text
    const canvasParts: CanvasCopyPart[] = matches ? parts.map(part => ({
      key: part.sourceKey && homeRichCopySourceKeys[device].has(part.sourceKey) ? homeFieldKeys.get(`${device}:${part.sourceKey}`) : undefined,
      text: part.text, fullText: part.fullText, offset: part.offset, collapseWhitespace: part.collapseWhitespace,
    })) : [{ text }]
    return <CanvasCopy page="home" id={canvasParts.find(part => part.key)?.key ?? ''} text={text} parts={canvasParts}>{content}</CanvasCopy>
  }
  const id = homeFieldKeys.get(`${device}:${sourceKey}`)
  if (!id || !homeRichCopySourceKeys[device].has(sourceKey)) return children ?? text
  return <FormattedCopy page="home" id={id} text={text} fullText={fullText} offset={offset}>{children}</FormattedCopy>
}
