import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { signOut, updatePassword } from '../../lib/auth'

export function AdminAccountPage() {
  const navigate = useNavigate()
  const adminAuth = useAdminAuth()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userEmail = adminAuth.user?.email ?? adminAuth.profile?.email ?? '관리자'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 8) {
      setError('새 비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (password !== passwordConfirm) {
      setError('새 비밀번호와 확인 값이 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)

    const result = await updatePassword(password)

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setPassword('')
    setPasswordConfirm('')
    setMessage(
      '비밀번호가 변경되었습니다. 보안을 위해 로그아웃 후 새 비밀번호로 다시 로그인해 주세요.',
    )
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setError(null)

    const result = await signOut()

    setIsSigningOut(false)

    if (result.error) {
      setError(result.error)
      return
    }

    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-gold-warm">Account</p>
        <h1 className="mt-2 text-3xl font-bold text-navy-deep">계정 설정</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          현재 로그인한 이메일은
          <span className="mx-1 font-semibold text-navy-deep">{userEmail}</span>
          입니다.
        </p>
      </section>

      <Card className="max-w-2xl p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-navy-deep">비밀번호 변경</h2>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          새 비밀번호는 Supabase Auth에만 전달되며 코드나 데이터베이스 테이블에
          저장하지 않습니다.
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              className="text-sm font-semibold text-navy-deep"
              htmlFor="new-password"
            >
              새 비밀번호
            </label>
            <input
              autoComplete="new-password"
              className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-base text-text-charcoal outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
              id="new-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          <div>
            <label
              className="text-sm font-semibold text-navy-deep"
              htmlFor="new-password-confirm"
            >
              새 비밀번호 확인
            </label>
            <input
              autoComplete="new-password"
              className="mt-2 min-h-12 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-base text-text-charcoal outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
              id="new-password-confirm"
              minLength={8}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              type="password"
              value={passwordConfirm}
            />
          </div>

          {error ? (
            <p className="rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="rounded-button bg-state-success/10 px-4 py-3 text-sm leading-6 text-state-success" role="status">
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button disabled={isSubmitting} type="submit" variant="primary">
              {isSubmitting ? '변경 중' : '비밀번호 변경'}
            </Button>
            <Button
              disabled={isSigningOut}
              onClick={handleSignOut}
              type="button"
              variant="secondary"
            >
              {isSigningOut ? '로그아웃 중' : '로그아웃 후 다시 로그인'}
            </Button>
          </div>
        </form>

        {/* TODO: 현재 비밀번호 재확인이 필요해지면 Supabase 공식 re-auth 흐름을 이 위치에 추가합니다. */}
        <p className="mt-5 text-xs leading-5 text-text-muted">
          현재 비밀번호 재확인이 필요한 정책은 이후 Supabase 공식 re-auth 흐름으로
          확장합니다.
        </p>
      </Card>
    </div>
  )
}
