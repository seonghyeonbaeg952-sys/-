import { Link } from 'react-router'

import { Card } from '../../components/common/Card'
import { useAdminAuth } from '../../hooks/useAdminAuth'

const dashboardCards = [
  {
    title: '단원 관리',
    description: '단원 정보와 이름 공개 방식을 관리합니다.',
    href: '/admin/members',
  },
  {
    title: '공연 관리',
    description: '공연 일정, 상태, 공개 여부를 관리합니다.',
    href: '/admin/concerts',
  },
  {
    title: '공지사항 관리',
    description: '공지, 입단 안내, 보도자료를 관리합니다.',
    href: '/admin/notices',
  },
  {
    title: '갤러리 관리',
    description: '공개 갤러리 사진과 표시 순서를 관리합니다.',
    href: '/admin/gallery',
  },
  {
    title: '문의 관리',
    description: '입단, 후원, 공연 요청 문의를 확인합니다.',
    href: '/admin/contacts',
  },
  {
    title: '계정 설정',
    description: '관리자 비밀번호 변경 흐름을 관리합니다.',
    href: '/admin/account',
  },
] satisfies Array<{
  description: string
  href: string
  title: string
}>

const checklistCards = [
  '홈 슬라이드 3개 이상 공개',
  '공연/공지 공개 여부 확인',
  '갤러리 이미지 alt 확인',
  '문의 내역 status 확인',
]

export function AdminDashboardPage() {
  const adminAuth = useAdminAuth()
  const userLabel = adminAuth.user?.email ?? adminAuth.profile?.email ?? '관리자'

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-gold-warm">Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-navy-deep">
          관리자 대시보드
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          현재 <span className="font-semibold text-navy-deep">{userLabel}</span>
          계정으로 로그인되어 있습니다. 각 카드에서 CMS 데이터를 관리할 수 있습니다.
        </p>
      </section>

      <section aria-label="운영 전 확인" className="grid gap-3 md:grid-cols-4">
        {checklistCards.map((item, index) => (
          <Card className="p-5" key={item}>
            <p className="text-xs font-semibold text-gold-warm">
              CHECK {String(index + 1).padStart(2, '0')}
            </p>
            <p className="mt-3 break-keep text-sm font-semibold leading-6 text-navy-deep">
              {item}
            </p>
          </Card>
        ))}
      </section>

      <section
        aria-label="관리자 주요 메뉴"
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {dashboardCards.map((card) => (
          <Link
            className="group block rounded-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
            key={card.href}
            to={card.href}
          >
            <Card
              className="h-full p-6 transition duration-200 group-hover:-translate-y-1 group-hover:border-gold-soft group-hover:shadow-card-hover motion-reduce:group-hover:translate-y-0"
            >
              <p className="text-xs font-semibold text-gold-warm">
                CMS 관리
              </p>
              <h2 className="mt-3 text-xl font-semibold text-navy-deep">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {card.description}
              </p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  )
}
