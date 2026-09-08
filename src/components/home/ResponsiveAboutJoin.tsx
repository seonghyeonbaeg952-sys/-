import type { JoinInfoRow } from '../../types/cms'
import type { HomeContentV2 } from '../../types/homeContent'
import { Button } from '../common/Button'
import { ImageTile } from './ImageTile'
import type { HomeResponsiveViewport } from './useHomeResponsiveViewport'
import '../../styles/home-responsive-about-join.css'

export type AboutResponsiveCopy = {
  responsiveMobileDescription: string
  responsiveTabletDescription: string
  responsiveFounded: string
  responsiveContext: string
  responsiveTabletFacts: string
}

type JoinResponsiveCopy = {
  responsiveMobileTitle: string
  responsiveMobileDescription: string
  responsiveMobileGuardianNotes: string
  responsiveTabletGuardianNotes: string
}

function contentLines(value?: string | null) {
  return (value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
}

type ResponsiveCollectivePortraitProps = {
  buttonLabel: string
  content?: Partial<AboutResponsiveCopy>
  facts: ReadonlyArray<{ label: string; value: string }>
  image?: { alt: string; caption: string; src: string }
  kicker: string
  summary: string
  title: string
  viewport: Exclude<HomeResponsiveViewport, 'desktop'>
}

export function ResponsiveCollectivePortrait({
  buttonLabel, content, facts, image, kicker, summary, title, viewport,
}: ResponsiveCollectivePortraitProps) {
  const tablet = viewport === 'tablet'
  const description = (tablet ? content?.responsiveTabletDescription : content?.responsiveMobileDescription) || summary
  const founded = content?.responsiveFounded || ['SINCE', facts[0]?.value].filter(Boolean).join('\n')
  const context = content?.responsiveContext || facts.slice(1).map((fact) => fact.value).join('\n')
  const tabletFacts = contentLines(content?.responsiveTabletFacts || facts.map((fact) => fact.value).join('\n'))
  const portrait = image ?? {
    alt: '서울모테트청소년합창단 공연 무대',
    caption: '',
    src: '/images/sample/about-collective-portrait.png',
  }
  const action = (
    <Button className="responsive-about__action responsive-about-join__action" href="/about" variant="secondary">
      <span>{buttonLabel}</span>
    </Button>
  )

  return (
    <section
      aria-labelledby="home-responsive-about-title"
      className="flow-section home-section home-responsive-about"
      data-about-presentation="responsive-collective-portrait"
      data-flow-section="about"
      data-responsive-viewport={viewport}
      id="home-responsive-about"
    >
      {!tablet ? <div aria-hidden="true" className="responsive-about__rule" /> : null}
      <p className="responsive-about-join__eyebrow">
        <span aria-hidden="true">{tablet ? '01' : '01 /'}</span> {kicker}
      </p>
      <div className="responsive-about__introduction">
        <h2 id="home-responsive-about-title">{title}</h2>
        <div className="responsive-about__statement">
          {description ? <p className="responsive-about__description">{description}</p> : null}
          {tablet ? action : null}
        </div>
      </div>
      <ImageTile
        alt={portrait.alt}
        className="responsive-about__portrait"
        height={720}
        objectFit="contain"
        sizes="(min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)"
        src={portrait.src}
        width={1080}
      />
      {tablet ? (
        <ul aria-label="합창단 핵심 정보" className="responsive-about__tablet-facts">
          {tabletFacts.map((fact, index) => <li key={`${index}-${fact}`}>{fact}</li>)}
        </ul>
      ) : (
        <div aria-label="합창단 핵심 정보" className="responsive-about__mobile-facts">
          <p className="responsive-about__founded">{founded}</p>
          <p className="responsive-about__context">{context}</p>
        </div>
      )}
      {!tablet ? action : null}
    </section>
  )
}

type ResponsiveJoinInvitationProps = {
  buttonLabel?: string | null
  content: HomeContentV2['joinLetter'] & Partial<JoinResponsiveCopy>
  fallbackGuardianNotes: readonly string[]
  fallbackSteps: ReadonlyArray<{ title: string }>
  joinInfo?: JoinInfoRow | null
  tabletDescription: string
  viewport: Exclude<HomeResponsiveViewport, 'desktop'>
}

export function ResponsiveJoinInvitation({
  buttonLabel, content, fallbackGuardianNotes, fallbackSteps, joinInfo, tabletDescription, viewport,
}: ResponsiveJoinInvitationProps) {
  const tablet = viewport === 'tablet'
  const publicInfo = joinInfo?.is_visible ? joinInfo : null
  const target = contentLines(publicInfo?.target).join(' · ')
  const cmsSteps = contentLines(publicInfo?.audition_process).map((step) => step.replace(/^\d+[.)]\s*/, ''))
  const steps = cmsSteps.length ? cmsSteps : fallbackSteps.map((step) => step.title)
  const title = tablet ? content.title : content.responsiveMobileTitle || content.title
  const description = tablet ? tabletDescription : content.responsiveMobileDescription || content.description
  const guardianCopy = tablet ? content.responsiveTabletGuardianNotes : content.responsiveMobileGuardianNotes
  const guardianNotes = contentLines(guardianCopy || fallbackGuardianNotes.join('\n'))

  const primaryAction = (
    <Button className="responsive-join__primary responsive-about-join__action" href="/join?section=contact#application" variant="gold">
      <span>{buttonLabel || content.ctaLabel}</span>
    </Button>
  )
  const targetInfo = target ? <p className="responsive-join__target">{target}</p> : null
  const procedure = (
    <div className="responsive-join__procedure">
      {!tablet ? <p className="responsive-join__process-label">THE JOINING SCORE / {String(steps.length).padStart(2, '0')} STEPS</p> : null}
      <ol aria-label="입단 절차" className="responsive-join__steps">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`}>
            <span aria-hidden="true" className="responsive-join__step-number">{String(index + 1).padStart(2, '0')}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
  const guardianInfo = (
    <aside aria-label="보호자 안내" className="responsive-join__guardian">
      {!tablet ? <p>FOR PARENTS &amp; GUARDIANS</p> : null}
      <ul>{guardianNotes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}</ul>
    </aside>
  )

  return (
    <section
      aria-labelledby="home-responsive-join-title"
      className="flow-section home-section home-responsive-join"
      data-flow-section="join-letter"
      data-presentation="responsive-open-score"
      data-responsive-viewport={viewport}
      id="home-responsive-join"
    >
      {!tablet ? <img alt="" aria-hidden="true" className="responsive-join__motif" height={30} src="/images/home/responsive-join-motif.svg" width={342} /> : null}
      <p className="responsive-about-join__eyebrow">
        <span aria-hidden="true">{tablet ? '02' : '02 /'}</span> {content.eyebrowEn}
      </p>
      <div className="responsive-join__invitation">
        <h2 id="home-responsive-join-title">{title}</h2>
        {description ? <p className="responsive-join__description">{description}</p> : null}
        {!tablet ? targetInfo : null}
        {primaryAction}
      </div>
      {tablet ? (
        <div className="responsive-join__information">
          {targetInfo}
          {procedure}
          {guardianInfo}
        </div>
      ) : (
        <>
          {procedure}
          <div aria-hidden="true" className="responsive-join__rule" />
          {guardianInfo}
          <Button className="responsive-join__secondary responsive-about-join__action" href="/join?section=process" variant="secondary">
            <span>{content.secondaryCtaLabel}</span>
          </Button>
        </>
      )}
    </section>
  )
}
