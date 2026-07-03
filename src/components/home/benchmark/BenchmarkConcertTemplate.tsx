import type { Concert } from '../../../types/content'
import { ConcertTemplatePanel } from '../ConcertTemplatePanel'

type BenchmarkConcertTemplateProps = {
  concerts: Concert[]
  detailButtonLabel?: string
  inquiryButtonLabel?: string
  programNoteLabel?: string
}

export function BenchmarkConcertTemplate({
  concerts,
  detailButtonLabel,
  inquiryButtonLabel,
  programNoteLabel,
}: BenchmarkConcertTemplateProps) {
  return (
    <div aria-label={programNoteLabel} className="home-concert-template-stack">
      <ConcertTemplatePanel
        concert={concerts[0]}
        detailButtonLabel={detailButtonLabel}
        inquiryButtonLabel={inquiryButtonLabel}
      />
    </div>
  )
}
