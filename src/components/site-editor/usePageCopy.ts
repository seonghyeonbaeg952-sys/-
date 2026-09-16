import { pageCopyDefaults } from '../../content/siteCopyPagesCatalog'
import { useSiteEditor } from './useSiteEditor'

export function usePageCopy<T extends keyof typeof pageCopyDefaults>(page: T) {
  const { copy } = useSiteEditor()
  return (key: keyof (typeof pageCopyDefaults)[T]) => {
    const fallback = pageCopyDefaults[page][key]
    return copy(page, `${page}.${String(key)}`, String(fallback))
  }
}
