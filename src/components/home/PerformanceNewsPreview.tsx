import type { Concert, Notice } from '../../types/content'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { BenchmarkConcertTemplate } from './benchmark/BenchmarkConcertTemplate'
import { KineticHeadline } from './KineticHeadline'
import { NoticeProgramNotes } from './NoticeProgramNotes'
import '../../styles/home-motion-benchmark.css'

type PerformanceNewsPreviewProps = {
  concertButtonLabel?: string
  concerts: Concert[]
  detailButtonLabel?: string
  eyebrow?: string
  ghost?: string
  inquiryButtonLabel?: string
  notices: Notice[]
  noticeButtonLabel?: string
  programNoteLabel?: string
  title?: string
}

export function PerformanceNewsPreview({
  concertButtonLabel = '공연 일정 보기',
  concerts,
  detailButtonLabel = '자세히 보기',
  eyebrow = 'CONCERTS',
  ghost = 'PROGRAM',
  inquiryButtonLabel = '문의',
  notices,
  noticeButtonLabel = '공지사항 보기',
  programNoteLabel = 'PROGRAM NOTE',
  title = '공연과 소식',
}: PerformanceNewsPreviewProps) {
  const featuredConcerts = [...concerts]
    .filter((concert) => concert.is_visible)
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 3)
  const visibleNotices = [...notices]
    .filter((notice) => notice.is_visible)
    .sort((first, second) => {
      if (first.is_important !== second.is_important) {
        return first.is_important ? -1 : 1
      }

      return second.created_at.localeCompare(first.created_at)
    })
    .slice(0, 4)

  return (
    <section
      className="flow-section home-section relative overflow-hidden bg-bg-warm-white"
      data-flow-section="concert-program"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--concert"
        label="공연"
        noteOffset={13}
        symbol="♪"
      />
      <Container>
        <Reveal variant="fade-up">
          <div className="section-title">
            <KineticHeadline eyebrow={eyebrow} ghost={ghost} lines={[title]} />
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                <Button href="/concerts" variant="secondary">
                  {concertButtonLabel}
                </Button>
                <Button href="/notices" variant="secondary">
                  {noticeButtonLabel}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="home-performance-news mt-9">
          <Reveal variant="card-rise">
            <BenchmarkConcertTemplate
              concerts={featuredConcerts}
              detailButtonLabel={detailButtonLabel}
              inquiryButtonLabel={inquiryButtonLabel}
              programNoteLabel={programNoteLabel}
            />
          </Reveal>
          <Reveal delay={80} variant="card-rise">
            <NoticeProgramNotes notices={visibleNotices} />
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
