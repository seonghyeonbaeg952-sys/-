import { Button } from '../common/Button'
import { BrandLogo } from '../common/BrandLogo'
import { Card } from '../common/Card'

const setupItems = [
  'VITE_SUPABASE_URL 설정',
  'VITE_SUPABASE_ANON_KEY 설정',
  'pnpm check:supabase-env로 설정 여부 확인',
  'supabase/schema.sql 실행',
  'supabase/migrations 실행',
  'site-images Storage bucket 확인',
  'profiles.role = admin 연결',
]

export function AdminSetupRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-ivory px-5 py-12 text-text-charcoal">
      <Card className="w-full min-w-0 max-w-xs overflow-hidden p-6 sm:max-w-2xl sm:p-8">
        <BrandLogo className="mb-6 max-w-[220px]" size="lg" />
        <p className="text-sm font-semibold text-gold-warm">관리자 CMS</p>
        <p className="text-sm font-semibold uppercase text-gold-warm">
          Admin setup
        </p>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-navy-deep sm:text-3xl">
          Supabase 설정이 필요합니다
        </h1>
        <div className="mt-4 space-y-2 text-sm leading-7 text-text-muted sm:text-base">
          <p>관리자 로그인을 사용하려면 아래 환경변수가 필요합니다.</p>
          <p>실제 키 값은 코드에 넣지 마세요.</p>
          <p>
            <code className="rounded bg-bg-ivory px-1 font-semibold text-navy-deep">
              .env.local
            </code>{' '}
            또는 Vercel 환경변수에만 설정해 주세요.
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <code className="block min-w-0 break-all rounded-button bg-bg-ivory px-3 py-2 text-sm font-semibold text-navy-deep">
            VITE_SUPABASE_URL
          </code>
          <code className="block min-w-0 break-all rounded-button bg-bg-ivory px-3 py-2 text-sm font-semibold text-navy-deep">
            VITE_SUPABASE_ANON_KEY
          </code>
        </div>
        <div className="mt-5 rounded-card border border-line-default bg-bg-ivory p-4">
          <p className="text-sm font-semibold text-navy-deep">
            운영 전 필수 확인
          </p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-text-muted sm:grid-cols-2">
            {setupItems.map((item) => (
              <li className="flex gap-2" key={item}>
                <span aria-hidden="true" className="text-gold-warm">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 rounded-button border border-line-default bg-bg-warm-white px-4 py-3 text-sm leading-6 text-text-muted">
          자세한 순서는{' '}
          <span className="font-semibold">docs/supabase-live-checklist.md</span>
          와 <span className="font-semibold">supabase/README.md</span>를
          확인하세요.
        </p>
        <div className="mt-6 border-t border-line-default pt-5">
          <p className="mb-3 text-xs font-semibold text-text-muted">
            운영 주체
          </p>
          <BrandLogo brand="smf" className="max-w-[180px]" size="sm" />
        </div>
        <div className="mt-6">
          <Button href="/" variant="secondary">
            홈으로 이동
          </Button>
        </div>
      </Card>
    </main>
  )
}
