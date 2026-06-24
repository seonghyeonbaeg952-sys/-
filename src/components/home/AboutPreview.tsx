import { BrandLogo } from '../common/BrandLogo'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Container } from '../common/Container'
import { Reveal } from '../common/Reveal'

type AboutPreviewProps = {
  summary?: string
}

const aboutCards = [
  {
    description: '서울모테트합창단의 음악적 유산을 다음 세대와 나눕니다.',
    title: '창단 배경',
  },
  {
    description: '창의적인 음악교육과 인성의 균형을 함께 추구합니다.',
    title: '교육 목적',
  },
  {
    description: '정기연주회와 초청연주를 통해 무대 경험을 쌓습니다.',
    title: '연주 활동',
  },
  {
    description: '함께 노래하며 음악의 가치와 나눔의 마음을 배웁니다.',
    title: '음악의 비전',
  },
] as const

const fallbackSummary =
  '서울모테트청소년합창단은 청소년들이 합창을 통해 음악의 가치와 함께하는 마음을 배우도록 돕습니다.'

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

export function AboutPreview({ summary }: AboutPreviewProps) {
  return (
    <section className="bg-bg-ivory py-section-mobile lg:py-section-desktop">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gold-warm">
                ABOUT
              </p>
              <h2 className="mt-5 max-w-xl break-keep text-4xl font-bold leading-tight text-navy-deep md:text-5xl">
                청소년의 목소리로 전하는 깊은 울림
              </h2>
              <div className="mt-6 max-w-xl space-y-4">
                {getSummaryParagraphs(summary).map((paragraph) => (
                  <p
                    className="break-keep text-base leading-8 text-text-muted md:text-lg"
                    key={paragraph}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              <Card className="mt-7 p-5">
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
                합창단 소개 보기
              </Button>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {aboutCards.map((card, index) => (
              <Reveal delayMs={index * 70} key={card.title}>
                <Card className="relative min-h-48 overflow-hidden p-6 md:p-8" hoverable>
                  <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
                  <p className="text-sm font-semibold text-gold-warm">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-4 break-keep text-2xl font-semibold text-navy-deep">
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
