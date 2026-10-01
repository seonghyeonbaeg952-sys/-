import { siteCopyDefinitions } from '../../content/siteCopyCatalog'
import { mapHomeContentCopy } from '../../lib/homeEditorOverrides'
import { resolveEditorCopy } from '../../lib/siteEditorModel'
import type { HomeContentV2 } from '../../types/homeContent'
import type { EditorDevice, EditorPageId, SiteEditorDocuments } from '../../types/siteEditor'
import { englishEditorialBaseline } from './englishEditorialBaseline'

const englishCopySources = new Map(siteCopyDefinitions.filter(field => !field.inputType || field.inputType === 'text' || field.inputType === 'textarea')
  .map(field => [field.key, { page: field.page, sourceKey: field.sourceKey ?? field.key, text: field.defaultValue }] as const))

/** A Korean publication is never an English text fallback. Only the stable
 * catalogue source and the independently published English document may supply it. */
export function resolveEnglishPageCopy(
  english: SiteEditorDocuments, page: EditorPageId, key: string, fallback: string, device: EditorDevice,
  translate: (source: string, key?: string) => string,
): string {
  const field = englishCopySources.get(key)
  const source = field?.page === page ? field.text : fallback
  const baseline = field?.page === page && Object.hasOwn(englishEditorialBaseline, key)
    ? englishEditorialBaseline[key] : translate(source, field?.sourceKey ?? key)
  return resolveEditorCopy(english, page, key, baseline, device)
}

export function resolveEnglishHomeCopy(
  content: HomeContentV2, english: SiteEditorDocuments, device: EditorDevice,
  translate: (source: string, key?: string) => string,
): HomeContentV2 {
  return mapHomeContentCopy(content, device, (key, sourceKey, fallback) => {
    const field = englishCopySources.get(key)
    const source = field?.page === 'home' ? field.text : fallback
    const baseline = field?.page === 'home' && Object.hasOwn(englishEditorialBaseline, key)
      ? englishEditorialBaseline[key] : translate(source, sourceKey)
    return resolveEditorCopy(english, 'home', key, baseline, device)
  })
}
