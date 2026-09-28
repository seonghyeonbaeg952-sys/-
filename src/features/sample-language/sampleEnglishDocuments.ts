import { emptySiteEditorDocument, EDITOR_PAGE_IDS } from '../../lib/siteEditorModel'
import type { SiteEditorDocuments, SiteEditorDocument } from '../../types/siteEditor'

/** Inherit visual settings, never Korean range offsets or ordinary copy. The
 * original documents remain immutable; publication is a different API scope. */
export function sampleEnglishDocuments(source: SiteEditorDocuments, english: SiteEditorDocuments): SiteEditorDocuments {
  const result: SiteEditorDocuments = {}
  for (const page of EDITOR_PAGE_IDS) {
    const original = source[page], translated = english[page]
    if (!original && !translated) continue
    const document: SiteEditorDocument = { ...emptySiteEditorDocument(), ...translated }
    document.appearance = Object.fromEntries(['shared', 'mobile', 'tablet', 'desktop'].map(scope => [scope, {
      ...original?.appearance[scope as keyof SiteEditorDocument['appearance']],
      ...translated?.appearance[scope as keyof SiteEditorDocument['appearance']],
    }]))
    document.textLayouts = Object.fromEntries(['mobile', 'tablet', 'desktop'].map(device => [device, {
      ...original?.textLayouts?.[device as 'mobile' | 'tablet' | 'desktop'],
      ...translated?.textLayouts?.[device as 'mobile' | 'tablet' | 'desktop'],
    }]))
    // Additional boxes are structural content, so retain them in the sample.
    const boxes = Object.fromEntries(Object.entries(original?.copy ?? {}).filter(([key]) => key.includes('.box.')))
    document.copy = { ...boxes, ...translated?.copy }
    result[page] = document
  }
  return result
}
