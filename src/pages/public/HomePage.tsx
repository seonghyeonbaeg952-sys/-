import { StaffFlowRail } from '../../components/common/StaffFlowRail'
import { AboutPreview } from '../../components/home/AboutPreview'
import { FloatingInfoCards } from '../../components/home/FloatingInfoCards'
import { GalleryPreview } from '../../components/home/GalleryPreview'
import { HomeFlowProvider } from '../../components/home/HomeFlowProvider'
import { HomeHeroSlideshow } from '../../components/home/HomeHeroSlideshow'
import { HomePopupManager } from '../../components/home/HomePopupManager'
import { HomeSpiritScoreBook } from '../../components/home/HomeSpiritScoreBook'
import { JoinCTA } from '../../components/home/JoinCTA'
import { PerformanceNewsPreview } from '../../components/home/PerformanceNewsPreview'
import { ScrollScoreBookReveal } from '../../components/home/ScrollScoreBookReveal'
import { SponsorQuietMarquee } from '../../components/home/SponsorQuietMarquee'
import { SupportLetterFold } from '../../components/home/SupportLetterFold'
import { useHomeData } from '../../hooks/usePublicData'
import { useSiteText } from '../../hooks/useSiteText'
import type { AboutSectionRow } from '../../types/cms'
import type { GalleryImage } from '../../types/content'

function getAboutSummary(siteSummary: string, aboutSections: AboutSectionRow[]) {
  const sectionSummary = aboutSections
    .filter(
      (section) =>
        !section.section_key.startsWith('spirit_') &&
        !section.section_key.startsWith('home_') &&
        !section.section_key.startsWith('join_') &&
        !section.section_key.startsWith('footer_'),
    )
    .slice(0, 2)
    .map((section) => section.content.trim())
    .filter(Boolean)
    .join('\n\n')

  return sectionSummary || siteSummary.trim()
}

function getVisibleGalleryImages(images: GalleryImage[]) {
  return [...images]
    .filter((image) => image.is_visible && image.image_url.trim())
    .sort((first, second) => first.display_order - second.display_order)
}

