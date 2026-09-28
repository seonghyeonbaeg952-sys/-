import type { SampleLanguage } from './types'
import { isSampleLanguage, SAMPLE_LANGUAGE_STORAGE_KEY } from './sampleLanguageModel'

function createPreference(storageKey: string) {
  let preference: SampleLanguage | undefined
  const listeners = new Set<() => void>()
  const get = (): SampleLanguage => {
    if (preference) return preference
    try {
      const stored = localStorage.getItem(storageKey)
      preference = isSampleLanguage(stored) ? stored : 'ko'
    } catch { preference = 'ko' }
    return preference
  }
  const remember = (next: SampleLanguage) => {
    const changed = get() !== next
    preference = next
    try { localStorage.setItem(storageKey, next) } catch { /* URL and memory still work. */ }
    if (changed) listeners.forEach(listener => listener())
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }
  return { get, remember, subscribe }
}

const sample = createPreference(SAMPLE_LANGUAGE_STORAGE_KEY)
export const getSampleLanguagePreference = sample.get
export const rememberSampleLanguage = sample.remember
export const subscribeSampleLanguage = sample.subscribe
