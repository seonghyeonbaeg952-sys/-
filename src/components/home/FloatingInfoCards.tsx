import type { HomeQuickActionItem } from '../../types/homeContent'
import { getColorSampleHref } from '../../utils/colorSamplePath'
import { Container } from '../common/Container'
import { HomeSectionStaffCue } from '../common/HomeSectionStaffCue'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'

export function FloatingInfoCards({
  cards,
}: {
  cards: HomeQuickActionItem[]
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
                  {card.code}
                  </p>
                  <h2 className="text-xl font-semibold leading-7 text-navy-deep">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-text-muted">
                    {card.description}
                  </p>
                </div>
                <div className="home-quick-action-link" aria-hidden="true">
                  {card.ctaLabel}
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
