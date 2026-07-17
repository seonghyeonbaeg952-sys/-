import { useMemo, type ReactNode } from 'react'

import { SeoHead } from '../../components/common/SeoHead'
import { StaffFlowRail } from '../../components/common/StaffFlowRail'
import { Button } from '../../components/common/Button'
import { Container } from '../../components/common/Container'
import { ErrorState } from '../../components/common/ErrorState'
import { AboutPreview } from '../../components/home/AboutPreview'
import { FloatingInfoCards } from '../../components/home/FloatingInfoCards'
import { GalleryPreview } from '../../components/home/GalleryPreview'
import { HomeFlowProvider } from '../../components/home/HomeFlowProvider'
import { HomeHeroIntroOverlay } from '../../components/home/HomeHeroIntroOverlay'
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
import type { Concert, GalleryImage } from '../../types/content'

const homeHeroEnglishTitleLines = ['SEOUL', 'MOTET', 'YOUTH', 'CHOIR']
const homeHeroBody =
  '서울모테트청소년합창단은 청소년이 합창을 배우고 정기 연습과 공연을 경험하는 음악교육 공동체입니다.'

type HomePageMode = 'default' | 'section-flow-sample'

type HomePageProps = {
  mode?: HomePageMode
}

type HomeFlowSampleChunkProps = {
  children: ReactNode
  enabled: boolean
  tone: 'warm' | 'stage' | 'finale'
}

type HomeFlowSampleHoldProps = {
  children: ReactNode
  enabled: boolean
  variant?: 'compact' | 'full'
}

const sampleEdgePaths = {
  warm: 'M0 56C228 18 466 16 704 46C962 78 1190 67 1440 30V96H0Z',
  stage:
    'M0 52C178 33 330 62 520 45C735 25 914 17 1112 42C1232 57 1334 61 1440 47V96H0Z',
  finale:
    'M0 60C182 73 346 48 526 51C738 55 916 72 1103 55C1231 43 1335 39 1440 49V96H0Z',
} as const

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
            d={sampleEdgePaths[tone]}
            transform="translate(0 6)"
          />
          <path
            className="home-flow-sample-chunk__edge-face"
            d={sampleEdgePaths[tone]}
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

export function HomePage({ mode = 'default' }: HomePageProps) {
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
  const spiritVisualImage =
    visibleGalleryImages.length > 1 ? visibleGalleryImages[1] : undefined
  const galleryPreviewImages = aboutVisualImage
    ? gallery.filter((image) => image.id !== aboutVisualImage.id)
    : gallery
  const nextConcert = getNextConcert(concerts)
  const heroTitleLines = resolveHomeHeroTitleLines([
    t('home.hero.title.line1', homeHeroEnglishTitleLines[0]),
    t('home.hero.title.line2', homeHeroEnglishTitleLines[1]),
    t('home.hero.title.line3', homeHeroEnglishTitleLines[2]),
    t('home.hero.title.line4', homeHeroEnglishTitleLines[3]),
  ])
  const heroEyebrow = resolveHomeHeroEyebrow(
    t('home.hero.eyebrow', siteSettings.home_hero_eyebrow),
  )
  const heroBody = resolveHomeHeroBody(t('home.hero.subtitle'))
  const seoImage = [...heroSlides]
    .filter((slide) => slide.is_visible && slide.image_url.trim())
    .sort((first, second) => first.display_order - second.display_order)[0]
    ?.image_url
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
  }, [siteSettings.instagram_url, siteSettings.site_title, siteSettings.youtube_url])

  return (
    <>
      <SeoHead
        description={heroBody || siteSettings.home_hero_description}
        image={seoImage}
        jsonLd={homeStructuredData}
        path="/"
        title={siteSettings.site_title || '서울모테트청소년합창단'}
      />
      <HomeFlowProvider>
        <div className="home-intro-real-sample">
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
            primaryCtaLabel={t(
              'home.hero.cta.primary',
              t('home.hero.primaryButton'),
            )}
            secondaryCtaLabel={t(
              'home.hero.cta.secondary',
              t('home.hero.secondaryButton'),
            )}
            slides={heroSlides}
          />
          <HomeHeroIntroOverlay />
        </div>
        <HomePopupManager popups={popupNotices} />
        {homeData.error ? (
          <Container className="relative z-30 py-6">
            <ErrorState
              action={(
                <Button onClick={homeData.refetch} variant="secondary">
                  최신 소식 다시 불러오기
                </Button>
              )}
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
          <HomeFlowSampleChunk enabled={mode === 'section-flow-sample'} tone="warm">
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
                href: '/contact?section=support#form',
                title: t('home.quick.support.title', t('home.quick.3.title')),
              },
            ]}
          />
          <AboutPreview
            buttonLabel={t('home.about.cta', siteSettings.home_about_button_label)}
            identityDescription={t(
              'home.global.description',
              '서울에서 시작한 청소년 합창교육과 무대의 기록을 세계 관객과 공유합니다.',
            )}
            identityTagline={t(
              'home.global.tagline',
              'Voice, learning and the stage',
            )}
            image={aboutVisualImage}
            kicker={t('home.about.kicker')}
            nextStage={
              nextConcert
                ? {
                    date: nextConcert.date,
                    location: nextConcert.location,
                    title: nextConcert.title,
                  }
                : undefined
            }
            settings={siteSettings}
            summary={t('home.about.body', aboutSummary)}
            title={t('home.about.title', siteSettings.home_about_title)}
          />
          <HomeFlowSampleHold enabled={mode === 'section-flow-sample'}>
            <JoinCTA
              buttonLabel={t('home.join.cta', t('home.join.button'))}
              kicker={t('home.join.kicker')}
              process={t('home.join.process')}
              schedule={t('home.join.schedule')}
              target={t('home.join.target')}
              text={t('home.join.body', t('home.join.description'))}
              title={t('home.join.title')}
            />
          </HomeFlowSampleHold>
          </HomeFlowSampleChunk>
          <HomeFlowSampleChunk enabled={mode === 'section-flow-sample'} tone="stage">
          <PerformanceNewsPreview
            concertButtonLabel={t(
              'home.concert.cta.schedule',
              t('home.concert.concertButton'),
            )}
            concerts={concerts}
            description={t('home.concert.description')}
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
          <HomeFlowSampleHold
            enabled={mode === 'section-flow-sample'}
            variant="full"
          >
            <HomeSpiritScoreBook
              image={spiritVisualImage}
              sections={aboutSections}
            />
          </HomeFlowSampleHold>
          </HomeFlowSampleChunk>
          <HomeFlowSampleChunk enabled={mode === 'section-flow-sample'} tone="finale">
          <GalleryPreview
            buttonLabel={t('home.gallery.cta', siteSettings.home_gallery_button_label)}
            description={t(
              'home.gallery.description',
              t('home.gallery.sectionDescription', siteSettings.home_gallery_description),
            )}
            eyebrow={t('home.gallery.kicker', t('home.gallery.eyebrow'))}
            emptyDescription={t('home.gallery.empty.description')}
            emptyTitle={t('home.gallery.empty.title')}
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
          </HomeFlowSampleChunk>
          </div>
        </div>
      </HomeFlowProvider>
    </>
  )
}
