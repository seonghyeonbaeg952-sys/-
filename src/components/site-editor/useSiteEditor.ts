import { createContext, useContext } from 'react'
import type { EditorDevice, EditorPageId, SiteEditorDocuments } from '../../types/siteEditor'

export type SiteEditorContextValue = {
  copy: (page: EditorPageId, key: string, fallback: string) => string
  documents: SiteEditorDocuments
  device: EditorDevice
  isPreview: boolean
}

export const SiteEditorContext = createContext<SiteEditorContextValue>({
  copy: (_page, _key, fallback) => fallback, documents: {}, device: 'desktop', isPreview: false,
})

export function useSiteEditor(): SiteEditorContextValue {
  return useContext(SiteEditorContext)
}
