import {
  EducationJourney,
  ImpactStatsBand,
  LegacyFlow,
  MotetMeaningSection,
  SongOfMemorySection,
  SpiritCTA,
  SpiritHero,
  SpiritManifesto,
  SpiritValueCardsSection,
  VoiceConstellation,
} from '../../components/spirit/SpiritSections'
import {
  defaultSpiritCta,
  defaultSpiritHero,
  defaultMotetMeaning,
  getAboutSectionCopy,
  getAboutSectionText,
  spiritManifestoCopy,
  spiritValues,
} from '../../constants/spiritContent'
import { useSpiritPageData } from '../../hooks/usePublicData'

const manifestoFallback = spiritManifestoCopy.paragraphs.join('\n\n')

export function SpiritPage() {
  const spiritData = useSpiritPageData()
  const { aboutSections, heroSlides } = spiritData.data
  const hero = getAboutSectionCopy(aboutSections, 'spirit_hero', {
    ...defaultSpiritHero,
    ctaLabel: '합창단 정신 보기',
    ctaUrl: '/spirit',
    title: '정직한 음악으로\n다음 세대를 세웁니다',
  })
  const motetMeaning = getAboutSectionCopy(
    aboutSections,
    'spirit_motet',
    defaultMotetMeaning,
  )
  const cta = getAboutSectionCopy(aboutSections, 'spirit_cta', defaultSpiritCta)
  const manifesto = getAboutSectionText(
    aboutSections,
    'spirit_manifesto',
    manifestoFallback,
  )
  const heroImage = heroSlides.find((slide) => slide.image_url.trim())?.image_url ?? null

  return (
    <main className="spirit-page bg-bg-warm-white">
      <SpiritHero backgroundImageUrl={heroImage} copy={hero} variant="page" />
      <SpiritManifesto text={manifesto} />
      <MotetMeaningSection copy={motetMeaning} />
      <SongOfMemorySection />
      <SpiritValueCardsSection values={spiritValues} />
      <VoiceConstellation />
      <LegacyFlow />
      <EducationJourney />
      <ImpactStatsBand />
      <SpiritCTA copy={cta} />
    </main>
  )
}
