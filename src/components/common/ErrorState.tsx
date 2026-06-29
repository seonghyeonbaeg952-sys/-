import type { ReactNode } from 'react'

import { Card } from './Card'

type ErrorStateProps = {
  action?: ReactNode
  description?: string
  title?: string
}

export function ErrorState({
  action,
  description = '잠시 후 다시 시도해 주세요.',
  title = '내용을 불러오지 못했습니다',
}: ErrorStateProps) {
  return (
    <Card
      className="border-state-error/20 bg-bg-warm-white p-8 text-center sm:p-10"
      radius="balanced"
    >
      <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-state-error/10 text-state-error">
        <span aria-hidden="true" className="text-xl font-semibold">
          !
        </span>
      </div>
      <h2 className="break-keep text-xl font-semibold text-navy-deep">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl break-keep text-sm leading-7 text-text-muted">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  )
}
