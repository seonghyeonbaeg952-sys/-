import { useId } from 'react'

import type { HomeContentV2 } from '../../types/homeContent'
import { ScrollScoreBookReveal } from './ScrollScoreBookReveal'
import { useHomeResponsiveViewport } from './useHomeResponsiveViewport'
import '../../styles/home-responsive-score.css'

type ResponsiveHomeScoreProps = {
  content: HomeContentV2['scoreBook']
}

export function ResponsiveHomeScore({ content }: ResponsiveHomeScoreProps) {
  const layout = useHomeResponsiveViewport()
  const headingId = useId()

  if (layout === 'desktop') return <ScrollScoreBookReveal content={content} />
  if (layout === 'mobile') return null

  return (
    <section aria-labelledby={headingId} className="flow-section home-section home-responsive-score" data-flow-section="score-book" id="home-responsive-score">
      <p className="home-responsive-score__eyebrow">{content.responsiveEyebrow}</p>
      <h2 className="home-responsive-score__title" id={headingId}>{content.responsiveTitle}</h2>
      <div className="home-responsive-score__pages">
        <article className="home-responsive-score__page">
          <h3>{content.responsiveLeftTitle}</h3>
          <p>{content.responsiveLeftBody}</p>
        </article>
        <article className="home-responsive-score__page">
          <h3>{content.responsiveRightTitle}</h3>
          <p>{content.responsiveRightBody}</p>
        </article>
      </div>
    </section>
  )
}
