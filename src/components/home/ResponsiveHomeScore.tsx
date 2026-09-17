import { useId } from 'react'
import { HomeCopy } from './HomeCopy'

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
      <p className="home-responsive-score__eyebrow"><HomeCopy sourceKey="home.scoreBook.responsiveEyebrow" text={content.responsiveEyebrow} /></p>
      <h2 className="home-responsive-score__title" id={headingId}><HomeCopy sourceKey="home.scoreBook.responsiveTitle" text={content.responsiveTitle} /></h2>
      <div className="home-responsive-score__pages">
        <article className="home-responsive-score__page">
          <h3><HomeCopy sourceKey="home.scoreBook.responsiveLeftTitle" text={content.responsiveLeftTitle} /></h3>
          <p><HomeCopy sourceKey="home.scoreBook.responsiveLeftBody" text={content.responsiveLeftBody} /></p>
        </article>
        <article className="home-responsive-score__page">
          <h3><HomeCopy sourceKey="home.scoreBook.responsiveRightTitle" text={content.responsiveRightTitle} /></h3>
          <p><HomeCopy sourceKey="home.scoreBook.responsiveRightBody" text={content.responsiveRightBody} /></p>
        </article>
      </div>
    </section>
  )
}
