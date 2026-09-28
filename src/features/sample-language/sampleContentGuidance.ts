import { ENGLISH_CONTENT_FIELDS, type EnglishContentFields, type SampleContentResource } from './sampleContentModel'

export type PageEnglishFilter = 'all' | 'missing' | 'draft' | 'published'
type PageEnglishStatus = 'draft' | 'published'

export function getPageEnglishStatus(rows: readonly { id: string }[], statuses: Record<string, PageEnglishStatus>) {
  const counts = { missing: 0, draft: 0, published: 0, total: rows.length }
  for (const row of rows) counts[statuses[row.id] ?? 'missing'] += 1
  return counts
}

export function filterPageEnglishRows<T extends { id: string }>(rows: readonly T[], statuses: Record<string, PageEnglishStatus> | null, filter: PageEnglishFilter): T[] {
  if (!statuses || filter === 'all') return [...rows]
  return rows.filter(row => (statuses[row.id] ?? 'missing') === filter)
}

export function getEnglishInputProgress(resource: SampleContentResource, source: Record<string, unknown>, draft: EnglishContentFields) {
  const fields = ENGLISH_CONTENT_FIELDS[resource].filter(field => field.type === 'text' || field.type === 'textarea')
  const available = fields.filter(field => {
    const value = source[field.name]
    return typeof value === 'string' ? Boolean(value.trim()) : Array.isArray(value) && value.some(part => typeof part === 'string' && part.trim())
  })
  const missing = available.filter(field => !draft[field.name]?.trim())
  return { completed: available.length - missing.length, total: available.length, missingLabels: missing.map(field => field.label) }
}

export function getEnglishChanges(resource: SampleContentResource, draft: EnglishContentFields, published: EnglishContentFields | null) {
  return ENGLISH_CONTENT_FIELDS[resource].flatMap(field => {
    const before = published?.[field.name]?.trim() ?? ''
    const after = draft[field.name]?.trim() ?? ''
    if (before === after) return []
    return [{ name: field.name, label: field.label, kind: before && after ? 'changed' as const : after ? 'added' as const : 'removed' as const,
      before, after, isMedia: field.type === 'image' || field.type === 'url' }]
  })
}

const recommendations: Partial<Record<SampleContentResource, Record<string, number>>> = {
  hero_slides: { title: 44, primary_cta_label: 24, secondary_cta_label: 24 },
  popup_notices: { title: 58, button_label: 24 },
  notices: { title: 80 }, gallery: { title: 60 }, concerts: { title: 70 },
  videos: { title: 70 }, posters: { title: 70 }, history: { title: 70 },
  faq: { question: 110 }, about_sections: { title: 70 }, sponsors: { name: 70, display_name: 70 },
  site_settings: { site_title: 70 }, locations: { place_name: 65 },
  join_info: { title: 58 }, support_settings: { title: 55, submit_button_label: 24, print_button_label: 24 },
}

export function recommendedEnglishCharacters(resource: SampleContentResource, field: string): number | null {
  return recommendations[resource]?.[field] ?? null
}

export function getEnglishTextStats(value: string, recommendation?: number | null) {
  const characters = Array.from(value).length
  const words = value.trim() ? value.trim().split(/\s+/u).length : 0
  return { characters, words, aboveRecommendation: recommendation != null && characters > recommendation }
}