export function HomePage() {
  const homeData = useHomeData()
  const {
    aboutSections,
    concerts,
    gallery,
    heroSlides,
    notices,
    posters,
    popupNotices,
    siteSettings,
    siteTexts,
    sponsors,
    videos,
  } = homeData.data
  const t = useSiteText(siteTexts)
  const aboutSummary = getAboutSummary(siteSettings.about_summary, aboutSections)
  const visibleGalleryImages = getVisibleGalleryImages(gallery)
  const aboutVisualImage =
    visibleGalleryImages.length > 1 ? visibleGalleryImages[0] : undefined
  const galleryPreviewImages = aboutVisualImage
    ? gallery.filter((image) => image.id !== aboutVisualImage.id)
    : gallery
  const heroTitleLine1 = t('home.hero.title.line1', '마음을 다한 음악으로')
  const heroTitleLine2 = t('home.hero.title.line2', '다음 세대를 세웁니다')

  return (
    <HomeFlowProvider>
      <HomeHeroSlideshow
        body={t('home.hero.subtitle', t('home.hero.description'))}
        eyebrow={t('home.hero.eyebrow', siteSettings.home_hero_eyebrow)}
        fallbackDescription={siteSettings.home_hero_description}
        fallbackSubtitle={siteSettings.hero_subtitle}
        fallbackTitle={siteSettings.hero_title}
        headline={
          <>
            {heroTitleLine1}
            <br />
            {heroTitleLine2}
          </>
        }
        mottoChips={[
          t('home.hero.chip1'),
          t('home.hero.chip2'),
          t('home.hero.chip3'),
        ]}
        primaryCtaLabel={t('home.hero.cta.primary', t('home.hero.primaryButton'))}
        secondaryCtaLabel={t('home.hero.cta.secondary', t('home.hero.secondaryButton'))}
        slides={heroSlides}
      />
      <HomePopupManager popups={popupNotices} />
      <div className="home-flow-body flow-root relative z-30 isolate overflow-visible">
        <StaffFlowRail
          className="hidden lg:block lg:-top-72 lg:bottom-24 lg:left-[max(1.25rem,calc(50%_-_760px))] lg:z-20 lg:opacity-75 xl:left-[max(2rem,calc(50%_-_840px))]"
          tone="light"
        />
        <div className="relative z-10">
          <FloatingInfoCards
            cards={[
              {
                description: t(
                  'home.quick.join.description',
                  t('home.quick.1.description'),
                ),
                href: '/join',
                title: t('home.quick.join.title', t('home.quick.1.title')),
              },
              {
                description: t(
                  'home.quick.concert.description',
                  t('home.quick.2.description'),
                ),
                href: '/concerts',
                title: t('home.quick.concert.title', t('home.quick.2.title')),
              },
              {
                description: t(
                  'home.quick.support.description',
                  t('home.quick.3.description'),
                ),
                href: '/contact?section=support',
                title: t('home.quick.support.title', t('home.quick.3.title')),
              },
            ]}
          />
          <AboutPreview
            buttonLabel={t('home.about.cta', siteSettings.home_about_button_label)}
            image={aboutVisualImage}
            kicker={t('home.about.kicker')}
            summary={t('home.about.body', aboutSummary)}
            title={t('home.about.title', siteSettings.home_about_title)}
          />
          <JoinCTA
            buttonLabel={t('home.join.cta', t('home.join.button'))}
            kicker={t('home.join.kicker')}
            process={t('home.join.process')}
            schedule={t('home.join.schedule')}
            target={t('home.join.target')}
            text={t('home.join.body', t('home.join.description'))}
            title={t('home.join.title')}
          />
          <PerformanceNewsPreview
            concertButtonLabel={t(
              'home.concert.cta.schedule',
              t('home.concert.concertButton'),
            )}
            concerts={concerts}
            detailButtonLabel={t('home.concert.cta.more', t('common.cta.more'))}
            eyebrow={t('home.concert.kicker', t('home.concert.eyebrow'))}
            ghost={t('home.concert.ghost')}
            inquiryButtonLabel={t(
              'home.concert.cta.inquiry',
              t('common.cta.inquiry'),
            )}
            notices={notices}
            noticeButtonLabel={t(
              'home.concert.cta.notice',
              t('home.concert.noticeButton'),
            )}
            programNoteLabel={t('home.concert.programNoteLabel')}
            title={t('home.concert.title', t('home.concert.sectionTitle'))}
          />
          <ScrollScoreBookReveal
            coverDescription={t(
              'home.score.cover.body',
              t('home.scorebook.coverDescription'),
            )}
            coverTitle={t('home.score.cover.title', t('home.scorebook.coverTitle'))}
            finalDescription={t(
              'home.score.final.body',
              t('home.scorebook.finalDescription'),
            )}
            finalTitle={t('home.score.final.title', t('home.scorebook.finalTitle'))}
            rightBody={t('home.score.right.body')}
            rightTitle={t('home.score.right.title', t('home.scorebook.rightTitle'))}
            valueWordsText={t('home.score.value.list')}
          />
          <HomeSpiritScoreBook sections={aboutSections} />
          <GalleryPreview
            buttonLabel={t('home.gallery.cta', siteSettings.home_gallery_button_label)}
            description={t(
              'home.gallery.description',
              t('home.gallery.sectionDescription', siteSettings.home_gallery_description),
            )}
            eyebrow={t('home.gallery.kicker', t('home.gallery.eyebrow'))}
            images={galleryPreviewImages}
            posters={posters}
            title={t(
              'home.gallery.title',
              t('home.gallery.sectionTitle', siteSettings.home_gallery_title),
            )}
            videos={videos}
          />
          <SponsorQuietMarquee sponsors={sponsors} />
          <SupportLetterFold
            buttonLabel={t('home.support.cta.primary', t('home.support.button'))}
            cardDescription={t(
              'home.support.card.description',
              t('home.support.cardDescription'),
            )}
            cardTitle={t('home.support.card.title', t('home.support.cardTitle'))}
            secondaryButtonLabel={t(
              'home.support.cta.secondary',
              t('home.support.secondaryButton'),
            )}
            settings={siteSettings}
            supportText={t('home.support.description')}
            title={t('home.support.title')}
          />
        </div>
      </div>
    </HomeFlowProvider>
  )
}
