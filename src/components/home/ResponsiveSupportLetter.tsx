import type { HomeContentV2 } from '../../types/homeContent'
import { Button } from '../common/Button'
import type { HomeResponsiveViewport } from './useHomeResponsiveViewport'
import '../../styles/home-responsive-support.css'

type ResponsiveSupportLetterProps = {
  content: HomeContentV2['supportLetter']
  viewport: Exclude<HomeResponsiveViewport, 'desktop'>
}

function SupportUses({ content }: Pick<ResponsiveSupportLetterProps, 'content'>) {
  return (
    <ol className="home-responsive-support__uses">
      {[content.responsiveUse1, content.responsiveUse2, content.responsiveUse3].map((label, index) => (
        <li key={index}>
          <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  )
}

export function ResponsiveSupportLetter({ content, viewport }: ResponsiveSupportLetterProps) {
  const isTablet = viewport === 'tablet'
  return (
    <section aria-labelledby="home-responsive-support-title" className="flow-section home-section home-responsive-support" data-flow-section="support-letter" id="home-responsive-support">
      {!isTablet ? <div aria-hidden="true" className="home-responsive-support__rule" /> : null}
      <p className="home-responsive-support__eyebrow">{isTablet ? content.responsiveTabletEyebrow : content.eyebrowEn}</p>
      <div className="home-responsive-support__layout">
        <div className="home-responsive-support__invitation">
          <h2 id="home-responsive-support-title">{content.responsiveTitle}</h2>
          <p className="home-responsive-support__description">{isTablet ? content.responsiveTabletDescription : content.responsiveMobileDescription}</p>
          <Button className="home-responsive-support__action" href="/contact?section=support#form" variant="gold">
            {content.primaryCtaLabel}
          </Button>
        </div>
        <article className="home-responsive-support__letter">
          <p className="home-responsive-support__letter-eyebrow">{content.pledgeEyebrow}</p>
          <h3>{content.pledgeTitle}</h3>
          <p className="home-responsive-support__letter-description">{isTablet ? content.responsiveTabletPledgeDescription : content.responsiveMobilePledgeDescription}</p>
          {isTablet ? <><div aria-hidden="true" className="home-responsive-support__letter-rule" /><SupportUses content={content} /></> : null}
        </article>
      </div>
      {!isTablet ? <SupportUses content={content} /> : null}
    </section>
  )
}
