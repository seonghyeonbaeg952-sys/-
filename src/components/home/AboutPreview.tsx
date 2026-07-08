import type { GalleryImage } from '../../types/content'
import { BrandLogo } from '../common/BrandLogo'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffFrame } from '../common/StaffFrame'
import { StaffLines } from '../common/StaffLines'
import { StaffSectionLabel } from '../common/StaffSectionLabel'
import { VisualArchivePanel } from '../common/VisualArchivePanel'
import { ImageTile } from './ImageTile'

type AboutPreviewProps = {
  buttonLabel?: string
  image?: GalleryImage
  kicker?: string
  summary?: string
  title?: string
}

const aboutCards = [
  {
    description:
      '서울모테트합창단의 음악적 전통을 바탕으로 청소년 합창교육을 운영합니다.',
    title: '창단 목적',
  },
  {
    description:
      '발성, 악보 읽기, 파트 연습, 앙상블 기본기를 체계적으로 배웁니다.',
    title: '교육 목적',
  },
  {
    description:
      '정기연주회와 초청연주, 특별 무대를 준비하며 연습의 시간을 실제 무대 경험으로 연결합니다.',
    title: '연주 활동',
  },
  {
    description:
      '정기 연습과 공연 활동을 통해 협업 태도와 무대 경험을 쌓습니다.',
    title: '단원 성장',
  },
] as const

const fallbackSummary =
  '서울모테트청소년합창단은 청소년이 합창의 기본기와 무대 경험을 함께 배우는 음악교육 공동체입니다.'

function getSummaryParagraphs(summary?: string) {
  const paragraphs = summary
    ?.split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (paragraphs && paragraphs.length > 0) {
    return paragraphs
  }

  return [fallbackSummary]
}

export function AboutPreview({
  buttonLabel = '합창단 소개 보기',
  image,
  kicker = 'ABOUT',
  summary,
  title = '서울모테트청소년합창단 소개',
}: AboutPreviewProps) {
  return (
    <section
      className="flow-section home-section relative overflow-hidden bg-bg-ivory"
      data-flow-section="about"
    >
      <HomeSectionStaffCue
        className="home-section-staff-cue--about"
        label="소개"
        noteOffset={7}
        symbol="♫"
      />
      <div
        aria-hidden="true"
        className="side-score-rail absolute left-[max(1rem,calc(50%-680px))] top-20 hidden lg:block"
      />
      <Container>
        <div className="home-about-grid relative">
          <Reveal variant="fade-up">
            <div className="lg:sticky lg:top-28">
              <StaffSectionLabel className="max-w-sm">
                {kicker}
              </StaffSectionLabel>
              <h2 className="type-section-title mt-5 max-w-[600px] text-navy-deep">
                {title}
              </h2>
              <div className="mt-6 max-w-[600px] space-y-4">
                {getSummaryParagraphs(summary).map((paragraph) => (
                  <p
                    className="type-body text-text-muted"
                    key={paragraph}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <Card className="mt-7 border-gold-warm/25 bg-bg-warm-white/92 p-5" radius="soft">
                <BrandLogo
                  brand="smf"
                  className="max-w-[180px]"
                  size="sm"
                  theme="light"
                />
                <p className="mt-4 break-keep text-sm leading-7 text-text-muted">
                  서울모테트음악재단 청소년아카데미 부설 합창단
                </p>
              </Card>
              <Button className="mt-7" href="/about" variant="primary">
                {buttonLabel}
              </Button>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            <Reveal className="sm:col-span-2" variant="soft-scale">
              {image ? (
                <a
                  className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                  href="/gallery"
                >
                  <StaffFrame className="shadow-card" linePosition="top" radius="balanced" variant="inverted">
                    <ImageTile
                      alt={image.image_alt}
                      className="aspect-[16/11] rounded-formal bg-navy-deep sm:aspect-[3/2]"
                      imgClassName="transition duration-500 group-hover:scale-[1.01] motion-reduce:group-hover:scale-100"
                      objectFit="contain"
                      sizes="(min-width: 1024px) 56vw, calc(100vw - 40px)"
                      src={image.image_url}
                      transform={{
                        quality: 82,
                        resize: 'contain',
                        width: 1200,
                        widths: [640, 960, 1200],
                      }}
                    >
                      <div className="absolute inset-0 bg-linear-to-t from-navy-midnight/76 via-navy-midnight/10 to-transparent" />
                      <div className="absolute inset-0 flex items-end p-6">
                        <div>
                          <p className="type-eyebrow text-gold-soft">
                            CHOIR VISUAL
                          </p>
                          <h3 className="type-card-title mt-3 max-w-md text-bg-warm-white">
                            {image.title}
                          </h3>
                          {image.description ? (
                            <p className="mt-3 max-w-md break-keep text-sm leading-7 text-bg-ivory/82">
                              {image.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </ImageTile>
                  </StaffFrame>
                </a>
              ) : (
                <VisualArchivePanel
                  className="min-h-[260px]"
                  description="합창단의 공연과 연습 사진이 준비되면 첫 인상을 담는 대표 비주얼로 이어집니다."
                  eyebrow="CHOIR VISUAL"
                  title="공연과 연습의 장면을 담는 공간"
                />
              )}
            </Reveal>
            {aboutCards.map((card, index) => (
              <Reveal key={card.title} staggerIndex={index} variant="card-rise">
                <Card
                  className="relative min-h-44 overflow-hidden p-6"
                  hoverable
                  radius="balanced"
                >
                  <div className="absolute inset-x-0 top-0 h-10 bg-linear-to-r from-navy-deep via-gold-warm/35 to-transparent opacity-12" />
                  <Reveal
                    className="absolute inset-x-6 top-6"
                    delay={80}
                    variant="line-draw"
                  >
                    <StaffLines
                      className="opacity-70 transition group-hover:opacity-100"
                      density="light"
                      variant="gold"
                    />
                  </Reveal>
                  <p className="type-number text-sm text-gold-warm">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="type-card-title mt-4 text-navy-deep">
                    {card.title}
                  </h3>
                  <p className="mt-4 break-keep text-sm leading-7 text-text-muted">
                    {card.description}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
