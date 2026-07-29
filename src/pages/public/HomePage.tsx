import { useMemo, type ReactNode } from 'react'

import { Button } from '../../components/common/Button'
import { Container } from '../../components/common/Container'
import { ErrorState } from '../../components/common/ErrorState'
import { SeoHead } from '../../components/common/SeoHead'
import { StaffFlowRail } from '../../components/common/StaffFlowRail'
import {
  AboutPreview,
  type AboutPreviewPresentation,
} from '../../components/home/AboutPreview'
import { FloatingInfoCards } from '../../components/home/FloatingInfoCards'
import { GalleryPreview } from '../../components/home/GalleryPreview'
import { HomeFlowProvider } from '../../components/home/HomeFlowProvider'
import { HomeHeroIntroOverlay } from '../../components/home/HomeHeroIntroOverlay'
import { HomeHeroSlideshow } from '../../components/home/HomeHeroSlideshow'
import { HomePopupManager } from '../../components/home/HomePopupManager'
import { HomeSpiritScoreBook } from '../../components/home/HomeSpiritScoreBook'
import { JoinCTA } from '../../components/home/JoinCTA'
import { JoinOpenScoreCTA } from '../../components/home/JoinOpenScoreCTA'
import { PerformanceNewsPreview } from '../../components/home/PerformanceNewsPreview'
import { ScrollScoreBookReveal } from '../../components/home/ScrollScoreBookReveal'
import { SponsorQuietMarquee } from '../../components/home/SponsorQuietMarquee'
import { SupportLetterFold } from '../../components/home/SupportLetterFold'
import { HOME_HERO_REFERENCE_COPY } from '../../constants/homeHeroReference'
import { useHomeData } from '../../hooks/usePublicData'
import { normalizeHomeContentV2 } from '../../lib/homeContent'
import type { Concert, GalleryImage } from '../../types/content'

type HomePageMode = 'default' | 'section-flow-sample'

type HomePageProps = {
  aboutPresentation?: AboutPreviewPresentation
  joinPresentation?: 'legacy' | 'open-score'
  joinOpenScorePresentation?: 'default' | 'figma-open-score'
  mode?: HomePageMode
  spiritPresentation?: 'editorial' | 'scorebook'
}

type HomeFlowSampleChunkProps = {
  children: ReactNode
  enabled: boolean
  tone: 'warm' | 'stage' | 'finale'
}

type HomeFlowSampleHoldProps = {
  children: ReactNode
  enabled: boolean
  variant?: 'compact' | 'editorial' | 'full'
}

const homeMEdgePath = 'M0 24H580V72L720 24L860 72V24H1440V102H0Z'

function HomeFlowSampleChunk({
  children,
  enabled,
  tone,
}: HomeFlowSampleChunkProps) {
  if (!enabled) {
    return <>{children}</>
  }

  if (tone === 'warm') {
    return (
      <div className="home-flow-sample-chunk home-flow-sample-chunk--warm">
        <div className="home-flow-sample-chunk__content">{children}</div>
      </div>
    )
  }

  return (
    <div className={`home-flow-sample-chunk home-flow-sample-chunk--${tone}`}>
      <div aria-hidden="true" className="home-flow-sample-chunk__surface">
        <svg
          className="home-flow-sample-chunk__edge"
          preserveAspectRatio="none"
          viewBox="0 0 1440 102"
        >
          <path
            className="home-flow-sample-chunk__edge-depth"
            d={homeMEdgePath}
            transform="translate(0 6)"
          />
          <path
            className="home-flow-sample-chunk__edge-face"
            d={homeMEdgePath}
          />
        </svg>
      </div>
      <div className="home-flow-sample-chunk__content">{children}</div>
    </div>
  )
}

function HomeFlowSampleHold({
  children,
  enabled,
  variant = 'compact',
}: HomeFlowSampleHoldProps) {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <div
      className={`home-flow-sample-hold-track home-flow-sample-hold-track--${variant}`}
    >
      <div className="home-flow-sample-hold">
        <div className="home-flow-sample-hold__panel">{children}</div>
      </div>
    </div>
  )
}

function getVisibleGalleryImages(images: GalleryImage[]) {
  return [...images]
    .filter((image) => image.is_visible && image.image_url.trim())
    .sort((first, second) => first.display_order - second.display_order)
}

