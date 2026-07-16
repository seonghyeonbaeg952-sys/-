import { HOME_SPONSOR_COPY } from '../../constants/sponsors'
import type { Sponsor } from '../../types/content'
import { classNames } from '../../utils/classNames'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { Reveal } from '../common/Reveal'
import { StaffLines } from '../common/StaffLines'
import { SponsorLogoCard } from '../sponsors/SponsorLogoCard'

type SponsorQuietMarqueeProps = {
  sponsors: Sponsor[]
}

export function SponsorQuietMarquee({ sponsors }: SponsorQuietMarqueeProps) {
  const visibleSponsors = sponsors
    .filter((sponsor) => sponsor.is_visible && sponsor.show_on_home)
    .sort((first, second) => first.display_order - second.display_order)
    .slice(0, 10)
  const shouldScroll = visibleSponsors.length >= 5

  if (visibleSponsors.length === 0) {
    return null
  }

  return (
    <section
      className="flow-section home-section sponsor-quiet-section bg-bg-ivory"
      data-flow-section="sponsors"
    >
      <Container>
        <Reveal>
          <div className="sponsor-quiet-panel">
            <div>
              <p className="type-eyebrow text-gold-ink">
                {HOME_SPONSOR_COPY.eyebrow}
              </p>
              <StaffLines className="mt-3 max-w-64 opacity-45" density="light" variant="gold" />
              <h2 className="type-section-title mt-4 text-navy-deep">
                {HOME_SPONSOR_COPY.title}
              </h2>
              <p className="type-body mt-4 text-text-muted">
                {HOME_SPONSOR_COPY.body}
              </p>
              <Button
                className="mt-5"
                href={HOME_SPONSOR_COPY.ctaHref}
                size="sm"
                variant="secondary"
              >
                {HOME_SPONSOR_COPY.ctaLabel}
              </Button>
            </div>

            <div
              className={classNames(
                'sponsor-quiet-marquee',
                shouldScroll ? 'is-moving' : 'is-static',
              )}
            >
              <div className="sponsor-quiet-track">
                {visibleSponsors.map((sponsor) => (
                  <SponsorLogoCard compact key={sponsor.id} sponsor={sponsor} />
                ))}
                {shouldScroll ? (
                  <div aria-hidden="true" className="contents">
                    {visibleSponsors.map((sponsor) => (
                      <SponsorLogoCard
                        compact
                        key={`${sponsor.id}-repeat`}
                        sponsor={sponsor}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
