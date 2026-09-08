import { useSearchParams } from 'react-router'

import { AnimatedSectionTabs } from '../../components/common/AnimatedSectionTabs'
import { Container } from '../../components/common/Container'
import { ErrorState } from '../../components/common/ErrorState'
import { MapPreview } from '../../components/common/MapPreview'
import { PageHero } from '../../components/common/PageHero'
import { SeoHead } from '../../components/common/SeoHead'
import { SectionTitle } from '../../components/common/SectionTitle'
import { AccompanistProfiles } from '../../components/about/AccompanistProfiles'
import { AboutOverviewExperience } from '../../components/about/AboutOverviewExperience'
import { ConductorProfileDocument } from '../../components/about/ConductorProfileDocument'
import { HistoryCueSheetExperience } from '../../components/about/HistoryCueSheetExperience'
import { MembersArchiveExperience } from '../../components/about/MembersArchiveExperience'
import {
  legacyAboutSections,
  legacyChoirIntro,
  legacyLocationSeed,
} from '../../constants/legacyContent'
import { useAboutData } from '../../hooks/usePublicData'
import {
  aboutSectionTabs,
  resolveAboutSectionView,
  type AboutSectionKey,
} from '../../lib/aboutNavigation'

function AboutSectionSelector({ activeSection }: { activeSection: AboutSectionKey }) {
  return (
    <div
      className="section-tabs-wrap relative overflow-hidden rounded-formal border border-line-default bg-bg-warm-white p-3 shadow-card"
    >
      <div aria-hidden="true" className="about-section-selector__accent" />
      <AnimatedSectionTabs
        activeValue={activeSection}
        ariaLabel="소개 섹션 선택"
        tabs={aboutSectionTabs}
        tone="navy"
      />
    </div>
  )
}

export function AboutPage() {
  const aboutData = useAboutData()
  const [searchParams] = useSearchParams()
  const {
    aboutSections,
    accompanists,
    conductor,
    history,
    location,
    members,
    siteSettings,
  } = aboutData.data
  const allAboutSections = aboutData.error ? legacyAboutSections : aboutSections
  const aboutIntroSections = allAboutSections.filter(
    (section) => !section.section_key.startsWith('spirit_') && !section.section_key.startsWith('home_') && !section.section_key.startsWith('join_') && !section.section_key.startsWith('footer_'),
  )
  const locationAddress =
    location?.address ||
    `${legacyLocationSeed.address} ${legacyLocationSeed.detail_address ?? ''}`.trim()
  const introSummary =
    siteSettings?.about_summary ||
    aboutIntroSections[0]?.content ||
    legacyChoirIntro.summary
  const { activeSection, shouldShowOverview } = resolveAboutSectionView(
    searchParams.get('section'),
  )
  const shouldShowAll = activeSection === 'all'
  const shouldShowConductor = shouldShowAll || activeSection === 'conductor'
  const shouldShowAccompanists = shouldShowAll || activeSection === 'accompanist'
  const shouldShowMembers = shouldShowAll || activeSection === 'members'
  const shouldShowHistory = shouldShowAll || activeSection === 'history'
  const shouldShowDedicatedConductor = activeSection === 'conductor'
  const shouldShowDedicatedAccompanists = activeSection === 'accompanist'
  const shouldShowDedicatedMembers = activeSection === 'members'
  const shouldShowDedicatedHistory = activeSection === 'history'
  const shouldShowOtherDetails = shouldShowHistory

  return (
    <>
      <SeoHead
        description={
          introSummary ||
          '서울모테트청소년합창단의 지휘자, 반주자, 단원과 연혁을 소개합니다.'
        }
        path="/about"
        title="합창단 소개"
      />
      {shouldShowOverview ||
      shouldShowDedicatedConductor ||
      shouldShowDedicatedAccompanists ||
      shouldShowDedicatedMembers ||
      shouldShowDedicatedHistory ? null : (
        <PageHero
          description={introSummary}
          eyebrow="ABOUT"
          title="합창단 소개"
        />
      )}

      <div className="about-overview-nav">
        <Container className="space-y-4">
          {!shouldShowOverview && aboutData.error ? (
            <ErrorState
              description="Supabase 공개 데이터를 불러오지 못해 기본 소개 정보를 표시합니다."
              title="기본 소개 정보로 표시 중입니다"
            />
          ) : null}
          <AboutSectionSelector activeSection={activeSection} />
        </Container>
      </div>

      {shouldShowOverview ? <AboutOverviewExperience /> : null}

      {shouldShowConductor ? (
        <ConductorProfileDocument person={conductor} />
      ) : null}

      {shouldShowAccompanists ? (
        <AccompanistProfiles
          headingLevel={shouldShowDedicatedAccompanists ? 'h1' : 'h2'}
          people={accompanists}
        />
      ) : null}

      {shouldShowMembers ? (
        <MembersArchiveExperience
          headingLevel={shouldShowDedicatedMembers ? 'h1' : 'h2'}
          members={members}
        />
      ) : null}

      {shouldShowOtherDetails ? (
        <>
          {shouldShowHistory ? (
            <HistoryCueSheetExperience
              compact={shouldShowAll}
              history={history}
              shouldUseLegacyFallback={Boolean(aboutData.error)}
            />
          ) : null}

          {shouldShowAll ? (
            <Container className="page-main">
              <section>
                <SectionTitle eyebrow="LOCATION" title="오시는 길" />
                <div className="mt-8">
                  <MapPreview
                    address={locationAddress}
                    embedUrl={location?.map_embed_url}
                    kakaoMapUrl={location?.kakao_map_url}
                    naverMapUrl={location?.naver_map_url}
                    placeName={location?.place_name || '서울모테트음악재단'}
                  />
                </div>
              </section>
            </Container>
          ) : null}
        </>
      ) : null}
    </>
  )
}
