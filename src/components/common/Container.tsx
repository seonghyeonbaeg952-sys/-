import type { HTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      {...props}
      className={classNames('mx-auto w-full max-w-content px-4 sm:px-7 lg:px-12 2xl:px-0', className)}
    >
      {children}
    </div>
  )
}
