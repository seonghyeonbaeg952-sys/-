import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { SampleLanguageContext } from './useSampleLanguage'
import { translateEnglish } from './englishRegistry'
import { isSampleLanguage, languageLocation, publicLanguageHref, resolvePublicLanguage, resolveSampleLanguage, translateDisplayData } from './sampleLanguageModel'
import { getSampleLanguagePreference, rememberSampleLanguage, subscribeSampleLanguage } from './sampleLanguagePreference'
import type { SampleLanguage } from './types'
import { getActiveSiteEditorPreviewNonce } from '../../lib/siteEditorPreview'
import './sample-language.css'
import './sample-english-layout.css'
import { applyEnglishContent, samePublishedEnglishContent, type PublishedEnglishContent } from './sampleContentModel'
import { loadPublishedEnglishContent } from './sampleContentApi'
import { loadInitialPublication } from '../../lib/siteEditorPublication'

/** Public routes share English copy. Sample mode keeps its separate no-write
 * form and noindex behavior; admin routes never inherit a visitor language. */
export function SampleLanguageProvider({ children, isSample = true }: { children: ReactNode; isSample?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  const preference = useSyncExternalStore(subscribeSampleLanguage, getSampleLanguagePreference, () => 'ko' as const)
  const enabled = !/^\/admin(?:\/|$)/.test(location.pathname)
  const preview = typeof window !== 'undefined' && window.parent !== window && Boolean(getActiveSiteEditorPreviewNonce(location.search))
  const language = enabled ? isSample ? resolveSampleLanguage(`/sample${location.pathname}`, location.search, preference) : resolvePublicLanguage(location.pathname, location.search) : 'ko'
  const [content, setContent] = useState<PublishedEnglishContent[]>([])
  const [contentSettled, setContentSettled] = useState(false)
  const [contentError, setContentError] = useState(false)
  const [contentRetrying, setContentRetrying] = useState(false)
  const [contentAttempt, setContentAttempt] = useState(0)
  const retryContent = useCallback(() => { setContentRetrying(true); setContentAttempt(attempt => attempt + 1) }, [])

  useEffect(() => {
    if (!enabled || language !== 'en') return
    let disposed = false, pending = false
    const load = async () => {
      if (pending || document.hidden) return
      pending = true
      try {
        const result = await loadInitialPublication(loadPublishedEnglishContent)
        if (!disposed) { setContentError(Boolean(result.error)); setContentRetrying(false); setContentSettled(true) }
        if (!disposed && result.data) {
          const incoming = result.data
          setContent(current => samePublishedEnglishContent(current, incoming) ? current : incoming)
        }
      } finally { pending = false }
    }
    void load()
    const refresh = () => { void load() }
    window.addEventListener('focus', refresh)
    window.addEventListener('sample-english-content-published', refresh)
    const photoPublication = (event: StorageEvent) => { if (event.key === 'smyc-photos-published') refresh() }
    window.addEventListener('storage', photoPublication)
    document.addEventListener('visibilitychange', refresh)
    const timer = window.setInterval(refresh, 30000)
    return () => {
      disposed = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('sample-english-content-published', refresh)
      window.removeEventListener('storage', photoPublication)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [enabled, language, contentAttempt])

  const setLanguage = useCallback((next: SampleLanguage) => {
    if (!enabled || preview || next === language) return
    if (isSample) rememberSampleLanguage(next)
    navigate(languageLocation(location, next), { preventScrollReset: true })
  }, [enabled, isSample, language, location, navigate, preview])

  useEffect(() => {
    if (!enabled || preview || !isSampleLanguage(new URLSearchParams(location.search).get('lang'))) return
    if (isSample) rememberSampleLanguage(language)
  }, [enabled, isSample, language, location.search, preview])

  useLayoutEffect(() => {
    if (!enabled) return
    const root = document.documentElement
    const previousLanguage = root.lang
    const previousSample = root.getAttribute('data-sample-language')
    root.lang = language
    root.setAttribute('data-sample-language', language)
    return () => {
      root.lang = previousLanguage
      if (previousSample === null) root.removeAttribute('data-sample-language')
      else root.setAttribute('data-sample-language', previousSample)
    }
  }, [enabled, language])

  const value = useMemo(() => ({
    enabled, isSample, language, setLanguage,
    contentError: enabled && language === 'en' && contentError,
    contentLoading: enabled && language === 'en' && !contentSettled, contentRetrying, retryContent,
    translate: (source: string, key?: string) => enabled && language === 'en' ? translateEnglish(source, key) : source,
    translateData: <T,>(data: T, cacheKey?: string): T => enabled && language === 'en' ? translateDisplayData(applyEnglishContent(data, content, cacheKey), translateEnglish) : data,
    translateHome: <T,>(data: T): T => data,
    href: (href: string) => enabled ? publicLanguageHref(href, language, isSample) : href,
  }), [enabled, isSample, language, setLanguage, content, contentSettled, contentError, contentRetrying, retryContent])

  return <SampleLanguageContext value={value}>{children}</SampleLanguageContext>
}
