import type { EditorPageId, SiteEditorDocument, SiteEditorDocuments } from '../types/siteEditor'

type PublishedResult = {
  data: Array<{ page_key: EditorPageId; document: SiteEditorDocument }> | null
  error: string | null
}

/** A bounded first-read gate: null means keep original content, {} is a valid empty publication. */
export async function loadPublishedEditorDocuments(load: () => Promise<PublishedResult>, timeoutMs = 8000): Promise<SiteEditorDocuments | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const result = await Promise.race([
      load(),
      new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), timeoutMs) }),
    ])
    return result?.data && !result.error
      ? Object.fromEntries(result.data.map(row => [row.page_key, row.document])) : null
  } catch {
    return null
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}
