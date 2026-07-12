import type { ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { Container } from './Container'
import { StaffLines } from './StaffLines'
import { StaffSectionLabel } from './StaffSectionLabel'

type PageHeroProps = {
  children?: ReactNode
  className?: string
  description?: string
  eyebrow?: string
  title: string
}

export function PageHero({
  children,
  className,
  description,
  eyebrow,
  title,
}: PageHeroProps) {
  return (
    <section
      className={classNames(
        'relative isolate overflow-hidden border-b border-bg-warm-white/10 bg-navy-midnight py-16 text-bg-warm-white sm:py-20 lg:py-24',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight" />
      <div
        aria-hidden="true"
        className="absolute right-8 top-8 -z-10 hidden h-64 w-64 rounded-full border border-bg-warm-white/10 bg-bg-warm-white/[0.025] xl:block"
      />
      <StaffLines
        className="page-hero-staff-lines absolute left-1/2 top-20 -z-10 hidden max-w-[min(38rem,40vw)] -translate-x-1/2 opacity-55 lg:grid"
        direction="diagonal"
        variant="inverted"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 -z-10 h-40 w-full bg-linear-to-t from-gold-warm/8 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-px bg-linear-to-r from-transparent via-gold-warm/60 to-transparent" />
      <Container>
        {eyebrow ? (
          <StaffSectionLabel className="mb-5 max-w-sm" variant="inverted">
            {eyebrow}
          </StaffSectionLabel>
        ) : null}
        <h1 className="type-page-title max-w-3xl">
          {title}
        </h1>
        {description ? (
          <p className="type-body mt-5 max-w-2xl text-bg-ivory/82">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </Container>
    </section>
  )
}
