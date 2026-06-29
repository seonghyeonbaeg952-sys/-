import type { HTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { StaffLines, type StaffLineVariant } from './StaffLines'

type StaffFrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  contentClassName?: string
  linePosition?: 'both' | 'bottom' | 'top'
  radius?:
    | 'balanced'
    | 'card'
    | 'formal'
    | 'panel'
    | 'round'
    | 'sharp'
    | 'soft'
    | 'subtle'
  variant?: StaffLineVariant
}

const radiusClasses: Record<NonNullable<StaffFrameProps['radius']>, string> = {
  balanced: 'rounded-balanced',
  card: 'rounded-card',
  formal: 'rounded-formal',
  panel: 'rounded-panel',
  round: 'rounded-pill',
  sharp: 'rounded-sharp',
  soft: 'rounded-soft',
  subtle: 'rounded-subtle',
}

export function StaffFrame({
  children,
  className,
  contentClassName,
  linePosition = 'both',
  radius = 'formal',
  variant = 'gold',
  ...props
}: StaffFrameProps) {
  const showTop = linePosition === 'top' || linePosition === 'both'
  const showBottom = linePosition === 'bottom' || linePosition === 'both'

  return (
    <div
      {...props}
      className={classNames('relative overflow-hidden', radiusClasses[radius], className)}
    >
      {showTop ? (
        <StaffLines
          className="absolute inset-x-5 top-5 z-20 !w-auto opacity-80 sm:inset-x-6"
          density="light"
          variant={variant}
        />
      ) : null}
      {showBottom ? (
        <StaffLines
          className="absolute inset-x-5 bottom-5 z-20 !w-auto opacity-55 sm:inset-x-6"
          density="light"
          variant={variant}
        />
      ) : null}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-5 top-5 z-20 size-2.5 rounded-full bg-gold-warm shadow-[0_0_0_7px_rgb(201_164_92/0.1)]"
      />
      <div className={classNames('relative z-10', contentClassName)}>{children}</div>
    </div>
  )
}
