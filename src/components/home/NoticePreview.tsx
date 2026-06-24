import type { Notice } from '../../types/content'
import { formatShortDate } from '../../utils/formatDate'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { SectionTitle } from '../common/SectionTitle'

type NoticePreviewProps = {
  notices: Notice[]
}

const categoryLabels: Record<Notice['category'], string> = {
  news: '소식',
  notice: '공지',
  press: '보도자료',
}

export function NoticePreview({ notices }: NoticePreviewProps) {
  const visibleNotices = [...notices]
    .filter((notice) => notice.is_visible)
    .sort((first, second) => {
      if (first.is_important !== second.is_important) {
        return first.is_important ? -1 : 1
      }

      return second.created_at.localeCompare(first.created_at)
    })
    .slice(0, 3)

  return (
    <section className="bg-bg-ivory py-section-mobile lg:py-section-desktop">
      <Container>
        <SectionTitle
          action={
            <Button href="/notices" variant="secondary">
              공지사항 보기
            </Button>
          }
          description="입단, 공연, 갤러리 업데이트 등 중요한 소식을 먼저 안내합니다."
          eyebrow="NOTICE"
          title="공지와 소식"
        />

        {visibleNotices.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              description="공개 상태의 공지사항이 등록되면 이 영역에 표시됩니다."
              title="등록된 공지사항이 없습니다"
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {visibleNotices.map((notice) => (
              <Card hoverable key={notice.id} className="overflow-hidden">
                <a
                  className="grid gap-5 p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm md:grid-cols-[180px_1fr_auto] md:items-center"
                  href={`/notices/${notice.id}`}
                >
                  <div>
                    <Badge variant={notice.is_important ? 'navy' : 'gold'}>
                      {notice.is_important
                        ? '중요'
                        : categoryLabels[notice.category]}
                    </Badge>
                    <p className="mt-3 text-sm text-text-muted">
                      {formatShortDate(notice.created_at)}
                    </p>
                  </div>
                  <h3 className="text-xl font-semibold leading-7 text-navy-deep">
                    {notice.title}
                  </h3>
                  <span className="text-sm font-semibold text-gold-warm">
                    자세히 보기
                  </span>
                </a>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
