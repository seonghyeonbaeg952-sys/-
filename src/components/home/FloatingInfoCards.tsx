import { legacyActivitySummary, legacyChoirIntro } from '../../constants/legacyContent'
import { getColorSampleHref } from '../../utils/colorSamplePath'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
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
    description: '입단 안내와 일반 문의를 공식 채널로 연결',
    href: '/join',
    title: '입단 및 문의',
  },
] satisfies FloatingInfoCardContent[]

const cardEyebrows = ['JOIN', 'STAGE', 'CONNECT'] as const

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
      <HomeSectionStaffCue
        className="home-section-staff-cue--quick"
        label="안내"
        noteOffset={18}
        symbol="♪"
      />
      <Container>
        <div className="home-quick-action-grid">
          {cards.map((card, index) => (
            <Reveal key={card.title} staggerIndex={index} variant="card-rise">
              <a
                className="home-quick-action-card group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-ink"
                data-card-index={index + 1}
                href={getColorSampleHref(card.href ?? '/')}
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-10 -top-12 size-28 rounded-full bg-gold-soft/18 transition group-hover:bg-gold-soft/28"
                />
                <div className="home-quick-action-lead mb-5 flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full border border-gold-warm/40 bg-bg-ivory text-xs font-bold text-gold-ink">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Reveal
                    className="home-quick-action-staff flex-1"
                    delay={80}
                    variant="line-draw"
                  >
                    <StaffLines
                      className="opacity-70 transition group-hover:opacity-100"
                      density="light"
                      variant="gold"
                    />
                  </Reveal>
                </div>
                <div className="home-quick-action-copy">
                  <p className="home-quick-action-eyebrow">
                    {cardEyebrows[index] ?? 'DISCOVER'}
                  </p>
                  <h2 className="text-xl font-semibold leading-7 text-navy-deep">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    {card.description}
                  </p>
                </div>
                <div className="home-quick-action-link" aria-hidden="true">
                  VIEW
                  <span>→</span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
