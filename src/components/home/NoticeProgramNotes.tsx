import { FormattedCopy } from '../site-editor/FormattedCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import type { Notice } from '../../types/content'
import { getColorSampleHref } from '../../utils/colorSamplePath'
import { formatShortDate } from '../../utils/formatDate'
import { Button } from '../common/Button'
import { EmptyState } from '../common/EmptyState'

type NoticeProgramNotesProps = {
  emptyDescription?: string
  emptyButtonLabel?: string
  emptyTitle?: string
  notices: Notice[]
  panelButtonLabel?: string
  panelTitle?: string
}

const categoryLabels: Record<Notice['category'], string> = {
  concert: '공연',
  join: '모집',
  news: '소식',
  notice: '공지',
  press: '보도자료',
  rehearsal: '연습',
}

export function NoticeProgramNotes({
  emptyDescription = '새로운 공지와 합창단 소식을 준비하고 있습니다.',
  emptyButtonLabel = '공지사항 보기',
  emptyTitle = '등록된 공지사항이 없습니다',
  notices,
  panelButtonLabel = '전체 보기',
  panelTitle = '프로그램 노트',
}: NoticeProgramNotesProps) {
  const { copy: copyText } = useSiteEditor()
  if (notices.length === 0) {
    return (
      <aside className="notice-program-notes">
        <EmptyState
          action={
            <Button href="/notices" variant="secondary">
              {emptyButtonLabel}
            </Button>
          }
          description={emptyDescription}
          title={emptyTitle}
        />
      </aside>
    )
  }

  return (
    <aside aria-label={copyText("home", "home.fixed.NoticeProgramNotes.39b62d01a5", "중요 공지")} className="notice-program-notes">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-eyebrow text-gold-ink">{copyText("home", "home.fixed.NoticeProgramNotes.dfb14fbb9e", "NOTICE")}</p>
          <h3 className="type-card-title mt-3 text-navy-deep">{panelTitle}</h3>
        </div>
        <Button href="/notices" size="sm" variant="secondary">
          {panelButtonLabel}
        </Button>
      </div>

      <div className="mt-6">
        {notices.map((notice) => (
          <a
            className="notice-note-row"
            href={getColorSampleHref(`/notices/${notice.id}`)}
            key={notice.id}
          >
            <span className="min-w-0">
              <span className="notice-note-meta">
                {notice.is_important ? <FormattedCopy page="home" id="home.fixed.NoticeProgramNotes.f1d13e27f7" text={copyText("home", "home.fixed.NoticeProgramNotes.f1d13e27f7", "중요 안내")}>{copyText("home", "home.fixed.NoticeProgramNotes.f1d13e27f7", "중요 안내")}</FormattedCopy> : <FormattedCopy page="home" id={`home.noticeNotesCategory.${notice.category}`} text={copyText('home', `home.noticeNotesCategory.${notice.category}`, categoryLabels[notice.category])}>{copyText('home', `home.noticeNotesCategory.${notice.category}`, categoryLabels[notice.category])}</FormattedCopy>}
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
