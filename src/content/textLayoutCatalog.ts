import type { EditorPageId } from '../types/siteEditor'
import { isEditorCopyKey } from '../lib/siteEditorTextStyles'

export type TextLayoutDefinition = { id: string; page: EditorPageId; label: string; group: string }
/** Stable semantic blocks, not React instance IDs, text values or DOM paths. */
export const TEXT_LAYOUT_CATALOG: readonly TextLayoutDefinition[] = [
  ...(['notices', 'concerts', 'gallery', 'contact', 'join', 'accompanist', 'members', 'history', 'about', 'spirit'] as const).flatMap(page => [
    { id: `${page}.intro.title`, page, label: '첫 화면 제목', group: `${page}.intro` },
    { id: `${page}.intro.description`, page, label: '첫 화면 소개 문단', group: `${page}.intro` },
  ]),
  { id: 'conductor.intro.title', page: 'conductor', label: '지휘자 소개 제목', group: 'conductor.intro' },
  { id: 'conductor.intro.organization', page: 'conductor', label: '소속 영문명', group: 'conductor.intro' },
  { id: 'conductor.profile.name', page: 'conductor', label: '지휘자 이름', group: 'conductor.profile' },
  { id: 'conductor.profile.biography', page: 'conductor', label: '지휘자 소개 본문', group: 'conductor.profile' },
  ...(['about', 'join', 'support'] as const).flatMap(section => [
    { id: `home.${section}.title`, page: 'home' as const, label: `${section === 'about' ? '합창단' : section === 'join' ? '입단 안내' : '후원'} 제목`, group: `home.${section}` },
    { id: `home.${section}.description`, page: 'home' as const, label: `${section === 'about' ? '합창단' : section === 'join' ? '입단 안내' : '후원'} 소개 문단`, group: `home.${section}` },
  ]),
]

const definitions = new Map(TEXT_LAYOUT_CATALOG.map(block => [block.id, block]))
const copyPages: readonly EditorPageId[] = ['common', 'home', 'about', 'spirit', 'conductor', 'accompanist', 'members', 'history', 'concerts', 'concert-detail', 'notices', 'notice-detail', 'gallery', 'join', 'contact']
export function getTextLayoutDefinition(id: string): TextLayoutDefinition | undefined {
  const fixed = definitions.get(id)
  if (fixed) return fixed
  if (!isEditorCopyKey(id)) return undefined
  const page = copyPages.find(candidate => id.startsWith(`${candidate}.`))
  return page ? { id, page, label: '문구', group: `${page}.copy` } : undefined
}
