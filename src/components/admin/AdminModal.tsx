import type { ReactNode } from 'react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '../common/Button'
import { Card } from '../common/Card'

type AdminModalProps = {
  children: ReactNode
  footer?: ReactNode
  isOpen: boolean
  onClose: () => void
  title: string
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function AdminModal({
  children,
  footer,
  isOpen,
  onClose,
  title,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
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
    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      const preferredField = dialogRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])',
      )
      const closeButton = dialogRef.current?.querySelector<HTMLButtonElement>(
        '[data-admin-modal-close]',
      )
      ;(preferredField ?? closeButton)?.focus()
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
        dialogRef.current
          .querySelector<HTMLButtonElement>('[data-admin-modal-close]')
          ?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previousActiveElement?.focus()
    }
  }, [isOpen])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-midnight/55 sm:p-6">
      <button
        aria-label="모달 닫기"
        className="absolute inset-0 cursor-default border-0 bg-transparent p-0"
        onClick={() => onCloseRef.current()}
        tabIndex={-1}
        type="button"
      />
      <div className="relative z-10 flex min-h-full items-end justify-center sm:items-center">
        <div className="w-full max-w-3xl" ref={dialogRef}>
          <Card
            aria-labelledby={titleId}
            aria-modal="true"
            className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[88dvh] sm:rounded-formal"
            radius="formal"
            role="dialog"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line-default bg-bg-warm-white px-4 py-3 sm:px-5 sm:py-4">
              <h2 className="min-w-0 text-lg font-semibold text-navy-deep sm:text-xl" id={titleId}>
                {title}
              </h2>
              <Button
                aria-label="닫기"
                className="size-11 shrink-0 px-0"
                data-admin-modal-close="true"
                onClick={() => onCloseRef.current()}
                showArrow={false}
                size="sm"
                variant="ghost"
              >
                <span aria-hidden="true" className="text-2xl leading-none">
                  ×
                </span>
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              {children}
            </div>
            {footer ? (
              <div className="shrink-0 border-t border-line-default bg-bg-ivory px-4 py-4 sm:px-5">
                {footer}
              </div>
            ) : null}
          </Card>
        </div>
      </div>
    </div>,
    document.body,
  )
}
