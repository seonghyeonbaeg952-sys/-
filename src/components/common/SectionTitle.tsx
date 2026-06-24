import type { ReactNode } from 'react'

type SectionTitleProps = {
  action?: ReactNode
  description?: string
  eyebrow?: string
  title: string
}

export function SectionTitle({
  action,
  description,
  eyebrow,
  title,
}: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold-warm">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl font-semibold leading-tight text-navy-deep md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
