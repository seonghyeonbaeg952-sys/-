import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useAdminAuth } from '../../hooks/useAdminAuth'
import { LoadingState } from '../common/LoadingState'
import { AccessDenied } from './AccessDenied'
import { AdminSetupRequired } from './AdminSetupRequired'

type ProtectedAdminRouteProps = {
  children: ReactNode
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const location = useLocation()
  const adminAuth = useAdminAuth()

  if (!adminAuth.isSupabaseConfigured) {
    return <AdminSetupRequired />
  }

  if (adminAuth.isLoading) {
    return (
      <main className="admin-shell flex min-h-screen items-center justify-center bg-bg-ivory px-5 py-12">
        <div className="w-full max-w-lg">
          <LoadingState label="관리자 권한을 확인하는 중입니다" />
        </div>
      </main>
    )
  }

  if (adminAuth.error) {
    return (
      <AccessDenied
        description={adminAuth.error}
        showRetry
        title="관리자 정보를 확인하지 못했습니다"
      />
    )
  }

  if (!adminAuth.isAuthenticated) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to="/admin/login"
      />
    )
  }

  if (!adminAuth.isAdmin) {
    return <AccessDenied />
  }

  return children
}
