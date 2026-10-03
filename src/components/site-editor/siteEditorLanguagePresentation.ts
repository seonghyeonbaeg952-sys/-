import type { EditorDevice, SiteEditorDocuments } from '../../types/siteEditor'
import { resolveEditorCopy } from '../../lib/siteEditorModel'
import { resolveEnglishHomeCopy, resolveEnglishPageCopy } from '../../features/sample-language/sampleEnglishCopy'
import { sampleContentKey, translateDisplayData } from '../../features/sample-language/sampleLanguageModel'
import type { SampleLanguageContextValue } from '../../features/sample-language/useSampleLanguage'
import type { SiteEditorContextValue } from './useSiteEditor'

/** Published presentation is independent of the first-read/loading lifecycle. */
export function createEditorLanguagePresentation(
  sourceDocuments: SiteEditorDocuments, documents: SiteEditorDocuments,
  sample: SampleLanguageContextValue, device: EditorDevice,
): { copy: SiteEditorContextValue['copy']; languageContext: SampleLanguageContextValue } {
  const isEnglish = sample.enabled && sample.language === 'en'
  const copy: SiteEditorContextValue['copy'] = (page, key, fallback) => isEnglish
    ? resolveEnglishPageCopy(documents, page, key, fallback, device, sample.translate)
    : resolveEditorCopy(sourceDocuments, page, key, fallback, device)
  const translateSource = (source: string) => resolveEditorCopy(documents, 'common', sampleContentKey(source), sample.translate(source), device)
  const languageContext: SampleLanguageContextValue = !isEnglish ? sample : {
    ...sample,
    translate: (source, key) => {
      const translated = sample.translate(source, key)
      return key ? translated : resolveEditorCopy(documents, 'common', sampleContentKey(source), translated, device)
    },
    translateData: <T,>(data: T, cacheKey?: string): T => sample.translateData(translateDisplayData(data, translateSource), cacheKey),
    translateHome: (data, _documents, viewport) => resolveEnglishHomeCopy(data, documents, viewport, sample.translate),
  }
  return { copy, languageContext }
}
