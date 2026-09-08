import type { Notice, NoticeCategory } from '../../types/content'
import { formatShortDate } from '../../utils/formatDate'

export const noticeCategoryLabels: Record<NoticeCategory, string> = {
  notice: '공지',
  join: '모집',
  concert: '공연',
  news: '소식',
  press: '보도자료',
  rehearsal: '연습',
}

export function isNoticeCategory(value: string | null): value is NoticeCategory {
  return value !== null && Object.hasOwn(noticeCategoryLabels, value)
}

export function getNoticeCategoryLabel(category: string): string {
  return isNoticeCategory(category)
    ? noticeCategoryLabels[category]
    : category.trim() || '공지'
}

export function filterNotices(
  notices: readonly Notice[],
  filters: { category: 'all' | NoticeCategory; importantOnly: boolean; query: string },
): Notice[] {
  const query = filters.query.trim().toLowerCase()

  // Keep the CMS query's important-first / newest-first order; never mutate it.
  return notices.filter((notice) =>
    notice.is_visible
    && (!filters.importantOnly || notice.is_important)
    && (filters.category === 'all' || notice.category === filters.category)
    && (!query || notice.title.toLowerCase().includes(query) || notice.content.toLowerCase().includes(query)),
  )
}

export function getNoticeExcerpt(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  return normalized.length > 110 ? `${normalized.slice(0, 110)}…` : normalized
}

export function formatNoticeDate(value: string): string {
  return formatShortDate(value).replace(/\s+/g, '').replace(/\.$/, '')
}
