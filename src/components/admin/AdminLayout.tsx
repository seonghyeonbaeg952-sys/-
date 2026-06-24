import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router'

import { useAdminAuth } from '../../hooks/useAdminAuth'
import { signOut } from '../../lib/auth'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const navigate = useNavigate()
  const adminAuth = useAdminAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const userEmail = adminAuth.user?.email ?? adminAuth.profile?.email ?? '관리자'

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setSignOutError(null)

    const result = await signOut()

    setIsSigningOut(false)

    if (result.error) {
      setSignOutError(result.error)
      return
    }

    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg-ivory text-text-charcoal lg:grid lg:grid-cols-[280px_1fr]">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <section className="min-w-0">
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          isSigningOut={isSigningOut}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onSignOut={handleSignOut}
          signOutError={signOutError}
          userEmail={userEmail}
        />
        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </section>
    </div>
  )
}
