import { Outlet, useLocation } from 'react-router'

import { HomeV4SampleHeader } from '../sample/home-v4/HomeV4SampleHeader'
import { Footer } from './Footer'
import '../../styles/color-sample-theme.css'

export function PublicLayout() {
  const location = useLocation()
  const isHome =
    location.pathname === '/' || location.pathname === '/home-section-flow-sample'

  return (
    <div
      className={[
        'public-shell color-sample-theme min-h-screen bg-bg-warm-white text-text-charcoal',
        isHome ? 'public-shell-home' : '',
      ].join(' ')}
      data-public-theme="white-orange"
    >
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-gold-warm focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-navy-midnight"
        href="#main-content"
      >
        본문으로 바로가기
      </a>
      <HomeV4SampleHeader mode="production" transparentAtTop={false} />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
