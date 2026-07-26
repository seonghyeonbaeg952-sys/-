import { HomeHeroIntroOverlay } from '../../components/home/HomeHeroIntroOverlay'
import { HomeHeroSlideshow } from '../../components/home/HomeHeroSlideshow'
import { useHomeData } from '../../hooks/usePublicData'

export function HomeHeroIntroSamplePage() {
  const homeData = useHomeData()
  const { heroSlides } = homeData.data

  return (
    <main className="home-intro-real-sample">
      <HomeHeroSlideshow slides={heroSlides} />
      <HomeHeroIntroOverlay />
    </main>
  )
}
