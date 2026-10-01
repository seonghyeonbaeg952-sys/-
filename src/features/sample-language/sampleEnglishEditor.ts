import { getSiteCopyDefaults, siteCopyDefinitions } from '../../content/siteCopyCatalog'
import { getPublicAboutData, getPublicJoinData, getPublicContactData, getPublicConcerts, getPublicNotices, getPublicGalleryImages, getPublicVideos, getPublicPosters, getPublicHeroSlides, getPublicPopupNotices } from '../../lib/publicData'
import type { EditorDevice, SiteCopyDefinition } from '../../types/siteEditor'
import { englishEntries, translateEnglish } from './englishRegistry'
import { englishEditorialBaseline } from './englishEditorialBaseline'
import { editorLanguageHref, sampleContentKey, translateDisplayData } from './sampleLanguageModel'

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
  })),
  { key: 'spirit.motetMeaning.englishTitle', page: 'spirit', section: '정신 · 영문 제목', label: '모테트의 의미 · 영문 제목',
    defaultValue: 'Different voices make one piece of music.', multiline: false, maxLength: 160 },
  ...rawDefinitions,
]

export function sampleEnglishPreviewPath(path: string) { return editorLanguageHref(path, 'en') }

type SampleEnglishDefaults = {
  defaults: Record<string, string>
  deviceDefaults: Record<EditorDevice, Record<string, string>>
}

/** Stable English defaults do not depend on live Korean drafts or publications. */
export function buildSampleEnglishDefaults(): SampleEnglishDefaults {
  const originalDefaults = getSiteCopyDefaults()
  const defaults = { ...originalDefaults, ...Object.fromEntries(rawDefinitions.map(field => [field.key, field.defaultValue])) }
  const deviceDefaults: SampleEnglishDefaults['deviceDefaults'] = { mobile: {}, tablet: {}, desktop: {} }
  for (const field of siteCopyDefinitions.filter(textField)) {
    const translated = Object.hasOwn(englishEditorialBaseline, field.key)
      ? englishEditorialBaseline[field.key] : translateEnglish(field.defaultValue, field.sourceKey ?? field.key)
    if (field.sourceDevice) defaults[field.key] = translated
    else {
      for (const device of ['mobile', 'tablet', 'desktop'] as const) deviceDefaults[device][field.key] = translated
      defaults[field.key] = deviceDefaults.desktop[field.key]
    }
  }
  return { defaults, deviceDefaults }
}

/** Reading English editor defaults never depends on a Korean publication. */
async function loadSampleEnglishBaseline(): Promise<SampleEnglishDefaults> {
  return buildSampleEnglishDefaults()
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
