import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute'
import { PublicLayout } from './components/layout/PublicLayout'
import { RouteScrollManager } from './components/layout/RouteScrollManager'
import {
  COLOR_SAMPLE_BASENAME,
  isColorSamplePath,
} from './utils/colorSamplePath'

const HomeRoute = lazy(() =>
  import('./pages/public/HomeRoute').then((module) => ({ default: module.HomeRoute })),
)
const AboutPage = lazy(() =>
  import('./pages/public/AboutPage').then((module) => ({ default: module.AboutPage })),
)
const SpiritPage = lazy(() =>
  import('./pages/public/SpiritPage').then((module) => ({ default: module.SpiritPage })),
)
const SpiritHeroSamplePage = lazy(() =>
  import('./pages/public/SpiritHeroSamplePage').then((module) => ({
    default: module.SpiritHeroSamplePage,
  })),
)
const HomeHeroIntroSamplePage = lazy(() =>
  import('./pages/public/HomeHeroIntroSamplePage').then((module) => ({
    default: module.HomeHeroIntroSamplePage,
  })),
)
const HomeSectionFlowSamplePage = lazy(() =>
  import('./pages/public/HomeSectionFlowSamplePage').then((module) => ({
    default: module.HomeSectionFlowSamplePage,
  })),
)
const ConcertsPage = lazy(() =>
  import('./pages/public/ConcertsPage').then((module) => ({ default: module.ConcertsPage })),
)
const ConcertDetailPage = lazy(() =>
  import('./pages/public/ConcertDetailPage').then((module) => ({
    default: module.ConcertDetailPage,
  })),
)
const NoticesPage = lazy(() =>
  import('./pages/public/NoticesPage').then((module) => ({ default: module.NoticesPage })),
)
const NoticeDetailPage = lazy(() =>
  import('./pages/public/NoticeDetailPage').then((module) => ({
    default: module.NoticeDetailPage,
  })),
)
const GalleryPage = lazy(() =>
  import('./pages/public/GalleryPage').then((module) => ({ default: module.GalleryPage })),
)
const JoinPage = lazy(() =>
  import('./pages/public/JoinPage').then((module) => ({ default: module.JoinPage })),
)
const ContactPage = lazy(() =>
  import('./pages/public/ContactPage').then((module) => ({ default: module.ContactPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/public/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((module) => ({ default: module.AdminLoginPage })),
)
const AdminDashboardPage = lazy(() =>
  import('./pages/admin/AdminDashboardPage').then((module) => ({
    default: module.AdminDashboardPage,
  })),
)
const AdminSettingsPage = lazy(() =>
  import('./pages/admin/AdminSettingsPage').then((module) => ({
    default: module.AdminSettingsPage,
  })),
)
const AdminSiteTextsPage = lazy(() =>
  import('./pages/admin/AdminSiteTextsPage').then((module) => ({
    default: module.AdminSiteTextsPage,
  })),
)
const AdminAboutPage = lazy(() =>
  import('./pages/admin/AdminAboutPage').then((module) => ({ default: module.AdminAboutPage })),
)
const AdminHeroSlidesPage = lazy(() =>
  import('./pages/admin/AdminHeroSlidesPage').then((module) => ({
    default: module.AdminHeroSlidesPage,
  })),
)
const AdminPopupNoticesPage = lazy(() =>
  import('./pages/admin/AdminPopupNoticesPage').then((module) => ({
    default: module.AdminPopupNoticesPage,
  })),
)
const AdminConductorPage = lazy(() =>
  import('./pages/admin/AdminConductorPage').then((module) => ({
    default: module.AdminConductorPage,
  })),
)
const AdminAccompanistPage = lazy(() =>
  import('./pages/admin/AdminAccompanistPage').then((module) => ({
    default: module.AdminAccompanistPage,
  })),
)
const AdminMembersPage = lazy(() =>
  import('./pages/admin/AdminMembersPage').then((module) => ({
    default: module.AdminMembersPage,
  })),
)
const AdminConcertsPage = lazy(() =>
  import('./pages/admin/AdminConcertsPage').then((module) => ({
    default: module.AdminConcertsPage,
  })),
)
const AdminNoticesPage = lazy(() =>
  import('./pages/admin/AdminNoticesPage').then((module) => ({
    default: module.AdminNoticesPage,
  })),
)
const AdminGalleryPage = lazy(() =>
  import('./pages/admin/AdminGalleryPage').then((module) => ({
    default: module.AdminGalleryPage,
  })),
)
const AdminVideosPage = lazy(() =>
  import('./pages/admin/AdminVideosPage').then((module) => ({
    default: module.AdminVideosPage,
  })),
)
const AdminPostersPage = lazy(() =>
  import('./pages/admin/AdminPostersPage').then((module) => ({
    default: module.AdminPostersPage,
  })),
)
const AdminHistoryPage = lazy(() =>
  import('./pages/admin/AdminHistoryPage').then((module) => ({
    default: module.AdminHistoryPage,
  })),
)
const AdminLocationPage = lazy(() =>
  import('./pages/admin/AdminLocationPage').then((module) => ({
    default: module.AdminLocationPage,
  })),
)
const AdminJoinPage = lazy(() =>
  import('./pages/admin/AdminJoinPage').then((module) => ({ default: module.AdminJoinPage })),
)
const AdminJoinApplicationsPage = lazy(() =>
  import('./pages/admin/AdminJoinApplicationsPage').then((module) => ({
    default: module.AdminJoinApplicationsPage,
  })),
)
const AdminSupportPage = lazy(() =>
  import('./pages/admin/AdminSupportPage').then((module) => ({
    default: module.AdminSupportPage,
  })),
)
const AdminSponsorsPage = lazy(() =>
  import('./pages/admin/AdminSponsorsPage').then((module) => ({
    default: module.AdminSponsorsPage,
  })),
)
const AdminSupportPledgesPage = lazy(() =>
  import('./pages/admin/AdminSupportPledgesPage').then((module) => ({
    default: module.AdminSupportPledgesPage,
  })),
)
const AdminContactsPage = lazy(() =>
  import('./pages/admin/AdminContactsPage').then((module) => ({
    default: module.AdminContactsPage,
  })),
)
const AdminAccountPage = lazy(() =>
  import('./pages/admin/AdminAccountPage').then((module) => ({
    default: module.AdminAccountPage,
  })),
)

function RouteFallback() {
  return (
    <main aria-busy="true" aria-live="polite" className="route-loading-screen" role="status">
      <div aria-hidden="true" className="route-loading-screen__mark">
        <span>S</span>
        <span>M</span>
        <span>Y</span>
        <span>C</span>
      </div>
      <div className="route-loading-screen__copy">
        <p>서울모테트청소년합창단</p>
        <strong>페이지를 준비하고 있습니다</strong>
      </div>
    </main>
  )
}

function App() {
  const isColorSample = isColorSamplePath(window.location.pathname)

  return (
    <BrowserRouter basename={isColorSample ? COLOR_SAMPLE_BASENAME : undefined}>
      <RouteScrollManager />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomeRoute />} />
            <Route path="home-hero-intro-sample" element={<HomeHeroIntroSamplePage />} />
            <Route path="home-section-flow-sample" element={<HomeSectionFlowSamplePage />} />
            <Route path="spirit" element={<SpiritPage />} />
            <Route path="spirit-hero-sample" element={<SpiritHeroSamplePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="concerts" element={<ConcertsPage />} />
            <Route path="concerts/:concertId" element={<ConcertDetailPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="notices/:noticeId" element={<NoticeDetailPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route
            path="admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="site-texts" element={<AdminSiteTextsPage />} />
            <Route path="hero-slides" element={<AdminHeroSlidesPage />} />
            <Route path="popups" element={<AdminPopupNoticesPage />} />
            <Route path="about" element={<AdminAboutPage />} />
            <Route path="conductor" element={<AdminConductorPage />} />
            <Route path="accompanist" element={<AdminAccompanistPage />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="concerts" element={<AdminConcertsPage />} />
            <Route path="notices" element={<AdminNoticesPage />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
            <Route path="videos" element={<AdminVideosPage />} />
            <Route path="posters" element={<AdminPostersPage />} />
            <Route path="history" element={<AdminHistoryPage />} />
            <Route path="location" element={<AdminLocationPage />} />
            <Route path="join" element={<AdminJoinPage />} />
            <Route path="join-applications" element={<AdminJoinApplicationsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="sponsors" element={<AdminSponsorsPage />} />
            <Route path="support-pledges" element={<AdminSupportPledgesPage />} />
            <Route path="contacts" element={<AdminContactsPage />} />
            <Route path="account" element={<AdminAccountPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
