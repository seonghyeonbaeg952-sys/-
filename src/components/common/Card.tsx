import type { HTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  hoverable?: boolean
}

export function Card({
  children,
  className,
  hoverable = false,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={classNames(
        'rounded-card border border-line-default/90 bg-bg-warm-white shadow-card',
        hoverable &&
          'transition duration-200 hover:-translate-y-[3px] hover:border-gold-warm/35 hover:shadow-card-hover motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
