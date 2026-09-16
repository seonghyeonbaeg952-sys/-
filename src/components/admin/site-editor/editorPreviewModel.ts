import type { EditorPageId } from '../../../types/siteEditor'
import { acceptSiteEditorMessage, type SiteEditorPreviewMessage } from '../../../lib/siteEditorPreview'

type Reply = Exclude<SiteEditorPreviewMessage, { type: 'smyc-editor:draft' }>

export function readEditorPreviewReply(
  event: Pick<MessageEvent, 'origin' | 'source' | 'data'>,
  expected: { source: Window; origin: string; nonce: string; page: EditorPageId },
): Reply | null {
  const message = acceptSiteEditorMessage(event, expected)
  return message?.type === 'smyc-editor:ready' || message?.type === 'smyc-editor:applied' ? message : null
}
