import { useEffect, useRef, useState } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  delayMs?: number
}

export function Reveal({ children, className, delayMs = 0, style, ...props }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    if (isVisible) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.16 },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [isVisible])

  return (
    <div
      {...props}
      className={classNames(
        'transition-[opacity,transform] duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[18px] opacity-0',
        className,
      )}
      ref={ref}
      style={{
        transitionDelay: isVisible && delayMs > 0 ? `${delayMs}ms` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
