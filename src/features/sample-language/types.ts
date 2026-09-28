export type SampleLanguage = 'ko' | 'en'

/** Translation is tied to source wording; changed live copy is never silently
 * replaced by an older translation. Keys disambiguate context when necessary. */
export type TranslationEntry = {
  source: string
  target: string
  key?: string
}
