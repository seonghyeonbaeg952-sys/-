import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import '../../styles/filter-select.css'

type FilterSelectProps = {
  label: string
  value: string
  options: readonly { value: string; label: string }[]
  onChange: (value: string) => void
  className?: string
}

export function FilterSelect({ label, value, options, onChange, className = '' }: FilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [opensAbove, setOpensAbove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsId = useId()
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '선택'

  useEffect(() => {
    if (!open) return
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true })
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  function close() {
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
    if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[aria-pressed]') ?? [])
    const current = buttons.findIndex((button) => button === document.activeElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next]?.focus()
  }

  return (
    <div
      className={`filter-select ${className}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={handleKeyDown}
      ref={rootRef}
    >
      <button
        aria-controls={optionsId}
        aria-expanded={open}
        aria-label={`${label}: ${selectedLabel}`}
        className="filter-select__trigger"
        onClick={() => {
          const box = triggerRef.current?.getBoundingClientRect()
          if (box && !open) {
            const requiredHeight = Math.min(options.length * 44 + 18, window.innerHeight / 2)
            setOpensAbove(window.innerHeight - box.bottom < requiredHeight && box.top > window.innerHeight - box.bottom)
          }
          setOpen((current) => !current)
        }}
        ref={triggerRef}
        type="button"
      >
        {selectedLabel}
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div aria-label={`${label} 선택`} className="filter-select__options" data-above={opensAbove || undefined} id={optionsId} role="group">
          {options.map((option) => (
            <button aria-pressed={value === option.value} key={option.value} onClick={() => { onChange(option.value); close() }} type="button">
              {option.label}<span aria-hidden="true">{value === option.value ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
