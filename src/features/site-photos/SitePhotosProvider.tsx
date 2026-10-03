import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { invalidateSitePhotoCache, loadPublicSitePhotos } from './sitePhotoApi'
import { SITE_PHOTO_ASSETS } from './sitePhotoCatalog'
import { retainPublishedSitePhotos, type SitePhotoMap } from './sitePhotoModel'
import { SitePhotosContext } from './useSitePhoto'

export function SitePhotosProvider({ children }: { children: ReactNode }) {
  const isAdmin = useLocation().pathname.startsWith('/admin')
  const [photos, setPhotos] = useState<SitePhotoMap>({})
  useEffect(() => {
    if (isAdmin) return
    let active = true
    let sequence = 0
    const refresh = async (invalidate = false) => {
      const currentSequence = ++sequence
      if (invalidate) invalidateSitePhotoCache()
      const result = await loadPublicSitePhotos()
      if (active && currentSequence === sequence && result.data) {
        const incoming = result.data
        setPhotos(current => retainPublishedSitePhotos(current, incoming))
      }
    }
    const reload = () => { void refresh(true) }
    const storage = (event: StorageEvent) => { if (event.key === 'smyc-photos-published') reload() }
    const visibility = () => { if (document.visibilityState === 'visible') reload() }
    void refresh()
    window.addEventListener('focus', reload)
    window.addEventListener('site-photos-published', reload)
    window.addEventListener('storage', storage)
    document.addEventListener('visibilitychange', visibility)
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh() }, 30000)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus', reload)
      window.removeEventListener('site-photos-published', reload)
      window.removeEventListener('storage', storage)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [isAdmin])
  const backgroundRules = SITE_PHOTO_ASSETS.filter(asset => asset.cssVariable && photos[asset.key]?.published)
    .map(asset => `${asset.cssVariable}:url(${JSON.stringify(photos[asset.key].published!.src)})`).join(';')
  return <SitePhotosContext.Provider value={isAdmin ? {} : photos}>
    {!isAdmin && backgroundRules ? <style>{`:root{${backgroundRules}}`}</style> : null}
    {children}
  </SitePhotosContext.Provider>
}
