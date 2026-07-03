import { legacyActivitySummary, legacyChoirIntro } from '../../constants/legacyContent'
import { Container } from '../common/Container'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'

type FloatingInfoCardContent = {
  description: string
  href?: string
  title: string
}

const fallbackCards = [
  {
    description: '청소년아카데미 부설 합창단으로 시작한 음악 여정',
    href: '/spirit',
    title: `${legacyChoirIntro.foundedYear} 창단`,
  },
  {
    description: legacyActivitySummary.slice(0, 3).join(' · '),
    href: '/concerts',
    title: '정기연주회·초청연주',
  },
  {
    description: '입단 안내와 공연 섭외 문의를 한 곳에서 연결',
    href: '/join',
    title: '입단 및 공연 문의',
  },
] satisfies FloatingInfoCardContent[]

export function FloatingInfoCards({
  cards = fallbackCards,
}: {
  cards?: FloatingInfoCardContent[]
}) {
  return (
    <section
      aria-label="합창단 주요 정보"
      className="flow-section home-quick-actions relative z-50"
      data-flow-section="quick"
    >
      <Container>
        <div className="home-quick-action-grid">
          {cards.map((card, index) => (
            <Reveal key={card.title} staggerIndex={index} variant="card-rise">
              <a
                className="home-quick-action-card group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-warm"
                href={card.href ?? '/'}
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-10 -top-12 size-28 rounded-full bg-gold-soft/18 transition group-hover:bg-gold-soft/28"
                />
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full border border-gold-warm/40 bg-bg-ivory text-xs font-bold text-gold-warm">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Reveal className="flex-1" delay={80} variant="line-draw">
                    <StaffLines
                      className="opacity-70 transition group-hover:opacity-100"
                      density="light"
                      variant="gold"
                    />
                  </Reveal>
                </div>
                <h2 className="text-xl font-semibold leading-7 text-navy-deep">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-text-muted">
                  {card.description}
                </p>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
