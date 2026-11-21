import type { ReactNode } from 'react'

export function PublicRouteLoading({
  language,
  brand,
  message,
  languageAction,
}: {
  language: 'ko' | 'en'
  brand: ReactNode
  message: ReactNode
  languageAction?: ReactNode
}) {
  return (
    <main className="route-loading-screen route-loading-screen--public" lang={language}>
      <div className="route-loading-screen__content">
        <div aria-hidden="true" className="route-loading-screen__mark">SMYC</div>
        <div aria-busy="true" className="route-loading-screen__copy" role="status">
          <span aria-hidden="true" className="route-loading-screen__spinner" />
          <p>{brand}</p>
          <strong>{message}</strong>
        </div>
        {languageAction}
      </div>
    </main>
  )
}
