import { useCallback } from 'react'

import { getSiteText, type SiteTextMap } from '../utils/siteText'

export function useSiteText(siteTexts: SiteTextMap) {
  return useCallback(
    (key: string, fallback?: string) => getSiteText(siteTexts, key, fallback),
    [siteTexts],
  )
}
