import { useState } from 'react'
import { useNavigate } from 'react-router'

import { signOut } from '../../lib/auth'
import { Button } from '../common/Button'
import { Card } from '../common/Card'

type AccessDeniedProps = {
  description?: string
  showRetry?: boolean
  title?: string
}

export function AccessDenied({
  description = '관리자 권한이 있는 계정만 접근할 수 있습니다.',
  showRetry = false,
  title = '접근 권한이 없습니다',
}: AccessDeniedProps) {
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

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
    <main className="admin-shell flex min-h-screen items-center justify-center bg-bg-ivory px-5 py-12 text-text-charcoal">
      <Card className="w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-state-error/10 text-lg font-bold text-state-error">
          !
        </div>
        <h1 className="mt-5 text-3xl font-bold text-navy-deep">
          {title}
        </h1>
        <p className="mt-4 leading-7 text-text-muted">{description}</p>
        {signOutError ? (
          <p className="mt-4 text-sm text-state-error" role="alert">
            {signOutError}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {showRetry ? (
            <Button onClick={() => window.location.reload()} variant="primary">
              다시 시도
            </Button>
          ) : null}
          <Button href="/" variant="secondary">
            홈으로 이동
          </Button>
          <Button
            disabled={isSigningOut}
            onClick={handleSignOut}
            variant={showRetry ? 'secondary' : 'primary'}
          >
            {isSigningOut ? '로그아웃 중' : '로그아웃'}
          </Button>
        </div>
      </Card>
    </main>
  )
}
