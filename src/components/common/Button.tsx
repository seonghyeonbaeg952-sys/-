import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from 'react'

import { classNames } from '../../utils/classNames'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonBaseProps = {
  children: ReactNode
  className?: string
  disabled?: boolean
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
    'bg-navy-deep text-bg-warm-white shadow-sm hover:bg-navy-midnight active:bg-navy-midnight',
  secondary:
    'border border-line-default bg-bg-warm-white text-navy-deep hover:border-gold-warm hover:bg-bg-ivory hover:text-navy-midnight active:border-gold-warm',
  ghost: 'text-navy-deep hover:bg-bg-ivory active:bg-line-default/50',
  gold: 'bg-gold-warm text-navy-midnight shadow-sm hover:bg-gold-soft active:bg-gold-soft',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-11 px-5 text-[15px]',
  lg: 'min-h-12 px-6 text-base',
}

const baseClasses =
  'inline-flex items-center justify-center rounded-pill font-semibold leading-none transition duration-200 active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm disabled:pointer-events-none disabled:opacity-55 motion-reduce:active:scale-100'

function isAnchorButtonProps(props: ButtonProps): props is AnchorButtonProps {
  return typeof props.href === 'string'
}

function splitAnchorButtonProps(props: AnchorButtonProps) {
  const { children, className, disabled, size, variant, ...domProps } = props

  return { children, className, disabled, domProps, size, variant }
}

function splitNativeButtonProps(props: NativeButtonProps) {
  const { children, className, disabled, size, variant, ...domProps } = props

  return { children, className, disabled, domProps, size, variant }
}

export function Button(props: ButtonProps) {
  const disabled = props.disabled ?? false
  const size = props.size ?? 'md'
  const variant = props.variant ?? 'primary'

  const classes = classNames(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled && 'pointer-events-none opacity-55',
    props.className,
  )

  if (isAnchorButtonProps(props)) {
    const { children, domProps } = splitAnchorButtonProps(props)
    const { onClick, tabIndex, ...anchorProps } = domProps

    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        event.preventDefault()
        return
      }

      onClick?.(event)
    }

    return (
      <a
        {...anchorProps}
        aria-disabled={disabled || undefined}
        className={classes}
        onClick={handleClick}
        tabIndex={disabled ? -1 : tabIndex}
      >
        {children}
      </a>
    )
  }

  const { children, domProps: buttonProps } = splitNativeButtonProps(props)

  return (
    <button
      {...buttonProps}
      className={classes}
      disabled={disabled}
      type={buttonProps.type ?? 'button'}
    >
      {children}
    </button>
  )
}
