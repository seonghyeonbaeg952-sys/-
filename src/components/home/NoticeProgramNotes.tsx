import type { Notice } from '../../types/content'
import { formatShortDate } from '../../utils/formatDate'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'

type NoticeProgramNotesProps = {
  notices: Notice[]
}

const categoryLabels: Record<Notice['category'], string> = {
  concert: '공연',
  join: '모집',
  news: '소식',
  notice: '공지',
  press: '보도자료',
  rehearsal: '연습',
}

export function NoticeProgramNotes({ notices }: NoticeProgramNotesProps) {
  if (notices.length === 0) {
    return (
      <aside className="notice-program-notes">
        <EmptyState
          action={
            <Button href="/notices" variant="secondary">
              공지사항 보기
            </Button>
          }
          description="새로운 공지와 합창단 소식을 준비하고 있습니다."
          title="등록된 공지사항이 없습니다"
        />
      </aside>
    )
  }

  return (
    <aside aria-label="중요 공지" className="notice-program-notes">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-eyebrow text-gold-ink">NOTICE</p>
          <h3 className="type-card-title mt-3 text-navy-deep">프로그램 노트</h3>
        </div>
        <Button href="/notices" size="sm" variant="secondary">
          전체 보기
        </Button>
      </div>

      <div className="mt-6">
        {notices.map((notice) => (
          <a
            className="notice-note-row"
            href={`/notices/${notice.id}`}
            key={notice.id}
          >
            <span className="min-w-0">
              <span className="notice-note-meta">
                {notice.is_important ? '중요 안내' : categoryLabels[notice.category]}
                <span aria-hidden="true"> · </span>
                {formatShortDate(notice.created_at)}
              </span>
              <strong>{notice.title}</strong>
            </span>
            <span aria-hidden="true" className="notice-note-arrow">
              →
            </span>
          </a>
        ))}
      </div>
    </aside>
  )
}
