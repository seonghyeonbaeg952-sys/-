import type { ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { Container } from './Container'

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
        'relative isolate overflow-hidden border-b border-bg-warm-white/10 bg-navy-midnight py-20 text-bg-warm-white sm:py-24 lg:py-28',
        className,
      )}
    >
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-navy-midnight via-navy-deep to-navy-midnight" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-px bg-linear-to-r from-transparent via-gold-warm/60 to-transparent" />
      <Container>
        {eyebrow ? (
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-gold-warm" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-soft sm:text-sm">
              {eyebrow}
            </p>
          </div>
        ) : null}
        <h1 className="max-w-3xl break-keep text-4xl font-bold leading-tight md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl break-keep text-base leading-8 text-bg-ivory/82 sm:text-lg">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-8">{children}</div> : null}
      </Container>
    </section>
  )
}
