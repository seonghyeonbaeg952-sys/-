import type { ReactNode } from 'react'
import { useEffect } from 'react'

import { Button } from '../common/Button'
import { Card } from '../common/Card'

type AdminModalProps = {
  children: ReactNode
  footer?: ReactNode
  isOpen: boolean
  onClose: () => void
  title: string
}

export function AdminModal({
  children,
  footer,
  isOpen,
  onClose,
  title,
}: AdminModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-midnight/55 px-4 py-4 sm:py-8">
      <div className="flex min-h-full w-full max-w-3xl items-start sm:items-center">
        <Card
          aria-modal="true"
          className="flex max-h-[calc(100svh-2rem)] w-full flex-col overflow-hidden sm:max-h-[calc(100svh-4rem)]"
          radius="formal"
          role="dialog"
        >
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line-default px-5 py-4">
            <h2 className="text-xl font-semibold text-navy-deep">{title}</h2>
            <Button aria-label="닫기" onClick={onClose} size="sm" variant="ghost">
              ×
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 border-t border-line-default bg-bg-ivory px-5 py-4">
              {footer}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}
