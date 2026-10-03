import type { EditorPageId, SiteEditorDocument, SiteEditorDocuments } from '../types/siteEditor'

type PublishedResult = {
  data: Array<{ page_key: EditorPageId; document: SiteEditorDocument }> | null
  error: string | null
}

type PublicationResult<T> = { data: T | null; error: string | null }

/** Bound initial reads so a lost transport cannot leave a visitor behind a loader. */
export async function loadInitialPublication<T>(load: () => Promise<PublicationResult<T>>, timeoutMs = 8000): Promise<PublicationResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const unavailable: PublicationResult<T> = { data: null, error: 'Publication unavailable' }
  try {
    return await Promise.race([
      load(),
      new Promise<PublicationResult<T>>(resolve => { timer = setTimeout(() => resolve(unavailable), timeoutMs) }),
    ])
  } catch {
    return unavailable
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** Keep mounted copy/motion and canvas identities when polling returns the same publication. */
export function retainPublishedEditorDocuments(current: SiteEditorDocuments, incoming: SiteEditorDocuments): SiteEditorDocuments {
  return JSON.stringify(current) === JSON.stringify(incoming) ? current : incoming
}

/** A bounded first-read gate: null means keep original content, {} is a valid empty publication. */
export async function loadPublishedEditorDocuments(load: () => Promise<PublishedResult>, timeoutMs = 8000): Promise<SiteEditorDocuments | null> {
  const result = await loadInitialPublication(load, timeoutMs)
  return result.data && !result.error
    ? Object.fromEntries(result.data.map(row => [row.page_key, row.document])) : null
}
