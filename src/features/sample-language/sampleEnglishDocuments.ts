import { emptySiteEditorDocument, EDITOR_PAGE_IDS } from '../../lib/siteEditorModel'
import type { SiteEditorDocuments, SiteEditorDocument } from '../../types/siteEditor'
import { repairLegacyEnglishDocument } from './englishLegacyRepair'

/** Inherit page appearance, never Korean range offsets, placement or copy. The
 * original documents remain immutable; publication is a different API scope. */
export function sampleEnglishDocuments(source: SiteEditorDocuments, english: SiteEditorDocuments): SiteEditorDocuments {
  const result: SiteEditorDocuments = {}
  for (const page of EDITOR_PAGE_IDS) {
    const original = source[page], translated = english[page] ? repairLegacyEnglishDocument(page, english[page]) : undefined
    if (!original && !translated) continue
    const document: SiteEditorDocument = { ...emptySiteEditorDocument(), ...translated }
    document.appearance = Object.fromEntries(['shared', 'mobile', 'tablet', 'desktop'].map(scope => [scope, {
      ...original?.appearance[scope as keyof SiteEditorDocument['appearance']],
      ...translated?.appearance[scope as keyof SiteEditorDocument['appearance']],
    }]))
    // Text boxes contain authored copy: Korean boxes must not leak into English.
    document.copy = { ...translated?.copy }
    result[page] = document
  }
  return result
}
