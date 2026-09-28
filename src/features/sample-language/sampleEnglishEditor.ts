import { getSiteCopyDefaults, siteCopyDefinitions } from '../../content/siteCopyCatalog'
import { getPublicSiteTexts, getPublicAboutData, getPublicJoinData, getPublicContactData, getPublicConcerts, getPublicNotices, getPublicGalleryImages, getPublicVideos, getPublicPosters, getPublicHeroSlides, getPublicPopupNotices } from '../../lib/publicData'
import { loadPublicEditorPages } from '../../lib/siteEditorApi'
import { resolveEditorCopy } from '../../lib/siteEditorModel'
import { mapHomeContentCopy, resolveHomeEditorContent } from '../../lib/homeEditorOverrides'
import type { EditorDevice, SiteCopyDefinition, SiteEditorDocuments } from '../../types/siteEditor'
import { englishEntries, translateEnglish } from './englishRegistry'
import { sampleContentKey, sampleLanguageHref, translateDisplayData } from './sampleLanguageModel'

function textField(field: SiteCopyDefinition) {
  return !field.inputType || field.inputType === 'text' || field.inputType === 'textarea'
}

const rawDefinitions: SiteCopyDefinition[] = [...new Map(englishEntries.filter(entry => !entry.key).map(entry => [sampleContentKey(entry.source), entry])).entries()]
  .map(([key, entry]) => ({ key, page: 'common', section: '원문 기반 번역 · 안내 및 콘텐츠', label: entry.source.trim().slice(0, 90),
    defaultValue: translateEnglish(entry.source), multiline: entry.source.includes('\n') || entry.target.includes('\n'), maxLength: 10000 }))

export const sampleEnglishDefinitions: SiteCopyDefinition[] = [
  ...siteCopyDefinitions.filter(textField).map(field => ({ ...field,
    defaultValue: translateEnglish(field.defaultValue, field.sourceKey ?? field.key),
    // English length is not constrained by the number of Korean syllables.
    maxLength: Math.min(10000, Math.max(field.maxLength ?? 1000, 3 * (field.maxLength ?? 0))),
  })), ...rawDefinitions,
]

export function sampleEnglishPreviewPath(path: string) { return sampleLanguageHref(path, 'en') }

type SampleEnglishDefaults = {
  defaults: Record<string, string>
  deviceDefaults: Record<EditorDevice, Record<string, string>>
}

/** The same original publication can have different ordinary copy on each
 * device. Preserve those baselines without creating English draft overrides. */
export function buildSampleEnglishDefaults(raw: Record<string, string>, source: SiteEditorDocuments): SampleEnglishDefaults {
  const originalDefaults = getSiteCopyDefaults(raw)
  const defaults = { ...originalDefaults, ...Object.fromEntries(rawDefinitions.map(field => [field.key, field.defaultValue])) }
  const deviceDefaults: SampleEnglishDefaults['deviceDefaults'] = { mobile: {}, tablet: {}, desktop: {} }
  for (const field of siteCopyDefinitions.filter(textField)) {
    const fallback = originalDefaults[field.key] ?? field.defaultValue
    const translated = (device: EditorDevice) => translateEnglish(
      resolveEditorCopy(source, field.page, field.key, fallback, device), field.sourceKey ?? field.key,
    )
    if (field.sourceDevice) defaults[field.key] = translated(field.sourceDevice)
    else {
      for (const device of ['mobile', 'tablet', 'desktop'] as const) deviceDefaults[device][field.key] = translated(device)
      defaults[field.key] = deviceDefaults.desktop[field.key]
    }
  }
  // Home owns explicit per-device source keys. Keep their established mapping.
  for (const device of ['mobile', 'tablet', 'desktop'] as const) {
    mapHomeContentCopy(resolveHomeEditorContent(raw, source, device), device, (key, sourceKey, value) => {
      defaults[key] = translateEnglish(value, sourceKey)
      return value
    })
  }
  return { defaults, deviceDefaults }
}

/** Read the original publication and site texts once for all three devices. */
async function loadSampleEnglishBaseline(): Promise<SampleEnglishDefaults> {
  const [texts, publications] = await Promise.all([getPublicSiteTexts(), loadPublicEditorPages()])
  if (texts.error || !texts.data || publications.error || !publications.data) {
    throw new Error('한국어 게시본을 확인하지 못했습니다. 연결을 확인한 뒤 영문 초안을 다시 불러오세요.')
  }
  const raw = Object.fromEntries(texts.data.filter(row => row.is_active).map(row => [row.key, row.value ?? '']))
  const source: SiteEditorDocuments = Object.fromEntries(publications.data.map(row => [row.page_key, row.document]))
  return buildSampleEnglishDefaults(raw, source)
}

/** Compatibility for callers that only need the shared/desktop baseline. */
export async function loadSampleEnglishDefaults(): Promise<Record<string, string>> {
  return (await loadSampleEnglishBaseline()).defaults
}

/** Inventory the currently visible source content, not private CMS records.
 * Unknown translations deliberately start in Korean and can be edited here.
 * Source-bound identities invalidate an old translation when its source changes. */
export async function loadSampleEnglishResources() {
  const [baseline, ...results] = await Promise.all([
    loadSampleEnglishBaseline(),
    getPublicAboutData(), getPublicJoinData(), getPublicContactData(),
    getPublicConcerts(), getPublicNotices(), getPublicGalleryImages(),
    getPublicVideos(), getPublicPosters(), getPublicHeroSlides(), getPublicPopupNotices(),
  ])
  const definitions = [...sampleEnglishDefinitions]
  const known = new Set(definitions.map(field => field.key))
  const sourceDefaults = { ...baseline.defaults }
  for (const result of results) {
    if (result.error || !result.data) throw new Error('공개 콘텐츠의 원문 목록을 불러오지 못했습니다. 원본을 바꾸지 않았습니다. 잠시 후 다시 시도하세요.')
    translateDisplayData(result.data, value => {
      if (!/[가-힣]/.test(value) || value.length > 10000) return value
      const key = sampleContentKey(value)
      if (known.has(key)) return value
      known.add(key)
      const target = translateEnglish(value)
      definitions.push({ key, page: 'common', section: target === value ? '공개 콘텐츠 · 번역할 한국어 원문' : '공개 콘텐츠 · 영문 번역',
        label: value.trim().slice(0, 90), defaultValue: target, multiline: true, inputType: 'textarea', maxLength: 10000 })
      sourceDefaults[key] = target
      return value
    })
  }
  return { definitions, defaults: sourceDefaults, deviceDefaults: baseline.deviceDefaults }
}
