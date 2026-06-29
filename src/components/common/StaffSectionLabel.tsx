import type { ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { StaffLines, type StaffLineVariant } from './StaffLines'

type StaffSectionLabelProps = {
  children: ReactNode
  className?: string
  variant?: StaffLineVariant
}

export function StaffSectionLabel({
  children,
  className,
  variant = 'gold',
}: StaffSectionLabelProps) {
  return (
    <div className={classNames('flex max-w-full items-center gap-3', className)}>
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full bg-gold-warm shadow-[0_0_0_6px_rgb(201_164_92/0.1)]"
      />
      <p className="type-eyebrow shrink-0 text-gold-warm">
        {children}
      </p>
      <StaffLines className="min-w-12 max-w-36 flex-1" density="light" variant={variant} />
    </div>
  )
}
