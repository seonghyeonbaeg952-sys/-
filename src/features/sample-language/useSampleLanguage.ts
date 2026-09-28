import { createContext, useContext } from 'react'
import type { EditorDevice, SiteEditorDocuments } from '../../types/siteEditor'
import type { HomeContentV2 } from '../../types/homeContent'
import type { SampleLanguage } from './types'

export type SampleLanguageContextValue = {
  enabled: boolean
  isSample: boolean
  language: SampleLanguage
  setLanguage: (language: SampleLanguage) => void
  translate: (source: string, key?: string) => string
  translateData: <T>(value: T, cacheKey?: string) => T
  translateHome: (value: HomeContentV2, documents: SiteEditorDocuments, device: EditorDevice) => HomeContentV2
  href: (href: string) => string
  contentError?: boolean
  contentRetrying?: boolean
  retryContent?: () => void
}

export const SampleLanguageContext = createContext<SampleLanguageContextValue>({
  enabled: false, isSample: false, language: 'ko', setLanguage: () => {},
  translate: source => source, translateData: value => value,
  translateHome: value => value, href: href => href,
})

export function useSampleLanguage() { return useContext(SampleLanguageContext) }
