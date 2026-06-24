import { legacyActivitySummary, legacyChoirIntro } from '../../constants/legacyContent'
import { Container } from '../common/Container'

const cards = [
  {
    description: '청소년아카데미 부설 합창단으로 시작한 음악 여정',
    title: `${legacyChoirIntro.foundedYear} 창단`,
  },
  {
    description: legacyActivitySummary.slice(0, 3).join(' · '),
    title: '정기연주회·초청연주',
  },
  {
    description: '입단 안내와 공연 섭외 문의를 한 곳에서 연결',
    title: '입단 및 공연 문의',
  },
]

export function FloatingInfoCards() {
  return (
    <section aria-label="합창단 주요 정보" className="relative z-10 -mt-16">
      <Container>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              className="rounded-card border border-line-default bg-bg-warm-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              key={card.title}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="size-3 rounded-full bg-gold-warm" />
                <span className="h-px flex-1 bg-line-default" />
              </div>
              <h2 className="text-xl font-semibold leading-7 text-navy-deep">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
