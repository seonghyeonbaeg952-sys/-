import { homeAllEditorFields, resolveHomeContentForDevice } from './homeDeviceContent'
import { resolveEditorCopy } from './siteEditorModel'
import type { HomeContentFlatRecord, HomeContentV2 } from '../types/homeContent'
import type { EditorDevice, SiteEditorDocuments } from '../types/siteEditor'

export function applyHomeEditorOverrides(raw: HomeContentFlatRecord, documents: SiteEditorDocuments, device: EditorDevice): HomeContentFlatRecord {
  const next = { ...raw }
  for (const field of homeAllEditorFields) {
    if (field.device !== device) continue
    const value = resolveEditorCopy(documents, 'home', field.key, raw[field.key] ?? field.defaultValue, device)
    const document = documents.home
    if (Object.hasOwn(document?.deviceCopy[device] ?? {}, field.key) || Object.hasOwn(document?.copy ?? {}, field.key)) next[field.key] = value
  }
  return next
}

function setHomeTextValue(content: HomeContentV2, sourceKey: string, value: string) {
  let key = sourceKey.replace(/^home\./, '')
  key = key.replace(/^responsive\.(about|join)\.(.)/, (_, section: string, first: string) => `${section === 'join' ? 'joinLetter' : section}.responsive${first.toUpperCase()}`)
  key = key.replace(/^current\.join\./, 'joinLetter.').replace(/^current\./, '')
  key = key.replace(/^(about\.paragraphs|heroSupplement\.mottoChips)\.(\d+)$/, (_, prefix: string, index: string) => `${prefix}.${Number(index) - 1}`)
  for (const [pattern, prefix, items] of [
    [/^quickActions\.(join|concert|support)\./, 'quickActions.items', content.quickActions.items],
    [/^choirProgram\.items\.([^.]+)\./, 'choirProgram.items', content.choirProgram.items],
    [/^scoreBook\.valueItems\.([^.]+)\./, 'scoreBook.valueItems', content.scoreBook.valueItems],
  ] as const) {
    const match = key.match(pattern)
    if (match) {
      const index = items.findIndex(item => item.id === match[1])
      if (index < 0) return
      key = key.replace(pattern, `${prefix}.${index}.`)
    }
  }
  const path = key.split('.')
  let parent: object = content
  for (const segment of path.slice(0, -1)) {
    const next: unknown = Reflect.get(parent, segment)
    if (!next || typeof next !== 'object') return
    parent = next
  }
  const property = path[path.length - 1]
  const existing: unknown = Reflect.get(parent, property)
  if (typeof existing === 'string') Reflect.set(parent, property, value)
  else if (Array.isArray(existing)) Reflect.set(parent, property, value.split(/\r?\n/))
}

/** Normalize existing content and structural controls first, then preserve exact editor text. */
export function resolveHomeEditorContent(raw: HomeContentFlatRecord, documents: SiteEditorDocuments, device: EditorDevice): HomeContentV2 {
  const content = resolveHomeContentForDevice(applyHomeEditorOverrides(raw, documents, device), device)
  const document = documents.home
  if (!document) return content
  for (const field of homeAllEditorFields) {
    if (field.device !== device || (field.inputType !== 'text' && field.inputType !== 'textarea')) continue
    if (!Object.hasOwn(document.deviceCopy[device] ?? {}, field.key) && !Object.hasOwn(document.copy, field.key)) continue
    setHomeTextValue(content, field.sourceKey, resolveEditorCopy(documents, 'home', field.key, field.defaultValue, device))
  }
  return content
}
