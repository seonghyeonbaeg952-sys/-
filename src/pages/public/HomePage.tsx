import { Container } from '../../components/common/Container'
import { Reveal } from '../../components/common/Reveal'
import { SectionTitle } from '../../components/common/SectionTitle'
import { StaffFlowRail } from '../../components/common/StaffFlowRail'
import { SpiritStatementBlock, SpiritValueCards } from '../../components/common/Spirit'
import { AboutPreview } from '../../components/home/AboutPreview'
import { FloatingInfoCards } from '../../components/home/FloatingInfoCards'
import { GalleryPreview } from '../../components/home/GalleryPreview'
import { HomeHeroSlideshow } from '../../components/home/HomeHeroSlideshow'
import { HomePopupManager } from '../../components/home/HomePopupManager'
import { JoinCTA } from '../../components/home/JoinCTA'
import { PerformanceNewsPreview } from '../../components/home/PerformanceNewsPreview'
import { SupportCTA } from '../../components/home/SupportCTA'
import { SponsorStrip } from '../../components/sponsors/SponsorsSection'
import {
  getAboutSectionCopy,
  homeSpiritPreviewCopy,
  spiritValues,
} from '../../constants/spiritContent'
import { useHomeData } from '../../hooks/usePublicData'
import type { AboutSectionRow } from '../../types/cms'
import type { GalleryImage } from '../../types/content'

function getAboutSummary(
  siteSummary: string,
  aboutSections: AboutSectionRow[],
) {
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

function HomeSpiritPreview({ sections }: { sections: AboutSectionRow[] }) {
  const copy = getAboutSectionCopy(sections, 'home_spirit', {
    body: `${homeSpiritPreviewCopy.body}\n\n${homeSpiritPreviewCopy.expandedBody}`,
    ctaLabel: homeSpiritPreviewCopy.ctaLabel,
    ctaUrl: homeSpiritPreviewCopy.ctaHref,
    eyebrow: homeSpiritPreviewCopy.eyebrow,
    title: homeSpiritPreviewCopy.title,
  })

  return (
    <section className="home-section bg-bg-ivory">
      <Container>
        <Reveal>
          <SectionTitle
            description={homeSpiritPreviewCopy.body}
            eyebrow={homeSpiritPreviewCopy.eyebrow}
            title={homeSpiritPreviewCopy.title}
          />
        </Reveal>
        <div className="home-spirit-grid mt-8">
          <Reveal>
            <SpiritStatementBlock className="h-full" copy={copy} tone="navy" />
          </Reveal>
          <Reveal delay={80}>
            <SpiritValueCards
              className="home-spirit-values"
              compact
              values={spiritValues}
            />
          </Reveal>
        </div>
      </Container>
    </section>
  )
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
    popupNotices,
    siteSettings,
    sponsors,
  } =
    homeData.data
  const aboutSummary = getAboutSummary(siteSettings.about_summary, aboutSections)
  const visibleGalleryImages = getVisibleGalleryImages(gallery)
  const aboutVisualImage =
    visibleGalleryImages.length > 1 ? visibleGalleryImages[0] : undefined
  const galleryPreviewImages = aboutVisualImage
    ? gallery.filter((image) => image.id !== aboutVisualImage.id)
    : gallery

  return (
    <>
      <HomeHeroSlideshow
        eyebrow={siteSettings.home_hero_eyebrow}
        fallbackDescription={siteSettings.home_hero_description}
        fallbackSubtitle={siteSettings.hero_subtitle}
        fallbackTitle={siteSettings.hero_title}
        slides={heroSlides}
      />
      <HomePopupManager popups={popupNotices} />
      <div className="relative z-30 isolate overflow-visible">
        <StaffFlowRail
          className="hidden lg:block lg:-top-72 lg:bottom-24 lg:left-[max(1.25rem,calc(50%-760px))] lg:z-20 lg:opacity-75 xl:left-[max(2rem,calc(50%-840px))]"
          tone="light"
        />
        <div className="relative z-10">
          <FloatingInfoCards
            cards={[
              {
                description: '정직한 음악과 다음세대 교육',
                href: '/spirit',
                title: '합창단 정신',
              },
              {
                description: '정기연주회, 초청연주, 봉사연주',
                href: '/concerts',
                title: '공연·활동',
              },
              {
                description: '입단 안내와 공연·후원 문의',
                href: '/join',
                title: '입단·문의',
              },
            ]}
          />
          <AboutPreview
            buttonLabel={siteSettings.home_about_button_label}
            image={aboutVisualImage}
            summary={aboutSummary}
            title={siteSettings.home_about_title}
          />
          <HomeSpiritPreview sections={aboutSections} />
          <PerformanceNewsPreview concerts={concerts} notices={notices} />
          <GalleryPreview
            buttonLabel={siteSettings.home_gallery_button_label}
            description={siteSettings.home_gallery_description}
            images={galleryPreviewImages}
            title={siteSettings.home_gallery_title}
          />
          <JoinCTA
            buttonLabel="입단 안내 보기"
            text={'서울모테트청소년합창단은 합창을 통해 청소년이 자신의 소리를 발견하고,\n타인의 소리를 존중하며, 공동체 안에서 책임 있게 성장하도록 돕습니다.'}
            title={'노래를 잘하는 아이보다\n함께 듣고 성장할 준비가 된 아이를 기다립니다'}
          />
          <SponsorStrip sponsors={sponsors} />
          <SupportCTA
            buttonLabel="후원약정 보기"
            settings={siteSettings}
            supportText={'후원은 단순한 재정 지원이 아니라,\n다음 세대가 음악 안에서 자신을 발견하고\n함께 살아가는 법을 배우도록 돕는 동행입니다.'}
            title={'한 사람의 목소리가 자라기 위해서는\n보이지 않는 많은 손길이 필요합니다'}
          />
        </div>
      </div>
    </>
  )
}
