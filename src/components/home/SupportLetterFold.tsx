import { useSiteEditor } from '../site-editor/useSiteEditor'
import { EditableLayout } from '../site-editor/EditableLayout'
import { HomeCopy } from './HomeCopy'
import { legacyLocationSeed } from '../../constants/legacyContent'
import type { SiteSettings } from '../../types/content'
import type { HomeContentV2 } from '../../types/homeContent'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { ResponsiveSupportLetter } from './ResponsiveSupportLetter'
import { useHomeResponsiveViewport } from './useHomeResponsiveViewport'

type SupportLetterFoldProps = {
  content: HomeContentV2['supportLetter']
  settings?: SiteSettings
  approvedResponsive?: boolean
}

const fallback = {
  body:
    '후원금은 악보와 교육 자료, 연습과 공연 준비, 국제교류 활동에 사용됩니다. 후원 상담과 일반 문의는 공식 문의 폼으로 접수합니다.',
  title: '후원은 청소년 합창교육과 공연 활동을 지원합니다',
}

const supportUses = [
  {
    description: '배움의 기초를 단단하게',
    number: '01',
    title: '악보와 교육 자료',
  },
  {
    description: '좋은 무대를 차분하게',
    number: '02',
    title: '연습과 공연 준비',
  },
  {
    description: '다음 목소리를 오래도록',
    number: '03',
    title: '다음 세대 합창교육',
  },
] as const

export function SupportLetterFold({
  content,
  settings,
  approvedResponsive = false,
}: SupportLetterFoldProps) {
  const { copy: copyText } = useSiteEditor()
  const viewport = useHomeResponsiveViewport()
  if (approvedResponsive && viewport !== 'desktop') {
    return <ResponsiveSupportLetter content={content} viewport={viewport} />
  }

  const phone = settings?.phone || legacyLocationSeed.phone
  const address =
    settings?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()

  return (
    <section
      aria-labelledby="home-support-title"
      className="flow-section support-letter-section support-letter-section--archive-pledge home-section relative"
      data-flow-section="support-letter"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--support"
        label={content.eyebrowKo}
        noteOffset={11}
        symbol="♩"
      />
      <Container className="support-pledge-container">
        <header className="support-pledge-folio" aria-hidden="true">
          <p>{copyText("home", "home.fixed.SupportLetterFold.2ca09c78c6", "SUPPORT LETTER · 다음 기록을 함께 만듭니다")}</p>
        </header>

        <div className="support-letter-layout">
          <div className="support-pledge-copy">
            <p className="support-pledge-eyebrow"><HomeCopy sourceKey="home.supportLetter.eyebrowEn" text={content.eyebrowEn} /></p>
            <EditableLayout id="home.support.title"><h2 id="home-support-title">
              <HomeCopy sourceKey="home.supportLetter.title" text={content.title || fallback.title} />
            </h2></EditableLayout>
            <EditableLayout id="home.support.description"><p className="support-pledge-description">
              <HomeCopy sourceKey="home.supportLetter.description" text={content.description || fallback.body} />
            </p></EditableLayout>
            <p className="support-pledge-values">{copyText("home", "home.fixed.SupportLetterFold.97e1959dd9", "정직한 음악 ")}<span aria-hidden="true">·</span>{copyText("home", "home.fixed.SupportLetterFold.31e5f76d33", " 함께 부르는 공동체")}{' '}
              <span aria-hidden="true">·</span>{copyText("home", "home.fixed.SupportLetterFold.6a95b54c19", " 다음 세대 교육")}</p>
            <div className="support-pledge-actions">
              <Button
                className="support-pledge-action support-pledge-action--primary"
                href="/contact?section=support#form"
                size="lg"
                variant="gold"
              >
                <HomeCopy sourceKey="home.supportLetter.primaryCtaLabel" text={content.primaryCtaLabel} />
              </Button>
              <Button
                className="support-pledge-action support-pledge-action--secondary"
                href="/contact"
                size="lg"
                variant="secondary"
              >
                <HomeCopy sourceKey="home.supportLetter.secondaryCtaLabel" text={content.secondaryCtaLabel} />
              </Button>
            </div>
          </div>

          <article className="support-pledge-letter">
            <p className="support-pledge-letter__eyebrow">
              <HomeCopy sourceKey="home.supportLetter.pledgeEyebrow" text={content.pledgeEyebrow} />
            </p>
            <h3><HomeCopy sourceKey="home.supportLetter.pledgeTitle" text={content.pledgeTitle} /></h3>
            <p className="support-pledge-letter__description">
              <HomeCopy sourceKey="home.supportLetter.pledgeDescription" text={content.pledgeDescription} />
            </p>

            <ol className="support-pledge-uses">
              {supportUses.map((use) => (
                <li key={use.number}>
                  <span className="support-pledge-use__number">{use.number}</span>
                  <strong>{use.title}</strong>
                  <span>{use.description}</span>
                </li>
              ))}
            </ol>

            <dl className="support-pledge-contact">
              <div>
                <dt>{copyText("home", "home.fixed.SupportLetterFold.6db518d738", "전화")}</dt>
                <dd>{phone}</dd>
              </div>
              <div>
                <dt>{copyText("home", "home.fixed.SupportLetterFold.28e058c7ce", "주소")}</dt>
                <dd>{address}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div className="support-pledge-score" aria-hidden="true">
          <ol>
            <li>{copyText("home", "home.fixed.SupportLetterFold.4da9a75910", "교육")}</li>
            <li>{copyText("home", "home.fixed.SupportLetterFold.3906aa577b", "연습")}</li>
            <li>{copyText("home", "home.fixed.SupportLetterFold.1c3a0a24ef", "공연")}</li>
          </ol>
        </div>
      </Container>
    </section>
  )
}
