import type { SelectHTMLAttributes } from 'react'

import { classNames } from '../../utils/classNames'

export type AdminSelectOption = {
  label: string
  value: string
}

type AdminSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  description?: string
  error?: string | null
  label: string
  options: AdminSelectOption[]
}

export function AdminSelect({
  description,
  error,
  id,
  label,
  options,
  required,
  ...props
}: AdminSelectProps) {
  const selectId = id ?? props.name
  const descriptionId = description && selectId ? `${selectId}-description` : undefined
  const errorId = error && selectId ? `${selectId}-error` : undefined

  return (
    <div>
      <label className="text-sm font-semibold text-navy-deep" htmlFor={selectId}>
        {label}
        {required ? <span className="ml-1 text-state-error">*</span> : null}
      </label>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-text-muted" id={descriptionId}>
          {description}
        </p>
      ) : null}
      <select
        {...props}
        aria-describedby={classNames(descriptionId, errorId) || undefined}
        aria-invalid={Boolean(error) || undefined}
        className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60 disabled:cursor-not-allowed disabled:opacity-60"
        id={selectId}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-2 text-sm text-state-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
