import type { EditorDevice, EditorTextLayout, SiteEditorDocument } from '../types/siteEditor'
import { isEditorCopyKey, isEditorRecord } from './siteEditorTextStyles'

const devices: readonly EditorDevice[] = ['mobile', 'tablet', 'desktop']
const properties = ['offsetX', 'offsetY', 'width', 'textAlign'] as const
const invalidMessage = '문구 상자의 위치, 너비, 정렬과 적용 기기를 확인해 주세요.'
export const EDITOR_LAYOUTS_PER_DEVICE = 500

export function isEditorTextLayout(value: unknown): value is EditorTextLayout {
  try {
    if (!isEditorRecord(value)) return false
    return Object.entries(value).every(([key, entry]) => {
      if (!properties.some(property => property === key)) return false
      if (key === 'textAlign') return entry === 'start' || entry === 'center' || entry === 'end'
      if (typeof entry !== 'number' || !Number.isFinite(entry)) return false
      return key === 'width' ? entry >= 10 && entry <= 100 : entry >= -2000 && entry <= 2000
    })
  } catch { return false }
}

export function validateTextLayouts(value: unknown): string | null {
  try {
    if (!isEditorRecord(value)) return invalidMessage
    for (const [device, entries] of Object.entries(value)) {
      if (!devices.some(item => item === device) || !isEditorRecord(entries)
        || Object.keys(entries).length > EDITOR_LAYOUTS_PER_DEVICE) return invalidMessage
      for (const [id, layout] of Object.entries(entries)) {
        if (!isEditorCopyKey(id) || !isEditorTextLayout(layout)) return invalidMessage
      }
    }
    return null
  } catch { return invalidMessage }
}

/** Stable property order makes dirty/conflict comparisons semantic, not insertion-order dependent. */
export function canonicalTextLayout(value: EditorTextLayout): EditorTextLayout {
  if (!isEditorTextLayout(value)) throw new RangeError(invalidMessage)
  return Object.fromEntries(properties.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]]))
}

/** No shared/device fallback: an absent layout leaves the original block untouched. */
export function resolveTextLayout(document: SiteEditorDocument | undefined, device: EditorDevice, layoutId: string): EditorTextLayout | undefined {
  if (!document || !isEditorRecord(document) || document.schemaVersion !== 1 || !devices.includes(device)
    || !isEditorCopyKey(layoutId) || document.textLayouts === undefined || validateTextLayouts(document.textLayouts)) return undefined
  const value = document.textLayouts[device]?.[layoutId]
  return value && Object.keys(value).length ? canonicalTextLayout(value) : undefined
}
