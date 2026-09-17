import { publicNavigation } from '../../constants/navigation'
import { navigationLabelKey } from '../../content/siteCopyCommonCatalog'
import { useSiteEditor } from './useSiteEditor'

export function usePublicNavigation() {
  const { copy } = useSiteEditor()
  return publicNavigation.map(item => ({
    ...item,
    copyKey: navigationLabelKey(item.href, item.label),
    label: copy('common', navigationLabelKey(item.href, item.label), item.label),
    children: item.children?.map(child => ({
      ...child,
      copyKey: navigationLabelKey(child.href, child.label),
      label: copy('common', navigationLabelKey(child.href, child.label), child.label),
    })),
  }))
}
