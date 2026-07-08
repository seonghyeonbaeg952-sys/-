import {
  siteTextDefaults,
  siteTextDefinitions,
  type SiteTextDefinition,
} from '../constants/siteTextDefaults'
import type { SiteTextRow } from '../types/cms'
import { softenPublicCopy } from './softenPublicCopy'

const siteTextDefinitionFallbacksEnabled = Symbol('siteTextDefinitionFallbacksEnabled')

export type SiteTextMap = Record<string, string> & {
  [siteTextDefinitionFallbacksEnabled]?: boolean
}

type CreateSiteTextMapOptions = {
  includeDefaults?: boolean
}

const invalidLiteralValues = new Set([
  'TODO',
  'placeholder',
  'undefined',
  'null',
  '미정',
  '준비중',
  '테스트',
  '임시',
  '등록 예정',
  '관리자 등록 예정',
])

function hasBrokenCharacters(value: string) {
  return /[�怨湲留덉꾩쒖쨌媛臾吏醫遺異淵낅꽌뒿듬占筌餓븍뜄삳뮉夷]/.test(
    value,
  )
}

function hasHtmlTag(value: string) {
  return /<\s*\/?\s*[a-z][^>]*>/i.test(value)
}

function hasForbiddenPublicLiteral(value: string) {
  return [
    /href\s*=\s*["']?#["']?/i,
    /\bTODO\b/i,
    /placeholder/i,
    /undefined/i,
    /\bnull\b/i,
    /미정/,
    /준비중/,
    /테스트/,
    /임시/,
    /등록 예정/,
    /관리자 등록 예정/,
  ].some((pattern) => pattern.test(value))
}

export function normalizeSiteText(
  value: string | null | undefined,
  fallback = '',
) {
  const trimmedValue = value?.trim() ?? ''
  const trimmedFallback = fallback.trim()

  if (!trimmedValue) {
    return softenPublicCopy(trimmedFallback)
  }

  if (
    invalidLiteralValues.has(trimmedValue) ||
    hasForbiddenPublicLiteral(trimmedValue) ||
    hasBrokenCharacters(trimmedValue) ||
    hasHtmlTag(trimmedValue)
  ) {
    return softenPublicCopy(trimmedFallback)
  }

  return softenPublicCopy(trimmedValue)
}

function normalizeSiteTextForComparison(value: string | null | undefined) {
  return normalizeSiteText(value, '').replace(/\s+/g, ' ').trim()
}

function shouldUseCurrentDefault(row: SiteTextRow, currentDefault: string) {
  const storedValue = normalizeSiteTextForComparison(row.value)
  const storedDefault = normalizeSiteTextForComparison(row.default_value)
  const normalizedCurrentDefault = normalizeSiteTextForComparison(currentDefault)

  return Boolean(
    storedValue &&
      storedDefault &&
      normalizedCurrentDefault &&
      storedValue === storedDefault &&
      storedDefault !== normalizedCurrentDefault,
  )
}

export function createSiteTextMap(
  rows: SiteTextRow[] = [],
  options: CreateSiteTextMapOptions = {},
): SiteTextMap {
  const includeDefaults = options.includeDefaults ?? true
  const textMap: SiteTextMap = includeDefaults ? { ...siteTextDefaults } : {}

  Object.defineProperty(textMap, siteTextDefinitionFallbacksEnabled, {
    enumerable: false,
    value: includeDefaults,
  })

  for (const row of rows) {
    const key = row.key.trim()

    if (!row.is_active) {
      delete textMap[key]
      continue
    }

    const currentDefault = siteTextDefaults[key] ?? ''
    const storedDefault = normalizeSiteText(row.default_value, currentDefault)
    const fallback =
      currentDefault || storedDefault
    const value = shouldUseCurrentDefault(row, currentDefault)
      ? normalizeSiteText(currentDefault, fallback)
      : normalizeSiteText(row.value, fallback)

    if (key && value) {
      textMap[key] = value
    }
  }

  return textMap
}

export function getSiteText(
  siteTexts: SiteTextMap | undefined,
  key: string,
  fallback?: string,
) {
  const shouldUseDefinitionFallbacks =
    siteTexts?.[siteTextDefinitionFallbacksEnabled] ?? true
  const fallbackValue = shouldUseDefinitionFallbacks
    ? siteTextDefaults[key] ?? fallback ?? ''
    : fallback ?? ''

  return normalizeSiteText(
    siteTexts?.[key],
    fallbackValue,
  )
}

export function getSiteTextGroup(groupName: string): SiteTextDefinition[] {
  return siteTextDefinitions.filter((definition) => definition.groupName === groupName)
}

export function getSiteTextDefinition(key: string) {
  return siteTextDefinitions.find((definition) => definition.key === key)
}

export function isForbiddenPublicText(value: string | null | undefined) {
  return normalizeSiteText(value, '') === ''
}
