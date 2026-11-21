import { useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { SitePhotosInitialLoadingContext } from '../../features/site-photos/useSitePhoto'
import { getSiteEditorPage, isSiteEditorPreview } from '../../lib/siteEditorPreview'
import { PublicPageLoadingContext } from './publicPageLoadingContext'
import { observeInitialPageReadiness } from './publicPageReadiness'

export function PublicPageStartup({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const { pathname, search } = useLocation()
  const [readyPage, setReadyPage] = useState<string>()
  const content = useRef<HTMLDivElement>(null)
  const photosPending = useContext(SitePhotosInitialLoadingContext)
  const params = new URLSearchParams(search)
  const requestedPage = getSiteEditorPage(pathname, search)
  const page = requestedPage && `${pathname}:${requestedPage}:${params.get('lang') === 'en' ? 'en' : 'ko'}`
  const pending = Boolean(page) && readyPage !== page && !isSiteEditorPreview() &&
    params.get('motionBenchmark') !== '1'

  useLayoutEffect(() => {
    if (!pending || !page || !content.current) return
    return observeInitialPageReadiness(content.current, () => setReadyPage(page))
  }, [page, pending])

  return (
    <PublicPageLoadingContext value={pending}>
      {pending ? <div className="route-loading-overlay">{fallback}</div> : null}
      <div className="contents" inert={pending} ref={content}>
        {pending && photosPending ? <span data-initial-data-pending="true" hidden /> : null}
        {children}
      </div>
    </PublicPageLoadingContext>
  )
}
