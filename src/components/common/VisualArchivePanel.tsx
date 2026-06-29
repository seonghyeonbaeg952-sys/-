import type { ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { StaffLines } from './StaffLines'
import { StaffSectionLabel } from './StaffSectionLabel'

type VisualArchivePanelProps = {
  children?: ReactNode
  className?: string
  description?: string
  eyebrow?: string
  imageAlt?: string
  imageUrl?: string
  title?: string
}

export function VisualArchivePanel({
  children,
  className,
  description,
  eyebrow = 'SMYC ARCHIVE',
  imageAlt,
  imageUrl,
  title = 'Seoul Motet Youth Choir',
}: VisualArchivePanelProps) {
  const hasImage = Boolean(imageUrl?.trim())

  return (
    <div
      className={classNames(
        'relative min-h-64 overflow-hidden rounded-balanced border border-bg-warm-white/12 bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight p-6 text-bg-warm-white shadow-card',
        className,
      )}
    >
      {hasImage ? (
        <>
          <img
            alt={imageAlt || title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            src={imageUrl}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-t from-navy-midnight/88 via-navy-deep/42 to-navy-midnight/12"
          />
        </>
      ) : null}
      <StaffLines
        className="absolute inset-x-6 top-8 !w-auto opacity-80"
        density="light"
        variant="inverted"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 h-3/4 w-2/5 border-l border-gold-warm/18 bg-bg-warm-white/[0.035] [clip-path:polygon(46%_0,100%_0,100%_100%,0_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-6 top-6 h-1 w-16 rounded-full bg-gold-warm"
      />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-end">
        <StaffSectionLabel className="max-w-xs" variant="inverted">
          {eyebrow}
        </StaffSectionLabel>
        <h3 className="type-card-title mt-3 max-w-sm text-bg-warm-white">
          {title}
        </h3>
        {description ? (
          <p className="mt-4 max-w-md break-keep text-sm leading-7 text-bg-ivory/72">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-5">{children}</div> : null}
      </div>
    </div>
  )
}
