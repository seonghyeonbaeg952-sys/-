import type { Notice } from '../../../types/content'
import { getColorSampleHref } from '../../../utils/colorSamplePath'
import { formatShortDate } from '../../../utils/formatDate'
import { TransitionLink } from '../../common/TransitionLink'

type HomeV4ProgramNoticeStripProps = {
  emptyDescription?: string
  emptyButtonLabel?: string
  emptyTitle?: string
  notices: Notice[]
  panelButtonLabel?: string
  panelTitle?: string
}

const categoryLabels: Record<Notice['category'], string> = {
  concert: '공연 소식',
  join: '모집 안내',
  news: '합창단 소식',
  notice: '일반 안내',
  press: '보도자료',
  rehearsal: '연습 안내',
}

export function HomeV4ProgramNoticeStrip({
  emptyDescription = '새로운 공지와 합창단 소식을 준비하고 있습니다.',
  emptyButtonLabel = '공지사항 보기',
  emptyTitle = '등록된 공지사항이 없습니다',
  notices,
  panelButtonLabel = '전체 보기',
  panelTitle = '프로그램 노트',
}: HomeV4ProgramNoticeStripProps) {
  const visibleNotices = notices.slice(0, 3)
  const noticeSlots = Array.from({ length: 3 }, (_, index) => visibleNotices[index])

  return (
    <>
      <div aria-hidden="true" className="home-v4-program-note-datum">
        <svg
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 1200 64"
        >
          <path className="home-v4-program-note-datum__top" d="M0 1 H1200" />
          <path
            className="home-v4-program-note-datum__incision"
            d="M0 20 H558 L600 54 L642 20 H1200 M0 20 V62 M1200 20 V62"
          />
        </svg>
        <span>ARCHITECTURAL PAPER DATUM</span>
      </div>
      <aside
        aria-label="프로그램 노트"
        className="home-v4-program-note"
        data-empty={visibleNotices.length === 0 ? 'true' : undefined}
      >
      <div className="home-v4-program-note__heading">
        <p>NOTICE</p>
        <h3>{panelTitle}</h3>
      </div>

      <TransitionLink
        className="home-v4-program-note__all"
        to={getColorSampleHref('/notices')}
      >
        <span>{panelButtonLabel}</span>
        <span aria-hidden="true">→</span>
      </TransitionLink>

      {visibleNotices.length > 0 ? (
        <div className="home-v4-program-note__items">
          {noticeSlots.map((notice, index) =>
            notice ? (
              <TransitionLink
                className="home-v4-program-note__item"
                key={notice.id}
                to={getColorSampleHref(`/notices/${notice.id}`)}
              >
                <span className="home-v4-program-note__meta">
                  <span className="home-v4-program-note__category">
                    {notice.is_important
                      ? '중요 안내'
                      : categoryLabels[notice.category]}
                  </span>
                  <time dateTime={notice.created_at}>
                    {formatShortDate(notice.created_at)}
                  </time>
                </span>
                <strong>{notice.title}</strong>
              </TransitionLink>
            ) : (
              <span
                aria-hidden="true"
                className="home-v4-program-note__item home-v4-program-note__item--empty"
                key={`empty-notice-${index}`}
              />
            ),
          )}
        </div>
      ) : (
        <div className="home-v4-program-note__empty">
          <strong>{emptyTitle}</strong>
          <p>{emptyDescription}</p>
          <TransitionLink to={getColorSampleHref('/notices')}>
            {emptyButtonLabel}
            <span aria-hidden="true">→</span>
          </TransitionLink>
        </div>
      )}
      </aside>
    </>
  )
}
