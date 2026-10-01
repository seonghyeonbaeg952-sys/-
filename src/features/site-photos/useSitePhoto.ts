import { createContext, useContext } from 'react'
import { useSampleLanguage } from '../sample-language/useSampleLanguage'
import { getSitePhotoAsset } from './sitePhotoCatalog'
import { resolveSitePhoto, type SitePhotoMap } from './sitePhotoModel'

export const SitePhotosContext = createContext<SitePhotoMap>({})
export function useSitePhoto(src: string | null | undefined, alt = '') {
  const records = useContext(SitePhotosContext)
  const { language } = useSampleLanguage()
  const asset = getSitePhotoAsset(src)
  return { ...resolveSitePhoto(records, asset?.key, src ?? '', alt, language), key: asset?.key }
}
