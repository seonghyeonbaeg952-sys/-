import type { ReactNode } from 'react'

type AdminPageTitleProps = {
  action?: ReactNode
  description?: string
  eyebrow?: string
  title: string
}

export function AdminPageTitle({
  action,
  description,
  eyebrow = 'CMS',
  title,
}: AdminPageTitleProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-gold-warm">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-navy-deep">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