function getNextConcert(concerts: Concert[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return [...concerts]
    .filter((concert) => {
      if (!concert.is_visible || !concert.date || concert.status === 'cancelled') {
        return false
      }

      const concertDate = new Date(`${concert.date}T00:00:00`)

      return !Number.isNaN(concertDate.getTime()) && concertDate >= today
    })
    .sort((first, second) => first.date.localeCompare(second.date))[0]
}

export function HomePage({
  aboutPresentation = 'default',
  joinOpenScorePresentation = 'default',
  joinPresentation = 'legacy',
  mode = 'default',
  spiritPresentation = 'scorebook',
}: HomePageProps) {
  const homeData = useHomeData()
  const {
    aboutSections,
    concerts,
    gallery,
    heroSlides,
    joinInfo,
    notices,
    posters,
    popupNotices,
    siteSettings,
    siteTexts,
    sponsors,
    videos,
  } = homeData.data
  const homeContent = useMemo(
    () => normalizeHomeContentV2(siteTexts),
    [siteTexts],
  )
  const visibleGalleryImages = getVisibleGalleryImages(gallery)
  const aboutVisualImage =
    visibleGalleryImages.length > 1 ? visibleGalleryImages[0] : undefined
  const spiritVisualImage =
    visibleGalleryImages.length > 1 ? visibleGalleryImages[1] : undefined
  const galleryPreviewImages = aboutVisualImage
    ? gallery.filter((image) => image.id !== aboutVisualImage.id)
    : gallery
  const nextConcert = getNextConcert(concerts)
  const seoSlide = [...heroSlides]
    .filter((slide) => slide.is_visible && slide.image_url.trim())
    .sort((first, second) => first.display_order - second.display_order)[0]
  const homeStructuredData = useMemo(() => {
    const sameAs = [siteSettings.youtube_url, siteSettings.instagram_url].filter(
      (url) => url.trim(),
    )

    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteSettings.site_title || '서울모테트청소년합창단',
      alternateName: 'Seoul Motet Youth Choir',
      url: window.location.origin,
      publisher: {
        '@type': 'MusicGroup',
        name: '서울모테트청소년합창단',
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
    }
  }, [
    siteSettings.instagram_url,
    siteSettings.site_title,
    siteSettings.youtube_url,
  ])

  return (
    <>
      <SeoHead
        description={HOME_HERO_REFERENCE_COPY.description}
        image={seoSlide?.image_url}
        jsonLd={homeStructuredData}
        path="/"
        title={siteSettings.site_title || '서울모테트청소년합창단'}
      />
      <HomeFlowProvider>
        <div className="home-intro-real-sample">
          <HomeHeroSlideshow slides={heroSlides} />
          <HomeHeroIntroOverlay />
        </div>
        <HomePopupManager popups={popupNotices} />

        {homeData.error ? (
          <Container className="relative z-30 py-6">
            <ErrorState
              action={
                <Button onClick={homeData.refetch} variant="secondary">
                  최신 소식 다시 불러오기
                </Button>
              }
              description="공연·공지 등 최신 운영 정보를 불러오지 못했습니다. 예시 일정으로 대체하지 않았습니다."
              title="일부 최신 소식을 표시할 수 없습니다"
            />
          </Container>
        ) : null}

        <div className="home-flow-body flow-root relative z-30 isolate overflow-visible">
          <StaffFlowRail
            className="hidden lg:block lg:-top-72 lg:bottom-24 lg:left-[max(1.25rem,calc(50%_-_760px))] lg:z-20 lg:opacity-75 xl:left-[max(2rem,calc(50%_-_840px))]"
            tone="light"
          />
          <div className="relative z-10">
            <HomeFlowSampleChunk
              enabled={mode === 'section-flow-sample'}
              tone="warm"
            >
              <FloatingInfoCards cards={homeContent.quickActions.items} />
              <AboutPreview
                presentation={aboutPresentation}
                buttonLabel={homeContent.about.ctaLabel}
                collectivePortraitImage={
                  seoSlide
                    ? {
                        alt:
                          seoSlide.image_alt ||
                          '서울모테트청소년합창단 공연 무대',
                        caption: 'HERO 01 · 서울모테트 공연 기록',
                        src: seoSlide.image_url,
                      }
                    : undefined
                }
                identityDescription={homeContent.about.globalDescription}
                identityTagline={homeContent.about.globalTagline}
                image={aboutVisualImage}
                kicker={homeContent.about.eyebrowEn}
                nextStage={
                  nextConcert
                    ? {
                        date: nextConcert.date,
                        location: nextConcert.location,
                        title: nextConcert.title,
                      }
                    : undefined
                }
                programEyebrow={homeContent.choirProgram.eyebrowEn}
                programItems={homeContent.choirProgram.items}
                programTitle={homeContent.choirProgram.title}
                settings={siteSettings}
                summary={homeContent.about.paragraphs.join('\n\n')}
                title={homeContent.about.title}
              />
              <HomeFlowSampleHold
                enabled={mode === 'section-flow-sample'}
                variant={
                  joinPresentation === 'open-score' ? 'editorial' : 'compact'
                }
              >
                {joinPresentation === 'open-score' ? (
                  <JoinOpenScoreCTA
                    buttonLabel={homeContent.joinLetter.ctaLabel}
                    joinInfo={joinInfo}
                    presentation={joinOpenScorePresentation}
                  />
                ) : (
                  <JoinCTA
                    buttonLabel={homeContent.joinLetter.ctaLabel}
                    joinInfo={joinInfo}
                    kicker={homeContent.joinLetter.eyebrowEn}
                    text={homeContent.joinLetter.description}
                    title={homeContent.joinLetter.title}
                  />
                )}
              </HomeFlowSampleHold>
            </HomeFlowSampleChunk>

            <HomeFlowSampleChunk
              enabled={mode === 'section-flow-sample'}
              tone="stage"
            >
              <PerformanceNewsPreview
                concertButtonLabel={
                  homeContent.concertProgram.concertsCtaLabel
                }
                concerts={concerts}
                description={homeContent.concertProgram.description}
                detailButtonLabel={
                  homeContent.concertProgram.detailCtaLabel
                }
                emptyConcertButtonLabel={
                  homeContent.concertProgram.emptyConcertCtaLabel
                }
                emptyConcertText={
                  homeContent.concertProgram.emptyConcertDescription
                }
                emptyConcertTitle={
                  homeContent.concertProgram.emptyConcertTitle
                }
                emptyNoticeButtonLabel={
                  homeContent.concertProgram.emptyNoticeCtaLabel
                }
                emptyNoticeText={
                  homeContent.concertProgram.emptyNoticeDescription
                }
                emptyNoticeTitle={
                  homeContent.concertProgram.emptyNoticeTitle
                }
                eyebrow={homeContent.concertProgram.eyebrowEn}
                ghost="PROGRAM"
                inquiryButtonLabel={
                  homeContent.concertProgram.inquiryCtaLabel
                }
                notices={notices}
                noticeButtonLabel={
                  homeContent.concertProgram.noticesCtaLabel
                }
                noticePanelButtonLabel={
                  homeContent.concertProgram.noticePanelCtaLabel
                }
                noticePanelTitle={
                  homeContent.concertProgram.noticePanelTitle
                }
                programNoteLabel="PROGRAM NOTE"
                title={homeContent.concertProgram.title}
              />
              <ScrollScoreBookReveal content={homeContent.scoreBook} />
              <HomeFlowSampleHold
                enabled={mode === 'section-flow-sample'}
                variant="full"
              >
                <HomeSpiritScoreBook
                  image={spiritVisualImage}
                  presentation={spiritPresentation}
                  sections={aboutSections}
                  wrapper={homeContent.spiritWrapper}
                />
              </HomeFlowSampleHold>
            </HomeFlowSampleChunk>

            <HomeFlowSampleChunk
              enabled={mode === 'section-flow-sample'}
              tone="finale"
            >
              <GalleryPreview
                buttonLabel={homeContent.archive.ctaLabel}
                collapseLabel={homeContent.archive.collapseLabel}
                description={homeContent.archive.description}
                eyebrow={homeContent.archive.eyebrowEn}
                emptyDescription={homeContent.archive.emptyDescription}
                emptyTitle={homeContent.archive.emptyTitle}
                expandLabel={homeContent.archive.expandLabel}
                images={galleryPreviewImages}
                posters={posters}
                title={homeContent.archive.title}
                videos={videos}
              />
              <SponsorQuietMarquee
                content={homeContent.sponsors}
                sponsors={sponsors}
              />
              <SupportLetterFold
                content={homeContent.supportLetter}
                settings={siteSettings}
              />
            </HomeFlowSampleChunk>
          </div>
        </div>
      </HomeFlowProvider>
    </>
  )
}
