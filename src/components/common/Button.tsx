import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react'

import { classNames } from '../../utils/classNames'
import { TransitionLink } from './TransitionLink'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonFocusTone = 'dark' | 'light'

type ButtonBaseProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
  focusTone?: ButtonFocusTone
  showArrow?: boolean
  size?: ButtonSize
  variant?: ButtonVariant
}

type NativeButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled'> & {
    href?: never
  }

type AnchorButtonProps = ButtonBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
    href: string
  }

export type ButtonProps = NativeButtonProps | AnchorButtonProps

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-navy-deep text-bg-warm-white shadow-sm hover:bg-navy-midnight hover:shadow-[0_12px_24px_rgb(16_35_63/0.16)] active:bg-navy-midnight',
  secondary:
    'border border-line-default bg-bg-warm-white text-navy-deep hover:border-gold-warm hover:bg-bg-ivory hover:text-navy-midnight active:border-gold-warm',
  ghost: 'text-navy-deep hover:bg-bg-ivory active:bg-line-default/50',
  gold: 'bg-gold-warm text-navy-midnight shadow-sm hover:bg-gold-soft hover:shadow-[0_12px_24px_rgb(201_164_92/0.22)] active:bg-gold-soft',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 text-sm',
  md: 'min-h-11 px-5 text-[15px]',
  lg: 'min-h-12 px-6 text-base',
}

const baseClasses =
  'motion-button type-button inline-flex items-center justify-center rounded-pill transition duration-200 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-55 motion-reduce:active:scale-100'

const focusToneClasses: Record<ButtonFocusTone, string> = {
  dark: 'focus-visible:outline-gold-soft',
  light: 'focus-visible:outline-gold-ink',
}

const motionVariantClasses: Record<ButtonVariant, string> = {
  gold: 'btn-primary',
  ghost: 'btn-outline',
  primary: 'btn-navy',
  secondary: 'btn-outline',
}

function isAnchorButtonProps(props: ButtonProps): props is AnchorButtonProps {
  return typeof props.href === 'string'
}

function splitAnchorButtonProps(props: AnchorButtonProps) {
  const { children, className, disabled, focusTone, showArrow, size, variant, ...domProps } = props

  return { children, className, disabled, domProps, focusTone, showArrow, size, variant }
}

function splitNativeButtonProps(props: NativeButtonProps) {
  const { children, className, disabled, focusTone, showArrow, size, variant, ...domProps } = props

  return { children, className, disabled, domProps, focusTone, showArrow, size, variant }
}

function isInternalHref(href: string) {
  return href.startsWith('/') || href.startsWith('#')
}

export function Button(props: ButtonProps) {
  const disabled = props.disabled ?? false
  const focusTone = props.focusTone ?? 'light'
  const size = props.size ?? 'md'
  const variant = props.variant ?? 'primary'

  const classes = classNames(
    baseClasses,
    focusToneClasses[focusTone],
    motionVariantClasses[variant],
    sizeClasses[size],
    variantClasses[variant],
    disabled && 'pointer-events-none opacity-55',
    props.className,
  )

  if (isAnchorButtonProps(props)) {
    const { children, domProps, showArrow = true } = splitAnchorButtonProps(props)
    const { href, onClick, tabIndex, target, ...anchorProps } = domProps
    const renderedChildren = (
      <>
        {children}
        {showArrow ? (
          <span aria-hidden="true" className="btn-arrow">
            →
          </span>
        ) : null}
      </>
    )

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }

      onClick?.(event)
    }

    if (isInternalHref(href) && !target) {
      return (
        <TransitionLink
          {...anchorProps}
          aria-disabled={disabled || undefined}
          className={classes}
          onClick={handleClick}
          tabIndex={disabled ? -1 : tabIndex}
          to={href}
        >
          {renderedChildren}
        </TransitionLink>
      )
    }

    return (
      <a
        {...anchorProps}
        aria-disabled={disabled || undefined}
        className={classes}
        href={href}
        onClick={handleClick}
        tabIndex={disabled ? -1 : tabIndex}
        target={target}
      >
        {renderedChildren}
      </a>
    )
  }

  const { children, domProps: buttonProps, showArrow = false } = splitNativeButtonProps(props)

  return (
    <button
      {...buttonProps}
      className={classes}
      disabled={disabled}
      type={buttonProps.type ?? 'button'}
    >
      {children}
      {showArrow ? (
        <span aria-hidden="true" className="btn-arrow">
          →
        </span>
      ) : null}
    </button>
  )
}
