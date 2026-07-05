import { SpiritDiagonalHero } from '../../components/spirit/SpiritDiagonalHero'
import {
  defaultSpiritHero,
  getAboutSectionCopy,
} from '../../constants/spiritContent'
import { useSpiritPageData } from '../../hooks/usePublicData'

export function SpiritHeroSamplePage() {
  const spiritData = useSpiritPageData()
  const { aboutSections, heroSlides } = spiritData.data
  const hero = getAboutSectionCopy(aboutSections, 'spirit_hero', {
    ...defaultSpiritHero,
    ctaLabel: '합창단 정신 보기',
    ctaUrl: '/spirit',
    title: '마음을 담은 음악으로\n다음 세대를 세웁니다',
  })
  const heroImage = heroSlides.find((slide) => slide.image_url.trim())?.image_url ?? null

  return (
    <main className="spirit-hero-sample-page bg-navy-midnight">
      <SpiritDiagonalHero backgroundImageUrl={heroImage} copy={hero} />
    </main>
  )
}
