import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { AdminPageTitle } from '../../components/admin/AdminPageTitle'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { countRows } from '../../lib/cms'

type DashboardSummary = {
  contacts: number | null
  importantNotices: number | null
  joinApplications: number | null
  pendingSponsors: number | null
  supportPledges: number | null
  upcomingConcerts: number | null
}

const emptySummary: DashboardSummary = {
  contacts: null,
  importantNotices: null,
  joinApplications: null,
  pendingSponsors: null,
  supportPledges: null,
  upcomingConcerts: null,
}

const quickLinks = [
  {
    title: '홈 슬라이드',
    description: '첫 화면 이미지와 공개 순서를 관리합니다.',
    href: '/admin/hero-slides',
  },
  {
    title: '홈 문구',
    description: '주요 제목과 안내 문구를 수정합니다.',
    href: '/admin/site-texts',
  },
  {
    title: '공지사항',
    description: '새 공지와 중요 공지를 등록합니다.',
    href: '/admin/notices',
  },
  {
    title: '갤러리',
    description: '사진의 공개 상태와 표시 순서를 관리합니다.',
    href: '/admin/gallery',
  },
] satisfies Array<{
  description: string
  href: string
  title: string
}>

function getMetricValue(value: number | null, isLoading: boolean) {
  if (isLoading) {
    return '…'
  }

  return value ?? '확인 필요'
}

export function AdminDashboardPage() {
  const adminAuth = useAdminAuth()
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [failedCount, setFailedCount] = useState(0)
  const [reloadToken, setReloadToken] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const userLabel = adminAuth.user?.email ?? adminAuth.profile?.email ?? '관리자'

  useEffect(() => {
    let isMounted = true

    async function loadSummary() {
      setIsLoading(true)

      const [
        contactsResult,
        joinApplicationsResult,
        supportPledgesResult,
        sponsorsResult,
        concertsResult,
        noticesResult,
      ] = await Promise.all([
        countRows({
          inFilters: [{ column: 'status', values: ['new', 'reviewing', 'in_progress'] }],
          table: 'contacts',
        }),
        countRows({
          inFilters: [{ column: 'status', values: ['new', 'in_review'] }],
          table: 'join_applications',
        }),
        countRows({
          inFilters: [{ column: 'status', values: ['new', 'in_progress'] }],
          table: 'support_pledges',
        }),
        countRows({
          filters: [{ column: 'consent_public', value: false }],
          table: 'sponsors',
        }),
        countRows({
          inFilters: [{ column: 'status', values: ['upcoming', 'open', 'ticketing'] }],
          table: 'concerts',
        }),
        countRows({
          filters: [
            { column: 'is_important', value: true },
            { column: 'is_visible', value: true },
          ],
          table: 'notices',
        }),
      ])

      if (!isMounted) {
        return
      }

      const results = [
        contactsResult,
        joinApplicationsResult,
        supportPledgesResult,
        sponsorsResult,
        concertsResult,
        noticesResult,
      ]

      setSummary({
        contacts: contactsResult.data,
        importantNotices: noticesResult.data,
        joinApplications: joinApplicationsResult.data,
        pendingSponsors: sponsorsResult.data,
        supportPledges: supportPledgesResult.data,
        upcomingConcerts: concertsResult.data,
      })
      setFailedCount(results.filter((result) => Boolean(result.error)).length)
      setUpdatedAt(new Date())
      setIsLoading(false)
    }

    void loadSummary()

    return () => {
      isMounted = false
    }
  }, [reloadToken])

  const metrics = [
    {
      title: '처리할 문의',
      description: '새 문의와 확인 중 문의',
      href: '/admin/contacts',
      value: summary.contacts,
    },
    {
      title: '검토할 입단지원',
      description: '신규 또는 검토 중 지원서',
      href: '/admin/join-applications',
      value: summary.joinApplications,
    },
    {
      title: '처리할 후원 신청',
      description: '신규 또는 진행 중 약정',
      href: '/admin/support-pledges',
      value: summary.supportPledges,
    },
    {
      title: '공개 동의 미확인',
      description: '후원사 공개 전 확인 필요',
      href: '/admin/sponsors',
      value: summary.pendingSponsors,
    },
    {
      title: '예정된 공연',
      description: '예정·접수·예매 상태 공연',
      href: '/admin/concerts',
      value: summary.upcomingConcerts,
    },
    {
      title: '공개 중요 공지',
      description: '현재 공개 중인 중요 공지',
      href: '/admin/notices',
      value: summary.importantNotices,
    },
  ]

  return (
    <div className="space-y-8">
      <AdminPageTitle
        action={
          <Button
            disabled={isLoading}
            onClick={() => setReloadToken((current) => current + 1)}
            showArrow={false}
            variant="secondary"
          >
            {isLoading ? '현황 확인 중' : '현황 새로고침'}
          </Button>
        }
        description={`${userLabel} 계정으로 로그인되어 있습니다. 처리할 업무와 공개 콘텐츠 상태를 한곳에서 확인합니다.`}
        eyebrow="운영 현황"
        title="관리자 대시보드"
      />

      {failedCount > 0 ? (
        <p
          className="rounded-button border border-gold-soft/60 bg-gold-soft/10 px-4 py-3 text-sm leading-6 text-navy-deep"
          role="status"
        >
          일부 현황({failedCount}개)을 불러오지 못했습니다. 해당 관리 메뉴에서
          데이터베이스 연결 상태를 확인해 주세요.
        </p>
      ) : updatedAt ? (
        <p className="text-xs text-text-muted" role="status">
          최근 확인: {updatedAt.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      ) : null}

      <section aria-label="처리 현황" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <Link
            className="group block rounded-formal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
            key={metric.href}
            to={metric.href}
          >
            <Card className="h-full overflow-hidden p-5 transition duration-200 group-hover:border-gold-warm/45 group-hover:shadow-card-hover">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-navy-deep">
                    {metric.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-text-muted">
                    {metric.description}
                  </p>
                </div>
                <strong className="min-w-12 text-right text-3xl font-semibold text-gold-warm">
                  {getMetricValue(metric.value, isLoading)}
                </strong>
              </div>
              <span className="mt-5 inline-flex text-xs font-semibold text-navy-deep/70 transition group-hover:text-navy-deep">
                관리 화면 열기 →
              </span>
            </Card>
          </Link>
        ))}
      </section>

      <section aria-labelledby="dashboard-quick-links-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-warm">QUICK ACCESS</p>
            <h2
              className="mt-2 text-xl font-semibold text-navy-deep"
              id="dashboard-quick-links-title"
            >
              콘텐츠 바로가기
            </h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              className="rounded-formal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
              key={item.href}
              to={item.href}
            >
              <Card className="h-full p-5" hoverable>
                <h3 className="font-semibold text-navy-deep">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {item.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
