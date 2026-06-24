import { useParams } from 'react-router'

import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { Card } from '../../components/common/Card'
import { Container } from '../../components/common/Container'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { LoadingState } from '../../components/common/LoadingState'
import { PageHero } from '../../components/common/PageHero'
import { ImageTile } from '../../components/home/ImageTile'
import { useNoticeDetailData } from '../../hooks/usePublicData'
import { formatShortDate } from '../../utils/formatDate'

export function NoticeDetailPage() {
  const { noticeId } = useParams()
  const noticeData = useNoticeDetailData(noticeId)
  const notice = noticeData.data

  return (
    <>
      <PageHero
        description={notice ? formatShortDate(notice.created_at) : '공지 상세'}
        eyebrow="NOTICE DETAIL"
        title={notice?.title || '공지 상세'}
      />
      <Container className="py-section-mobile lg:py-section-desktop">
        {noticeData.isLoading ? (
          <LoadingState label="공지 상세를 불러오는 중입니다" />
        ) : null}

        {!noticeData.isLoading && noticeData.error ? (
          <ErrorState description={noticeData.error} />
        ) : null}

        {!noticeData.isLoading && !noticeData.error && !notice ? (
          <EmptyState
            action={
              <Button href="/notices" variant="secondary">
                공지 목록으로
              </Button>
            }
            title="공지사항을 찾을 수 없습니다"
          />
        ) : null}

        {!noticeData.isLoading && notice ? (
          <article className="mx-auto max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={notice.is_important ? 'navy' : 'gold'}>
                {notice.is_important ? '중요' : notice.category}
              </Badge>
              <p className="text-sm text-text-muted">
                {formatShortDate(notice.created_at)}
              </p>
            </div>
            {notice.cover_image_url ? (
              <ImageTile
                alt={`${notice.title} 대표 이미지`}
                className="mt-8 aspect-[16/9] rounded-card shadow-card"
                src={notice.cover_image_url}
              />
            ) : null}
            <Card className="mt-8 p-6 sm:p-8">
              <div className="whitespace-pre-line break-keep text-base leading-8 text-text-muted">
                {notice.content || '등록된 본문이 없습니다.'}
              </div>
            </Card>
            <div className="mt-8">
              <Button href="/notices" variant="secondary">
                목록으로 돌아가기
              </Button>
            </div>
          </article>
        ) : null}
      </Container>
    </>
  )
}
