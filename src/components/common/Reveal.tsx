import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

import { useRevealOnScroll } from '../../hooks/useRevealOnScroll'
import { classNames } from '../../utils/classNames'

type RevealVariant =
  | 'card-rise'
  | 'clip-up'
  | 'fade-in'
  | 'fade-up'
  | 'line-draw'
  | 'none'
  | 'scale-in'
  | 'soft-scale'

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  delay?: number
  delayMs?: number
  once?: boolean
  rootMargin?: string
  staggerIndex?: number
  threshold?: number
  variant?: RevealVariant
}

const variantClasses: Record<RevealVariant, { hidden: string; visible: string }> = {
  'card-rise': {
    hidden: 'translate-y-6 scale-[0.985] opacity-0 sm:translate-y-6',
    visible: 'translate-y-0 scale-100 opacity-100',
  },
  'clip-up': {
    hidden: 'translate-y-5 opacity-0 [clip-path:inset(14%_0_0_0)]',
    visible: 'translate-y-0 opacity-100 [clip-path:inset(0_0_0_0)]',
  },
  'fade-in': {
    hidden: 'opacity-0',
    visible: 'opacity-100',
  },
  'fade-up': {
    hidden: 'translate-y-6 opacity-0 sm:translate-y-6',
    visible: 'translate-y-0 opacity-100',
  },
  'line-draw': {
    hidden: 'scale-x-[0.88] opacity-0',
    visible: 'scale-x-100 opacity-100',
  },
  'soft-scale': {
    hidden: 'scale-[0.985] opacity-0 sm:scale-[0.985]',
    visible: 'scale-100 opacity-100',
  },
  'none': {
    hidden: '',
    visible: '',
  },
  'scale-in': {
    hidden: 'scale-[0.97] opacity-0',
    visible: 'scale-100 opacity-100',
  },
}

function getStaggerDelay(index?: number) {
  if (typeof index !== 'number') {
    return 0
  }

  return Math.min((index % 6) * 80, 360)
}

export function Reveal({
  children,
  className,
  delay,
  delayMs,
  once = true,
  rootMargin = '0px 0px -8% 0px',
  staggerIndex,
  style,
  threshold = 0.15,
  variant = 'fade-up',
  ...props
}: RevealProps) {
  const { isVisible, ref } = useRevealOnScroll<HTMLDivElement>({
    once,
    rootMargin,
    threshold,
  })

  const transitionDelay = (delay ?? delayMs ?? 0) + getStaggerDelay(staggerIndex)
  const variantClass = variantClasses[variant]
  const revealStyle = {
    '--reveal-delay': isVisible && transitionDelay > 0 ? `${transitionDelay}ms` : '0ms',
    '--stagger-index': staggerIndex ?? 0,
    ...style,
  } as CSSProperties

  return (
    <div
      {...props}
      data-reveal={variant}
      data-revealed={isVisible}
      className={classNames(
        variant !== 'none' &&
          'reveal-motion origin-left transition-[opacity,transform,clip-path] motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100',
        variant === 'line-draw' && 'reveal-motion-line',
        isVisible ? variantClass.visible : variantClass.hidden,
        className,
      )}
      ref={ref}
      style={revealStyle}
    >
      {children}
    </div>
  )
}
