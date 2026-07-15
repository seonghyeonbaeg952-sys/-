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
        'relative isolate overflow-hidden border-b border-gold-warm/30 bg-navy-midnight py-16 text-bg-warm-white sm:py-20 lg:py-24',
        className,
      )}
    >
      <StaffLines
        className="page-hero-staff-lines absolute right-8 top-1/2 -z-10 hidden w-[min(24rem,32vw)] -translate-y-1/2 opacity-65 lg:right-12 xl:block 2xl:right-20"
        direction="diagonal"
        variant="inverted"
      />
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
