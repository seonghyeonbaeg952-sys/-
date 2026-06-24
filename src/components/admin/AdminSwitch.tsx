type AdminSwitchProps = {
  checked: boolean
  description?: string
  disabled?: boolean
  label: string
  name: string
  onChange: (checked: boolean) => void
}

export function AdminSwitch({
  checked,
  description,
  disabled = false,
  label,
  name,
  onChange,
}: AdminSwitchProps) {
  return (
    <div className="rounded-button border border-line-default bg-bg-warm-white p-4">
      <label
        className={[
          'flex items-start justify-between gap-4',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <span>
          <span className="block text-sm font-semibold text-navy-deep">{label}</span>
          {description ? (
            <span className="mt-1 block text-xs leading-5 text-text-muted">
              {description}
            </span>
          ) : null}
        </span>
        <input
          checked={checked}
          className="sr-only"
          disabled={disabled}
          name={name}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span
          aria-hidden="true"
          className={[
            'relative mt-0.5 h-6 w-11 rounded-pill transition',
            checked ? 'bg-gold-warm' : 'bg-line-default',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 size-4 rounded-full bg-bg-warm-white shadow-sm transition',
              checked ? 'left-6' : 'left-1',
            ].join(' ')}
          />
        </span>
      </label>
    </div>
  )
}
