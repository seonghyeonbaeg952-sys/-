import { Outlet } from 'react-router'

import { Footer } from './Footer'
import { Header } from './Header'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-bg-warm-white text-text-charcoal">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-button focus:bg-gold-warm focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-navy-midnight"
        href="#main-content"
      >
        본문으로 바로가기
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
