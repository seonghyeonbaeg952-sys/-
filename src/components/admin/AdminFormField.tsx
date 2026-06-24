import type { InputHTMLAttributes, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'

type AdminFormFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> & {
  description?: string
  error?: string | null
  label: string
  suffix?: ReactNode
}

export function AdminFormField({
  description,
  error,
  id,
  label,
  required,
  suffix,
  ...props
}: AdminFormFieldProps) {
  const inputId = id ?? props.name
  const descriptionId = description && inputId ? `${inputId}-description` : undefined
  const errorId = error && inputId ? `${inputId}-error` : undefined

  return (
    <div>
      <label className="text-sm font-semibold text-navy-deep" htmlFor={inputId}>
        {label}
        {required ? <span className="ml-1 text-state-error">*</span> : null}
      </label>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <div className="mt-2 flex gap-2">
        <input
          {...props}
          aria-describedby={classNames(descriptionId, errorId) || undefined}
          aria-invalid={Boolean(error) || undefined}
          className="min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60 disabled:cursor-not-allowed disabled:opacity-60"
          id={inputId}
          required={required}
        />
        {suffix}
      </div>
      {error ? (
        <p className="mt-2 text-sm text-state-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
