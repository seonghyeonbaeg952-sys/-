import type { EditorDevice, EditorTextRun, SiteCopyDefinition, SiteEditorDocument, SiteEditorDocuments } from '../types/siteEditor'
import { resolveEditorCopy } from './siteEditorModel'
import { resolveTextRuns } from './siteEditorTextStyles'

const labels = {
  role: { legacy: 'english3', text: 'ACCOMPANIST', label: '반주자 역할 라벨' },
  roleEn: { legacy: 'english4', text: 'Piano Accompanist', label: '반주자 영문 역할' },
  current: { legacy: 'english5', text: 'CURRENT', label: '반주자 현재 활동 라벨' },
} as const
export type AccompanistCopyKind = keyof typeof labels
const identity = /^accompanist\.profile\.([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(role|roleEn|current)$/

/** IDs follow the profile, not its position in a reordered list. Only three safe text fields are supported. */
export function accompanistProfileCopyKey(profileId: string, kind: AccompanistCopyKind) {
  const key = `accompanist.profile.${profileId}.${kind}`
  return identity.test(key) ? key : `accompanist.accompanistProfiles.${labels[kind].legacy}`
}
export function getAccompanistCopyDefinition(key: string): (SiteCopyDefinition & { legacyKey: string }) | null {
  const match = identity.exec(key)
  if (!match) return null
  const spec = labels[match[2] as AccompanistCopyKind]
  return { key, page: 'accompanist', section: '반주자별 프로필 라벨', label: spec.label, defaultValue: spec.text, multiline: true,
    legacyKey: `accompanist.accompanistProfiles.${spec.legacy}` }
}
export function accompanistCopyFallback(documents: SiteEditorDocuments, device: EditorDevice, key: string, defaults: Readonly<Record<string, string>> = {}) {
  const spec = getAccompanistCopyDefinition(key)
  return spec ? resolveEditorCopy(documents, 'accompanist', spec.legacyKey, defaults[spec.legacyKey] ?? spec.defaultValue, device) : ''
}
export function accompanistCopyRuns(document: SiteEditorDocument | undefined, device: EditorDevice, key: string, text: string): EditorTextRun[] {
  const spec = getAccompanistCopyDefinition(key)
  const own = Object.hasOwn(document?.textStyles?.[device] ?? {}, key) || Object.hasOwn(document?.textStyles?.shared ?? {}, key)
  return resolveTextRuns(document, device, own || !spec ? key : spec.legacyKey, text)
}
