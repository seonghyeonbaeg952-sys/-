import type { HTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      className={classNames('mx-auto w-full max-w-content px-5 sm:px-6 lg:px-8', className)}
    >
      {children}
    </div>
  )
}
