import type { HomeContentV2 } from '../../types/homeContent'
import { EditableLayout } from '../site-editor/EditableLayout'
import { Button } from '../common/Button'
import type { HomeResponsiveViewport } from './useHomeResponsiveViewport'
import '../../styles/home-responsive-support.css'
import { HomeCopy } from './HomeCopy'

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
          <span><HomeCopy sourceKey={`home.supportLetter.responsiveUse${index + 1}`} text={label} /></span>
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
      <p className="home-responsive-support__eyebrow"><HomeCopy sourceKey={`home.supportLetter.${isTablet ? 'responsiveTabletEyebrow' : 'eyebrowEn'}`} text={isTablet ? content.responsiveTabletEyebrow : content.eyebrowEn} /></p>
      <div className="home-responsive-support__layout">
        <div className="home-responsive-support__invitation">
          <EditableLayout id="home.support.title"><h2 id="home-responsive-support-title"><HomeCopy sourceKey="home.supportLetter.responsiveTitle" text={content.responsiveTitle} /></h2></EditableLayout>
          <EditableLayout id="home.support.description"><p className="home-responsive-support__description"><HomeCopy sourceKey={`home.supportLetter.${isTablet ? 'responsiveTabletDescription' : 'responsiveMobileDescription'}`} text={isTablet ? content.responsiveTabletDescription : content.responsiveMobileDescription} /></p></EditableLayout>
          <Button className="home-responsive-support__action" href="/contact?section=support#form" variant="gold">
            <HomeCopy sourceKey="home.supportLetter.primaryCtaLabel" text={content.primaryCtaLabel} />
          </Button>
        </div>
        <article className="home-responsive-support__letter">
          <p className="home-responsive-support__letter-eyebrow"><HomeCopy sourceKey="home.supportLetter.pledgeEyebrow" text={content.pledgeEyebrow} /></p>
          <h3><HomeCopy sourceKey="home.supportLetter.pledgeTitle" text={content.pledgeTitle} /></h3>
          <p className="home-responsive-support__letter-description"><HomeCopy sourceKey={`home.supportLetter.${isTablet ? 'responsiveTabletPledgeDescription' : 'responsiveMobilePledgeDescription'}`} text={isTablet ? content.responsiveTabletPledgeDescription : content.responsiveMobilePledgeDescription} /></p>
          {isTablet ? <><div aria-hidden="true" className="home-responsive-support__letter-rule" /><SupportUses content={content} /></> : null}
        </article>
      </div>
      {!isTablet ? <SupportUses content={content} /> : null}
    </section>
  )
}
