import type { ReactNode } from 'react'

import { Card } from './Card'

type EmptyStateProps = {
  action?: ReactNode
  description?: string
  title: string
}

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center sm:p-10">
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-gold-soft/70 bg-bg-ivory text-gold-warm">
        <span aria-hidden="true" className="h-px w-5 bg-current" />
      </div>
      <h2 className="break-keep text-xl font-semibold text-navy-deep">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-xl break-keep text-sm leading-7 text-text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  )
}
