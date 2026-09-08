import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import { FilterSelect } from '../common/FilterSelect'

type FilterOption = {
  label: string
  value: string
}

type ConcertFilterDrawerProps = {
  category: string
  categoryOptions: FilterOption[]
  isOpen: boolean
  onCategoryChange: (value: string) => void
  onClose: () => void
  onReset: () => void
  onYearChange: (value: string) => void
  resultCount: number
  year: string
  yearOptions: FilterOption[]
}

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ConcertFilterDrawer({
  category,
  categoryOptions,
  isOpen,
  onCategoryChange,
  onClose,
  onReset,
  onYearChange,
  resultCount,
  year,
  yearOptions,
}: ConcertFilterDrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousActiveElement = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true')

      if (focusableElements.length === 0) {
        event.preventDefault()
        closeButtonRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousActiveElement?.focus()
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="concert-filter-drawer" role="presentation">
      <button
        aria-label="공연 필터 닫기"
        className="concert-filter-drawer__backdrop"
        onClick={() => onCloseRef.current()}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="concert-filter-drawer__dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="concert-filter-drawer__header">
          <div>
            <p className="concert-filter-drawer__eyebrow">CONCERT FILTER</p>
            <h2 id={titleId}>공연 필터</h2>
          </div>
          <button
            aria-label="닫기"
            className="concert-filter-drawer__close"
            onClick={() => onCloseRef.current()}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="concert-filter-drawer__fields">
          <div>
            <span>날짜</span>
            <FilterSelect
              label="날짜 선택"
              onChange={onYearChange}
              options={yearOptions}
              value={year}
            />
          </div>
          <div>
            <span>공연 유형</span>
            <FilterSelect
              label="공연 유형"
              onChange={onCategoryChange}
              options={categoryOptions}
              value={category}
            />
          </div>
        </div>

        <div className="concert-filter-drawer__footer">
          <button className="concert-filter-drawer__reset" onClick={onReset} type="button">
            초기화
          </button>
          <button
            className="concert-filter-drawer__apply"
            onClick={() => onCloseRef.current()}
            type="button"
          >
            {resultCount}개 공연 보기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
