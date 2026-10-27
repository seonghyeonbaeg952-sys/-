import { useSiteEditor } from '../../components/site-editor/useSiteEditor'
import { SeoHead } from '../../components/common/SeoHead'
import { SpiritHeritageExperience } from '../../components/spirit/SpiritHeritageExperience'
import {
  defaultSpiritCta,
  defaultSpiritHero,
  getAboutSectionCopy,
} from '../../constants/spiritContent'
import { useSpiritPageData } from '../../hooks/usePublicData'

export function SpiritPage() {
  const { copy: copyText } = useSiteEditor()
  const spiritData = useSpiritPageData()
  const { aboutSections, heroSlides } = spiritData.data
  const hero = getAboutSectionCopy(aboutSections, 'spirit_hero', {
    ...defaultSpiritHero,
    ctaLabel: '합창단 정신 보기',
    ctaUrl: '/spirit',
    title: '마음을 담은 음악으로\n다음 세대를 세웁니다',
  })
  const cta = getAboutSectionCopy(aboutSections, 'spirit_cta', defaultSpiritCta)
  const heroImage = heroSlides.find((slide) => slide.image_url.trim())?.image_url ?? null

  return (
    <>
      <SeoHead
        description={copyText("spirit", "spirit.fixed.SpiritPage.969257a843", "서울모테트청소년합창단의 음악교육 철학과 공동체의 가치를 소개합니다.")}
        image={heroImage || undefined}
        path="/spirit"
        title={copyText("spirit", "spirit.fixed.SpiritPage.b23782b95d", "합창단 정신")}
      />
      <SpiritHeritageExperience
        cta={cta}
        hero={hero}
      />
    </>
  )
}
