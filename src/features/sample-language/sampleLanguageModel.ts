import { isColorSamplePath } from '../../utils/colorSamplePath'
import type { SampleLanguage, TranslationEntry } from './types'

export const SAMPLE_LANGUAGE_STORAGE_KEY = 'smyc:sample:language'
export const isSampleLanguage = (value: unknown): value is SampleLanguage => value === 'ko' || value === 'en'
export const normalizeTranslationSource = (value: string) => value.replace(/\s+/g, ' ').trim()

export function resolveSampleLanguage(pathname: string, search: string, saved: unknown = 'ko'): SampleLanguage {
  if (!isColorSamplePath(pathname) || /^\/sample\/admin(?:\/|$)/.test(pathname)) return 'ko'
  const parameter = new URLSearchParams(search).get('lang')
  if (parameter !== null) return isSampleLanguage(parameter) ? parameter : 'ko'
  return isSampleLanguage(saved) ? saved : 'ko'
}

export function resolvePublicLanguage(pathname: string, search: string): SampleLanguage {
  if (/^\/admin(?:\/|$)/.test(pathname)) return 'ko'
  const parameter = new URLSearchParams(search).get('lang')
  if (parameter !== null) return isSampleLanguage(parameter) ? parameter : 'ko'
  return 'ko'
}

export function languageLocation(location: { pathname: string; search: string; hash: string }, language: SampleLanguage) {
  const search = new URLSearchParams(location.search)
  search.set('lang', language)
  return `${location.pathname}?${search}${location.hash}`
}

/** Router destinations retain their basename automatically. Preserve English
 * when redirecting without turning a local route into a /sample-prefixed URL. */
export function routeLanguageHref(href: string, language: SampleLanguage) {
  if (language !== 'en' || !href.startsWith('/') || href.startsWith('//')) return href
  const url = new URL(href, 'https://local.invalid')
  url.searchParams.set('lang', 'en')
  return `${url.pathname}${url.search}${url.hash}`
}

export function publicLanguageHref(href: string, language: SampleLanguage, isSample: boolean) {
  if (!href.startsWith('/') || href.startsWith('//') || /^\/admin(?:[/?#]|$)/.test(href)) return href
  if (!isSample && language === 'ko') return href
  const url = new URL(href, 'https://sample.invalid')
  if (isSample && !isColorSamplePath(url.pathname)) url.pathname = `/sample${url.pathname}`
  if (!isSample && isColorSamplePath(url.pathname)) url.pathname = url.pathname.replace(/^\/sample(?=\/|$)/, '') || '/'
  url.searchParams.set('lang', language)
  return `${url.pathname}${url.search}${url.hash}`
}

/** CMS canvases must ignore the visitor's current language and always render
 * the explicitly selected Korean or English public page. */
export function editorLanguageHref(href: string, language: SampleLanguage) {
  if (!href.startsWith('/') || href.startsWith('//') || /^\/admin(?:[/?#]|$)/.test(href)) return href
  const url = new URL(href, 'https://local.invalid')
  if (isColorSamplePath(url.pathname)) url.pathname = url.pathname.replace(/^\/sample(?=\/|$)/, '') || '/'
  url.searchParams.set('lang', language)
  return `${url.pathname}${url.search}${url.hash}`
}

export const sampleLanguageHref = (href: string, language: SampleLanguage) => publicLanguageHref(href, language, true)

const englishMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const
export function englishHistoryMonth(source: string | null): string | null {
  if (!source) return source
  const match = /^(\d{1,2})(?:\s*[-~–]\s*(\d{1,2}))?월$/.exec(source.trim())
  if (!match) return source
  const first = englishMonths[Number(match[1]) - 1]
  const last = match[2] ? englishMonths[Number(match[2]) - 1] : null
  return first ? last ? `${first}–${last}` : first : source
}

/** Stable source-bound key for CMS translations of public content. A changed
 * original gets a new key instead of silently retaining an obsolete translation. */
export function sampleContentKey(source: string) {
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(normalizeTranslationSource(source))) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n)
  }
  return `sample.content.${hash.toString(16).padStart(16, '0')}`
}

export function createTranslationLookup(entries: readonly TranslationEntry[]) {
  const bySource = new Map<string, string>()
  const byKey = new Map<string, Map<string, string>>()
  for (const { source, target, key } of entries) {
    const normal = normalizeTranslationSource(source)
    if (!normal || !target.trim()) continue
    if (key) {
      const variants = byKey.get(key) ?? new Map<string, string>()
      variants.set(normal, target)
      byKey.set(key, variants)
    } else if (!bySource.has(normal)) bySource.set(normal, target)
  }
  return (source: string, key?: string) => {
    const normal = normalizeTranslationSource(source)
    const translated = (key ? byKey.get(key)?.get(normal) : undefined) ?? bySource.get(normal)
    if (translated === undefined) return source
    const leading = source.match(/^\s*/)?.[0] ?? ''
    const trailing = source.match(/\s*$/)?.[0] ?? ''
    return `${/^\s/.test(translated) ? '' : leading}${translated}${/\s$/.test(translated) ? '' : trailing}`
  }
}

const structuralField = /^(?:id|key|uuid|href|url|src|srcset|image_url|poster_url|thumbnail_url|link_url|video_url|youtube_url|email|phone|contact_phone|contact_email|date|created_at|updated_at|published_at|start_at|end_at|status|category|part|group|display_order|is_visible|is_active|siteTexts|site_texts|styles|appearance|textStyles|textLayouts)$/

/** Translate immutable display values, retaining object identity when unchanged.
 * IDs, filter enums, URLs, dates, numeric constraints and CMS source maps stay raw. */
export function translateDisplayData<T>(value: T, translate: (source: string, key?: string) => string): T {
  function visit(item: unknown, field = ''): unknown {
    if (structuralField.test(field) || /(?:_url|_href|Href|Url|_id|_at|_date|_path)$/.test(field)) return item
    if (typeof item === 'string') {
      // A link remains structural even when an older CMS column has a custom
      // name; editing its visible English label must not rewrite navigation.
      if (/^(?:https?:\/\/|\/|mailto:|tel:)/i.test(item.trim())) return item
      return translate(item)
    }
    if (Array.isArray(item)) {
      const next = item.map(entry => visit(entry))
      return next.some((entry, index) => entry !== item[index]) ? next : item
    }
    if (item && typeof item === 'object' && Object.getPrototypeOf(item) === Object.prototype) {
      const record = item as Record<string, unknown>
      const next = Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, visit(entry, key)]))
      return Object.keys(next).some(key => next[key] !== record[key]) ? next : item
    }
    return item
  }
  return visit(value) as T
}
