import { Link } from 'react-router'

import {
  HOME_SPONSOR_COPY,
  SPONSORS_PAGE_COPY,
  SPONSOR_TIERS,
  SUPPORT_SPONSOR_COPY,
} from '../../constants/sponsors'
import type { Sponsor, SponsorTier } from '../../types/content'
import { classNames } from '../../utils/classNames'
import { Button } from '../common/Button'
import { Container } from '../common/Container'
import { EmptyState } from '../common/EmptyState'
import { Reveal } from '../common/Reveal'
import { SectionTitle } from '../common/SectionTitle'
import { StaffLines } from '../common/StaffLines'
import { SponsorLogoCard } from './SponsorLogoCard'

type SponsorStripProps = {
  sponsors: Sponsor[]
}

type SponsorsSectionProps = {
  compact?: boolean
  showEmpty?: boolean
  sponsors: Sponsor[]
}

function groupSponsorsByTier(sponsors: Sponsor[]) {
  const groups = new Map<SponsorTier, Sponsor[]>()

  for (const tier of SPONSOR_TIERS) {
    groups.set(tier.value, [])
  }

  for (const sponsor of sponsors) {
    const tier = SPONSOR_TIERS.some((item) => item.value === sponsor.tier)
      ? sponsor.tier
      : 'supporter'

    groups.get(tier)?.push(sponsor)
  }

  return groups
}

export function SponsorStrip({ sponsors }: SponsorStripProps) {
  if (sponsors.length === 0) {
    return null
  }

  const stripSponsors = sponsors.slice(0, 8)
  const shouldScroll = stripSponsors.length >= 5

  return (
    <section className="home-section sponsor-strip bg-bg-ivory">
      <Container>
        <Reveal>
          <div className="sponsor-strip-inner relative overflow-hidden rounded-formal border border-line-default bg-bg-warm-white/88 p-6 shadow-card lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-10 lg:p-8">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
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
                'sponsor-strip-logos mt-6 lg:mt-0',
                shouldScroll ? 'is-carousel' : 'is-static',
              )}
            >
              <div className="sponsor-strip-track">
                {stripSponsors.map((sponsor) => (
                  <SponsorLogoCard compact key={sponsor.id} sponsor={sponsor} />
                ))}
                {shouldScroll ? (
                  <div aria-hidden="true" className="contents">
                    {stripSponsors.map((sponsor) => (
                      <SponsorLogoCard
                        compact
                        key={`${sponsor.id}-duplicate`}
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

function SponsorTierSection({
  label,
  sponsors,
}: {
  label: string
  sponsors: Sponsor[]
}) {
  if (sponsors.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="type-card-title text-navy-deep">
          {label}
        </h3>
        <span className="type-number rounded-pill border border-gold-warm/25 bg-gold-soft/30 px-3 py-1 text-xs text-gold-ink">
          {sponsors.length}
        </span>
      </div>
      <div
        className={classNames(
          'grid gap-4',
          sponsors.length === 1
            ? 'max-w-xl'
            : sponsors.length === 2
              ? 'md:grid-cols-2'
              : 'sm:grid-cols-2 xl:grid-cols-3',
        )}
      >
        {sponsors.map((sponsor) => (
          <SponsorLogoCard key={sponsor.id} sponsor={sponsor} withDescription />
        ))}
      </div>
    </section>
  )
}

export function SponsorsSection({
  compact = false,
  showEmpty = true,
  sponsors,
}: SponsorsSectionProps) {
  const visibleSponsors = sponsors.filter((sponsor) =>
    compact ? sponsor.show_on_support : true,
  )
  const groups = groupSponsorsByTier(visibleSponsors)

  if (visibleSponsors.length === 0) {
    if (!showEmpty) {
      return null
    }

    return (
      <section id="sponsors">
        <SectionTitle
          description={SPONSORS_PAGE_COPY.body}
          eyebrow={SPONSORS_PAGE_COPY.eyebrow}
          title={SPONSORS_PAGE_COPY.title}
        />
        <div className="mt-8">
          <EmptyState
            compact
            description={SPONSORS_PAGE_COPY.emptyBody}
            title={SPONSORS_PAGE_COPY.emptyTitle}
          />
        </div>
      </section>
    )
  }

  if (compact) {
    return (
      <section className="relative overflow-hidden rounded-formal border border-line-default bg-bg-warm-white p-6 shadow-card">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-gold-warm via-gold-soft to-transparent" />
        <p className="type-eyebrow text-gold-ink">
          {SUPPORT_SPONSOR_COPY.eyebrow}
        </p>
        <h2 className="type-card-title mt-3 text-navy-deep">
          {SUPPORT_SPONSOR_COPY.title}
        </h2>
        <p className="type-body mt-3 max-w-3xl text-text-muted">
          {SUPPORT_SPONSOR_COPY.body}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {visibleSponsors.slice(0, 8).map((sponsor) => (
            <SponsorLogoCard compact key={sponsor.id} sponsor={sponsor} />
          ))}
        </div>
        <Link
          className="type-button mt-5 inline-flex min-h-11 items-center rounded-pill border border-line-default px-4 text-navy-deep transition hover:border-gold-warm hover:bg-bg-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink"
          to="/contact?section=sponsors"
        >
          후원사 전체 보기
        </Link>
      </section>
    )
  }

  return (
    <section id="sponsors">
      <SectionTitle
        description={SPONSORS_PAGE_COPY.body}
        eyebrow={SPONSORS_PAGE_COPY.eyebrow}
        title={SPONSORS_PAGE_COPY.title}
      />
      <div className="mt-8 space-y-10">
        {SPONSOR_TIERS.map((tier) => (
          <SponsorTierSection
            key={tier.value}
            label={tier.label}
            sponsors={groups.get(tier.value) ?? []}
          />
        ))}
      </div>
    </section>
  )
}
