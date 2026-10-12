import type { EditorPageId, SiteEditorDocument } from '../../types/siteEditor'

const prefix = 'spirit.spiritManifesto.text'
const oldFragments: Record<string, string> = {
  [`${prefix}2`]: 'we learn ',
  [`${prefix}4`]: 'the',
  [`${prefix}5`]: 'of listening together.',
}
const correctedFragments: Record<string, string> = {
  [`${prefix}2`]: 'we learn the ',
  [`${prefix}4`]: ' of ',
  [`${prefix}5`]: 'listening together.',
}
const legacyEnding: Record<string, string> = {
  'of listening together..': 'listening together.',
  'listening togrthrer.': 'listening together.',
}

/** Narrow repair for a previously published English draft with split words,
 * reversed article/preposition and fragment offsets. It becomes a normal CMS
 * change when saved; future English wording is never rewritten. */
export function repairLegacyEnglishDocument(page: EditorPageId, document: SiteEditorDocument): SiteEditorDocument {
  if (page !== 'spirit') return document
  let repaired: SiteEditorDocument | null = null
  for (const device of ['mobile', 'tablet', 'desktop'] as const) {
    const values = document.deviceCopy[device]
    if (!values) continue
    const legacySentence = values[`${prefix}2`] === oldFragments[`${prefix}2`]
      && values[`${prefix}4`] === oldFragments[`${prefix}4`]
      && (values[`${prefix}3`] === undefined || values[`${prefix}3`] === 'art')
      && (values[`${prefix}5`] === oldFragments[`${prefix}5`]
        || values[`${prefix}5`] === 'of listening together..')
    const changes = Object.entries(values).flatMap(([key, value]) => {
      const corrected = key === `${prefix}5` ? legacyEnding[value] ?? (legacySentence ? correctedFragments[key] : undefined)
        : legacySentence && value === oldFragments[key] ? correctedFragments[key] : undefined
      return corrected === undefined ? [] : [[key, corrected] as const]
    })
    if (!changes.length) continue
    repaired ??= structuredClone(document)
    Object.assign(repaired.deviceCopy[device]!, Object.fromEntries(changes))
    const layouts = repaired.textLayouts?.[device]
    if (layouts) {
      const changedKeys = legacySentence
        ? Array.from({ length: 5 }, (_, index) => `${prefix}${index + 1}`)
        : changes.map(([key]) => key)
      for (const key of changedKeys) delete layouts[key]
      if (!Object.keys(layouts).length) delete repaired.textLayouts![device]
      if (repaired.textLayouts && !Object.keys(repaired.textLayouts).length) delete repaired.textLayouts
    }
  }
  return repaired ?? document
}
