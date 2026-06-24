import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute'
import { LoadingState } from './components/common/LoadingState'
import { PublicLayout } from './components/layout/PublicLayout'

const HomePage = lazy(() =>
  import('./pages/public/HomePage').then((module) => ({ default: module.HomePage })),
)
const AboutPage = lazy(() =>
  import('./pages/public/AboutPage').then((module) => ({ default: module.AboutPage })),
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
const AdminAboutPage = lazy(() =>
  import('./pages/admin/AdminAboutPage').then((module) => ({ default: module.AdminAboutPage })),
)
const AdminHeroSlidesPage = lazy(() =>
  import('./pages/admin/AdminHeroSlidesPage').then((module) => ({
    default: module.AdminHeroSlidesPage,
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
    <main className="min-h-screen bg-bg-ivory px-5 py-24">
      <LoadingState label="페이지를 불러오는 중입니다" />
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<HomePage />} />
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
            <Route path="hero-slides" element={<AdminHeroSlidesPage />} />
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
            <Route path="contacts" element={<AdminContactsPage />} />
            <Route path="account" element={<AdminAccountPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
