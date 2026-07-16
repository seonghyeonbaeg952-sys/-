import type { PointerEvent } from 'react'

import { getSponsorCategoryLabel, getSponsorTierLabel } from '../../constants/sponsors'
import type { Sponsor } from '../../types/content'
import { classNames } from '../../utils/classNames'
import { OptimizedImage } from '../common/OptimizedImage'

type SponsorLogoCardProps = {
  compact?: boolean
  sponsor: Sponsor
  withDescription?: boolean
}

function getSafeExternalUrl(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  try {
    const url = new URL(trimmedValue)

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : null
  } catch {
    return null
  }
}

function SponsorLogoContent({
  compact = false,
  sponsor,
  withDescription = false,
}: SponsorLogoCardProps) {
  const displayName = sponsor.display_name || sponsor.name

  return (
    <>
      <div
        className={classNames(
          'sponsor-logo-frame flex items-center justify-center rounded-button border border-line-default/80 bg-bg-warm-white px-4',
          compact ? 'min-h-16' : 'min-h-20',
        )}
      >
        {sponsor.logo_url ? (
          <OptimizedImage
            alt={`${displayName} 로고`}
            className="h-16 w-full bg-transparent"
            fallbackLabel={displayName}
            fallbackVariant="logo"
            imageClassName="mx-auto max-h-16 max-w-[180px] object-contain"
            objectFit="contain"
            sizes="180px"
            src={sponsor.logo_url}
          />
        ) : (
          <span className="type-card-title-sans break-keep text-center text-sm text-navy-deep">
            {displayName}
          </span>
        )}
      </div>
      <div className={classNames('min-w-0', compact ? 'sr-only' : '')}>
        <p className="type-eyebrow text-gold-ink">
          {getSponsorTierLabel(sponsor.tier)}
        </p>
        <h3 className="type-card-title-sans mt-2 text-navy-deep">
          {displayName}
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          {getSponsorCategoryLabel(sponsor.category)}
        </p>
        {withDescription && sponsor.description ? (
          <p className="mt-3 break-keep text-sm leading-6 text-text-muted">
            {sponsor.description}
          </p>
        ) : null}
      </div>
    </>
  )
}

export function SponsorLogoCard(props: SponsorLogoCardProps) {
  const { compact = false, sponsor } = props
  const href = getSafeExternalUrl(sponsor.website_url)
  const displayName = sponsor.display_name || sponsor.name
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()

    event.currentTarget.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
  }
  const className = classNames(
    'sponsor-logo-card interactive-card glow-card grid min-w-0 gap-3 rounded-balanced border border-gold-warm/20 bg-bg-warm-white/95 p-4 shadow-[0_18px_42px_rgb(16_35_63/0.06)] transition duration-200',
    compact ? 'min-h-32' : 'min-h-44',
    href && 'hover:-translate-y-0.5 hover:border-gold-warm/45 hover:shadow-card',
  )

  if (href) {
    return (
      <a
        aria-label={`${displayName} 웹사이트 새 창으로 열기`}
        className={classNames(
          className,
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-ink motion-reduce:hover:translate-y-0',
        )}
        href={href}
        onPointerMove={handlePointerMove}
        rel="noreferrer noopener"
        target="_blank"
      >
        <SponsorLogoContent {...props} />
      </a>
    )
  }

  return (
    <article className={className} onPointerMove={handlePointerMove}>
      <SponsorLogoContent {...props} />
    </article>
  )
}
