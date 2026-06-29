import type { HTMLAttributes, PointerEvent, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  hoverable?: boolean
  radius?:
    | 'balanced'
    | 'card'
    | 'formal'
    | 'panel'
    | 'round'
    | 'sharp'
    | 'soft'
    | 'subtle'
}

const radiusClasses: Record<NonNullable<CardProps['radius']>, string> = {
  balanced: 'rounded-balanced',
  card: 'rounded-card',
  formal: 'rounded-formal',
  panel: 'rounded-panel',
  round: 'rounded-pill',
  sharp: 'rounded-sharp',
  soft: 'rounded-soft',
  subtle: 'rounded-subtle',
}

export function Card({
  children,
  className,
  hoverable = false,
  onPointerMove,
  radius = 'formal',
  ...props
}: CardProps) {
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)

    if (!hoverable) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()

    event.currentTarget.style.setProperty('--glow-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--glow-y', `${event.clientY - rect.top}px`)
  }

  return (
    <div
      {...props}
      onPointerMove={handlePointerMove}
      className={classNames(
        'relative border border-line-default/85 bg-bg-warm-white shadow-card',
        radiusClasses[radius],
        hoverable &&
          'interactive-card glow-card transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-gold-warm/40 hover:shadow-card-hover motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
