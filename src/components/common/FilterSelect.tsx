import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { filterSelectPosition } from './filterSelectPosition'
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
  const [placement, setPlacement] = useState({ opensAbove: false, maxHeight: 340 })
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionsId = useId()
  const selectedLabel = options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '선택'

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current
    const root = rootRef.current
    if (!trigger || !root) return
    const box = trigger.getBoundingClientRect()
    const viewport = window.visualViewport
    const viewportTop = viewport?.offsetTop ?? 0
    const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight)
    let safeTop = viewportTop
    for (const header of document.querySelectorAll('header')) {
      const position = window.getComputedStyle(header).position
      if (position !== 'fixed' && position !== 'sticky') continue
      const headerBox = header.getBoundingClientRect()
      if (headerBox.top <= viewportTop && headerBox.bottom > safeTop) safeTop = headerBox.bottom
    }
    if (box.bottom <= safeTop || box.top >= viewportBottom) {
      setOpen(false)
      return
    }
    const scale = box.width / trigger.offsetWidth || 1
    const gap = (Number.parseFloat(window.getComputedStyle(root).getPropertyValue('--filter-select-menu-gap')) || 8) * scale
    setPlacement(filterSelectPosition({ triggerTop: box.top, triggerBottom: box.bottom, viewportTop: safeTop, viewportBottom, optionCount: options.length, scale, gap }))
  }, [options.length])

  useEffect(() => {
    if (!open) return
    rootRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true })
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    let frame = 0
    const queuePlacement = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => { frame = 0; updatePlacement() })
    }
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('resize', queuePlacement)
    window.addEventListener('scroll', queuePlacement, { passive: true })
    window.visualViewport?.addEventListener('resize', queuePlacement)
    window.visualViewport?.addEventListener('scroll', queuePlacement, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('resize', queuePlacement)
      window.removeEventListener('scroll', queuePlacement)
      window.visualViewport?.removeEventListener('resize', queuePlacement)
      window.visualViewport?.removeEventListener('scroll', queuePlacement)
    }
  }, [open, updatePlacement])

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
          if (!open) updatePlacement()
          setOpen((current) => !current)
        }}
        ref={triggerRef}
        type="button"
      >
        {selectedLabel}
        <span aria-hidden="true">⌄</span>
      </button>
      {open ? (
        <div aria-label={label} className="filter-select__options" data-above={placement.opensAbove || undefined} id={optionsId} role="group" style={{ maxHeight: placement.maxHeight }}>
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
