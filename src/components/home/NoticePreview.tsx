import type { Notice } from '../../types/content'
import { formatShortDate } from '../../utils/formatDate'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'
import { StaffLines } from '../common/StaffLines'

type NoticePreviewProps = {
  buttonLabel?: string
  description?: string
  notices: Notice[]
  title?: string
}

const categoryLabels: Record<Notice['category'], string> = {
  concert: '공연',
  join: '모집',
  news: '소식',
  notice: '공지',
  press: '보도자료',
  rehearsal: '연습',
}

export function NoticePreview({
  buttonLabel = '공지사항 보기',
  description = '입단, 공연, 갤러리 업데이트 등 중요한 소식을 먼저 안내합니다.',
  notices,
  title = '공지와 소식',
}: NoticePreviewProps) {
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
    <section className="relative overflow-hidden bg-bg-ivory py-[clamp(4rem,8vw,8rem)]">
      <Container>
        <Reveal variant="fade-up">
          <SectionTitle
          action={
            <Button href="/notices" variant="secondary">
              {buttonLabel}
            </Button>
          }
          description={description}
          eyebrow="NOTICE"
          title={title}
          />
        </Reveal>

        {visibleNotices.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              description="새로운 공지와 합창단 소식을 준비하고 있습니다."
              title="등록된 공지사항이 없습니다"
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-4">
            {visibleNotices.map((notice, index) => (
              <Reveal key={notice.id} staggerIndex={index} variant="card-rise">
                <Card
                hoverable
                radius="formal"
                className={[
                  'relative overflow-hidden',
                  notice.is_important ? 'border-gold-warm/55' : '',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'absolute inset-y-0 left-0 w-1',
                    notice.is_important ? 'bg-gold-warm' : 'bg-line-default',
                  ].join(' ')}
                />
                <Reveal
                  className="absolute inset-x-7 top-5"
                  delay={80}
                  variant="line-draw"
                >
                  <StaffLines
                    className="opacity-45"
                    density="light"
                    variant={notice.is_important ? 'gold' : 'subtle'}
                  />
                </Reveal>
                <a
                  className="grid gap-5 p-6 pl-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-ink md:grid-cols-[180px_1fr_auto] md:items-center"
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
                  <span className="text-sm font-semibold text-gold-ink">
                    자세히 보기
                  </span>
                </a>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}
