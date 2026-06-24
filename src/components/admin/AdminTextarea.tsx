import type { TextareaHTMLAttributes } from 'react'

import { classNames } from '../../utils/classNames'

type AdminTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className'
> & {
  description?: string
  error?: string | null
  label: string
}

export function AdminTextarea({
  description,
  error,
  id,
  label,
  required,
  rows = 5,
  ...props
}: AdminTextareaProps) {
  const textareaId = id ?? props.name
  const descriptionId =
    description && textareaId ? `${textareaId}-description` : undefined
  const errorId = error && textareaId ? `${textareaId}-error` : undefined

  return (
    <div>
      <label className="text-sm font-semibold text-navy-deep" htmlFor={textareaId}>
        {label}
        {required ? <span className="ml-1 text-state-error">*</span> : null}
      </label>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <textarea
        {...props}
        aria-describedby={classNames(descriptionId, errorId) || undefined}
        aria-invalid={Boolean(error) || undefined}
        className="mt-2 w-full resize-y rounded-button border border-line-default bg-bg-warm-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60 disabled:cursor-not-allowed disabled:opacity-60"
        id={textareaId}
        required={required}
        rows={rows}
      />
      {error ? (
        <p className="mt-2 text-sm text-state-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
