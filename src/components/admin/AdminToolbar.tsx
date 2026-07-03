import type { ChangeEvent } from 'react'

type ToolbarOption = {
  label: string
  value: string
}

export type AdminToolbarFilter = {
  label: string
  onChange: (value: string) => void
  options: ToolbarOption[]
  value: string
}

type AdminToolbarProps = {
  filters?: AdminToolbarFilter[]
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  searchValue?: string
}

export function AdminToolbar({
  filters = [],
  onSearchChange,
  searchPlaceholder = '검색어를 입력하세요',
  searchValue = '',
}: AdminToolbarProps) {
  return (
    <div className="grid gap-3 rounded-formal border border-line-default bg-bg-warm-white p-4 shadow-card md:grid-cols-[1fr_auto]">
      {onSearchChange ? (
        <label className="block">
          <span className="sr-only">검색</span>
          <input
            className="min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onSearchChange(event.target.value)
            }
            placeholder={searchPlaceholder}
            type="search"
            value={searchValue}
          />
        </label>
      ) : (
        <div />
      )}

      {filters.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 md:flex">
          {filters.map((filter) => (
            <label className="block" key={filter.label}>
              <span className="sr-only">{filter.label}</span>
              <select
                className="min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-3 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60 md:min-w-36"
                onChange={(event) => filter.onChange(event.target.value)}
                value={filter.value}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  )
}
