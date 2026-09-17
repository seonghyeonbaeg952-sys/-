import { FormattedCopy } from '../site-editor/FormattedCopy'
import { useSiteEditor } from '../site-editor/useSiteEditor'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import { FilterSelect } from '../common/FilterSelect'
import { usePageCopy } from '../site-editor/usePageCopy'

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
  const { copy: copyText } = useSiteEditor()
  const t = usePageCopy('concerts')
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
        aria-label={copyText("concerts", "concerts.fixed.ConcertFilterDrawer.62214504c1", "공연 필터 닫기")}
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
            <p className="concert-filter-drawer__eyebrow">{<FormattedCopy page="concerts" id="concerts.fixed.ConcertFilterDrawer.085d6ee60c" text={copyText("concerts", "concerts.fixed.ConcertFilterDrawer.085d6ee60c", "CONCERT FILTER")}>{copyText("concerts", "concerts.fixed.ConcertFilterDrawer.085d6ee60c", "CONCERT FILTER")}</FormattedCopy>}</p>
            <h2 id={titleId}>{<FormattedCopy page="concerts" id="concerts.filterTitle" text={t('filterTitle')}>{t('filterTitle')}</FormattedCopy>}</h2>
          </div>
          <button
            aria-label={t('close')}
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
            <span>{<FormattedCopy page="concerts" id="concerts.filterDate" text={t('filterDate')}>{t('filterDate')}</FormattedCopy>}</span>
            <FilterSelect
              label={t('dateFilter')}
              onChange={onYearChange}
              options={yearOptions}
              value={year}
            />
          </div>
          <div>
            <span>{<FormattedCopy page="concerts" id="concerts.categoryFilter" text={t('categoryFilter')}>{t('categoryFilter')}</FormattedCopy>}</span>
            <FilterSelect
              label={t('categoryFilter')}
              onChange={onCategoryChange}
              options={categoryOptions}
              value={category}
            />
          </div>
        </div>

        <div className="concert-filter-drawer__footer">
          <button className="concert-filter-drawer__reset" onClick={onReset} type="button">
            {<FormattedCopy page="concerts" id="concerts.reset" text={t('reset')}>{t('reset')}</FormattedCopy>}
          </button>
          <button
            className="concert-filter-drawer__apply"
            onClick={() => onCloseRef.current()}
            type="button"
          >
            {resultCount}{<FormattedCopy page="concerts" id="concerts.showResults" text={t('showResults')}>{t('showResults')}</FormattedCopy>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
