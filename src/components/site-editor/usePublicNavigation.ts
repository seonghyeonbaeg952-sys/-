import { publicNavigation } from '../../constants/navigation'
import { navigationCopyKey } from '../../content/siteCopyCommonCatalog'
import { useSiteEditor } from './useSiteEditor'

export function usePublicNavigation() {
  const { copy } = useSiteEditor()
  return publicNavigation.map(item => ({
    ...item,
    label: copy('common', navigationCopyKey(item.href), item.label),
    children: item.children?.map(child => ({
      ...child,
      label: copy('common', navigationCopyKey(child.href), child.label),
    })),
  }))
}
