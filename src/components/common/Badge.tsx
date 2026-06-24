import type { HTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

export type BadgeVariant = 'navy' | 'gold' | 'soft'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  navy: 'bg-navy-deep text-bg-warm-white',
  gold: 'bg-gold-soft text-navy-midnight',
  soft: 'bg-blue-soft text-navy-deep',
}

export function Badge({
  children,
  className,
  variant = 'gold',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={classNames(
        'inline-flex min-h-7 items-center rounded-pill px-3 text-xs font-semibold',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
