import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { AccessDenied } from '../../components/admin/AccessDenied'
import { AdminSetupRequired } from '../../components/admin/AdminSetupRequired'
import { BrandLogo } from '../../components/common/BrandLogo'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { LoadingState } from '../../components/common/LoadingState'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { getProfile, signInWithEmail } from '../../lib/auth'

type LoginLocationState = {
  from?: {
    hash?: string
    pathname?: string
    search?: string
  }
}

function getRedirectTarget(state: unknown) {
  const locationState = state as LoginLocationState | null
  const fromPathname = locationState?.from?.pathname

  if (!fromPathname || fromPathname === '/admin/login') {
    return '/admin'
  }

  if (!fromPathname.startsWith('/admin')) {
    return '/admin'
  }

  return `${fromPathname}${locationState?.from?.search ?? ''}${
    locationState?.from?.hash ?? ''
  }`
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const adminAuth = useAdminAuth()
  const redirectTarget = useMemo(
    () => getRedirectTarget(location.state),
    [location.state],
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (adminAuth.isAdmin) {
      navigate(redirectTarget, { replace: true })
    }
  }, [adminAuth.isAdmin, navigate, redirectTarget])

  if (!adminAuth.isSupabaseConfigured) {
    return <AdminSetupRequired />
  }

  if (adminAuth.isLoading) {
    return (
      <main className="admin-shell flex min-h-screen items-center justify-center bg-bg-ivory px-5 py-12">
        <div className="w-full max-w-lg">
          <LoadingState label="로그인 상태를 확인하는 중입니다" />
        </div>
      </main>
    )
  }

  if (
    accessDeniedMessage ||
    (adminAuth.isAuthenticated && !adminAuth.isAdmin)
  ) {
    return (
      <AccessDenied
        description={
          accessDeniedMessage ??
          '관리자 권한이 있는 계정만 관리자 페이지에 접근할 수 있습니다.'
        }
      />
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim()

    if (!normalizedEmail || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setAccessDeniedMessage(null)

    const signInResult = await signInWithEmail(normalizedEmail, password)

    if (!signInResult.data) {
      setIsSubmitting(false)
      setError(signInResult.error ?? '로그인에 실패했습니다. 다시 시도해 주세요.')
      return
    }

    const profileResult = await getProfile(signInResult.data.user.id)

    setIsSubmitting(false)

    if (profileResult.error) {
      setError(profileResult.error)
      return
    }

    if (profileResult.data?.role !== 'admin') {
      setAccessDeniedMessage(
        '로그인된 계정에 관리자 권한이 없습니다. Supabase profiles.role 값을 확인해 주세요.',
      )
      return
    }

    navigate(redirectTarget, { replace: true })
  }

  return (
    <main className="admin-shell flex min-h-screen items-center justify-center bg-bg-ivory px-5 py-12 text-text-charcoal">
      <Card className="w-full max-w-md p-7 sm:p-8">
        <BrandLogo className="max-w-[230px]" size="lg" />
        <p className="mt-6 text-sm font-semibold text-gold-warm">관리자 CMS</p>
        <h1 className="mt-3 text-3xl font-bold text-navy-deep">
          서울모테트청소년합창단 관리자
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Supabase Auth 계정으로 로그인합니다. 관리자 권한은 profiles.role 값으로
          확인합니다.
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-navy-deep" htmlFor="admin-email">
              이메일
            </label>
            <input
              autoComplete="email"
              className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-base text-text-charcoal outline-none transition placeholder:text-text-muted/70 focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
              id="admin-email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일"
              type="email"
              value={email}
            />
          </div>

          <div>
            <label
              className="text-sm font-semibold text-navy-deep"
              htmlFor="admin-password"
            >
              비밀번호
            </label>
            <input
              autoComplete="current-password"
              className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-base text-text-charcoal outline-none transition placeholder:text-text-muted/70 focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
              id="admin-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <p className="rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            className="w-full"
            disabled={isSubmitting}
            size="lg"
            type="submit"
            variant="primary"
          >
            {isSubmitting ? '로그인 중' : '로그인'}
          </Button>
        </form>
        <div className="mt-7 border-t border-line-default pt-5">
          <p className="mb-3 text-xs font-semibold text-text-muted">
            운영 주체
          </p>
          <BrandLogo brand="smf" className="max-w-[180px]" size="sm" />
        </div>
      </Card>
    </main>
  )
}
