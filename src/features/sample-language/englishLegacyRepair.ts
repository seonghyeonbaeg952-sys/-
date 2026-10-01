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
    const changes = Object.entries(values).flatMap(([key, value]) => {
      const corrected = key === `${prefix}5` ? legacyEnding[value] ?? (value === oldFragments[key] ? correctedFragments[key] : undefined)
        : value === oldFragments[key] ? correctedFragments[key] : undefined
      return corrected === undefined ? [] : [[key, corrected] as const]
    })
    if (!changes.length) continue
    repaired ??= structuredClone(document)
    Object.assign(repaired.deviceCopy[device]!, Object.fromEntries(changes))
    const layouts = repaired.textLayouts?.[device]
    if (layouts) {
      for (let index = 1; index <= 5; index++) delete layouts[`${prefix}${index}`]
      if (!Object.keys(layouts).length) delete repaired.textLayouts![device]
      if (repaired.textLayouts && !Object.keys(repaired.textLayouts).length) delete repaired.textLayouts
    }
  }
  return repaired ?? document
}
