import { AboutPreview } from '../../components/home/AboutPreview'
import { FloatingInfoCards } from '../../components/home/FloatingInfoCards'
import { GalleryPreview } from '../../components/home/GalleryPreview'
import { HomeHeroSlideshow } from '../../components/home/HomeHeroSlideshow'
import { JoinCTA } from '../../components/home/JoinCTA'
import { NoticePreview } from '../../components/home/NoticePreview'
import { SupportCTA } from '../../components/home/SupportCTA'
import { UpcomingConcertsPreview } from '../../components/home/UpcomingConcertsPreview'
import { useHomeData } from '../../hooks/usePublicData'
import type { AboutSectionRow } from '../../types/cms'
import type { Concert, Notice } from '../../types/content'

function getAboutSummary(
  siteSummary: string,
  aboutSections: AboutSectionRow[],
) {
  const sectionSummary = aboutSections
    .slice(0, 2)
    .map((section) => section.content.trim())
    .filter(Boolean)
    .join('\n\n')

  return sectionSummary || siteSummary.trim()
}

function getNextConcert(concerts: Concert[]) {
  const now = new Date()

  return [...concerts]
    .filter((concert) => {
      if (!concert.is_visible || !concert.date) {
        return false
      }

      if (concert.status === 'closed' || concert.status === 'cancelled') {
        return false
      }

      return new Date(`${concert.date}T23:59:59`).getTime() >= now.getTime()
    })
    .sort((first, second) => first.date.localeCompare(second.date))[0] ?? null
}

function getFeatureNotice(notices: Notice[]) {
  return notices
    .filter((notice) => notice.is_visible && notice.is_important)
    .sort((first, second) => second.created_at.localeCompare(first.created_at))[0] ?? null
}

export function HomePage() {
  const homeData = useHomeData()
  const { aboutSections, concerts, gallery, heroSlides, notices, siteSettings } =
    homeData.data
  const aboutSummary = getAboutSummary(siteSettings.about_summary, aboutSections)
  const nextConcert = getNextConcert(concerts)
  const featureNotice = nextConcert ? null : getFeatureNotice(notices)

  return (
    <>
      <HomeHeroSlideshow
        featureNotice={featureNotice}
        nextConcert={nextConcert}
        slides={heroSlides}
      />
      <FloatingInfoCards />
      <AboutPreview summary={aboutSummary} />
      <UpcomingConcertsPreview concerts={concerts} />
      <NoticePreview notices={notices} />
      <GalleryPreview images={gallery} />
      <JoinCTA />
      <SupportCTA settings={siteSettings} />
    </>
  )
}
