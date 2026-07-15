import { useCallback, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'

import { useAdminAuth } from '../../hooks/useAdminAuth'
import { confirmUnsavedChanges } from '../../hooks/useUnsavedChangesGuard'
import { signOut } from '../../lib/auth'
import { AdminHeader } from './AdminHeader'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayout() {
  const navigate = useNavigate()
  const adminAuth = useAdminAuth()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const userEmail = adminAuth.user?.email ?? adminAuth.profile?.email ?? '관리자'

  const handleSignOut = async () => {
    if (
      isSigningOut ||
      !confirmUnsavedChanges(
        '저장 중이거나 저장하지 않은 변경사항이 있습니다. 로그아웃할까요?',
      )
    ) {
      return
    }

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

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  return (
    <div className="admin-shell min-h-screen bg-bg-ivory text-text-charcoal lg:grid lg:grid-cols-[280px_1fr]">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        returnFocusRef={menuButtonRef}
      />

      <section className="min-w-0" inert={isSidebarOpen}>
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          isSigningOut={isSigningOut}
          menuButtonRef={menuButtonRef}
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
