import { HomeHeroIntroOverlay } from '../../components/home/HomeHeroIntroOverlay'
import { HomeHeroSlideshow } from '../../components/home/HomeHeroSlideshow'
import { useHomeData } from '../../hooks/usePublicData'
import { useSiteText } from '../../hooks/useSiteText'

const homeHeroEnglishTitleLines = ['SEOUL', 'MOTET', 'YOUTH', 'CHOIR']
const homeHeroBody =
  '모테트의 전통 위에서 서로를 듣고 호흡하며, 다음 세대의 맑은 울림을 함께 길러갑니다.'

function resolveHomeHeroTitleLines(titleLines: string[]) {
  const normalizedLines = titleLines.map((line) => line.trim())
  const normalizedTitle = normalizedLines.join(' ')

  if (
    normalizedTitle === '마음을 다한 음악으로 다음 세대를 세웁니다' ||
    normalizedTitle === '마음을 담은 음악으로 다음 세대를 세웁니다'
  ) {
    return homeHeroEnglishTitleLines
  }

  return normalizedLines
    .flatMap((line) => line.split(/\r?\n/))
    .map((line) => line.trim())
    .filter(Boolean)
}

function resolveHomeHeroEyebrow(eyebrow: string) {
  return eyebrow.trim().toUpperCase() === 'SEOUL MOTET YOUTH CHOIR'
    ? '서울모테트청소년합창단'
    : eyebrow
}

function resolveHomeHeroBody(body: string) {
  const normalizedBody = body.trim()

  if (
    normalizedBody.includes('서울모테트청소년합창단은') ||
    normalizedBody.includes('청소년의 목소리가 음악 안에서')
  ) {
    return homeHeroBody
  }

  return body
}

function renderSmycTitleLine(line: string) {
  const normalizedLine = line.trim().toUpperCase()
  const shouldHighlightInitial = ['SEOUL', 'MOTET', 'YOUTH', 'CHOIR'].includes(
    normalizedLine,
  )

  if (!shouldHighlightInitial) {
    return line
  }

  return (
    <>
      <span className="smyc-wordmark-initial">{line.slice(0, 1)}</span>
      {line.slice(1)}
    </>
  )
}

export function HomeHeroIntroSamplePage() {
  const homeData = useHomeData()
  const { heroSlides, siteSettings, siteTexts } = homeData.data
  const t = useSiteText(siteTexts)
  const heroTitleLines = resolveHomeHeroTitleLines([
    t('home.hero.title.line1', homeHeroEnglishTitleLines[0]),
    t('home.hero.title.line2', homeHeroEnglishTitleLines[1]),
    t('home.hero.title.line3', homeHeroEnglishTitleLines[2]),
    t('home.hero.title.line4', homeHeroEnglishTitleLines[3]),
  ])
  const heroEyebrow = resolveHomeHeroEyebrow(
    t('home.hero.eyebrow', siteSettings.home_hero_eyebrow),
  )
  const heroBody = resolveHomeHeroBody(t('home.hero.subtitle', t('home.hero.description')))

  return (
    <main className="home-intro-real-sample">
      <HomeHeroSlideshow
        body={heroBody}
        eyebrow={heroEyebrow}
        fallbackDescription={siteSettings.home_hero_description}
        fallbackSubtitle={siteSettings.hero_subtitle}
        fallbackTitle={siteSettings.hero_title}
        headline={
          <>
            {heroTitleLines.map((line) => (
              <span className="block" key={line}>
                {renderSmycTitleLine(line)}
              </span>
            ))}
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

      <HomeHeroIntroOverlay />
    </main>
  )
}
