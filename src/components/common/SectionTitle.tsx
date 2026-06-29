import type { ReactNode } from 'react'

import { StaffSectionLabel } from './StaffSectionLabel'

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
          <StaffSectionLabel className="mb-3 max-w-md">
            {eyebrow}
          </StaffSectionLabel>
        ) : null}
        <h2 className="type-section-title text-navy-deep">
          {title}
        </h2>
        {description ? (
          <p className="type-body mt-4 max-w-2xl text-text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
