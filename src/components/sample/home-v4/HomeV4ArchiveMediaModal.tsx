import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

import type { HomeV4ArchiveMediaFixture } from '../../../pages/sample/home-v4/homeV4SignatureTypes'

type HomeV4ArchiveMediaModalProps = {
  media: HomeV4ArchiveMediaFixture
  onClose: () => void
  returnFocusElement: HTMLButtonElement | null
}

const focusableSelector = [
  'button:not([disabled])',
  'a[href]',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function HomeV4ArchiveMediaModal({
  media,
  onClose,
  returnFocusElement,
}: HomeV4ArchiveMediaModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      )

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
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      returnFocusElement?.focus()
    }
  }, [onClose, returnFocusElement])

  const portalTarget =
    document.querySelector<HTMLElement>(
      ".public-shell-home-sample-v4[data-design-candidate='home-v4']",
    ) ?? document.body

  return createPortal(
    <div
      className="home-v4-archive-modal"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="home-v4-archive-modal__dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="home-v4-archive-modal__heading">
          <div>
            <p>{media.kind.toUpperCase()} · ARCHIVE VIEW</p>
            <h2 id={titleId}>{media.title}</h2>
          </div>
          <button
            aria-label="미디어 보기 닫기"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div
          className={`home-v4-archive-modal__media home-v4-archive-modal__media--${media.kind}`}
        >
          {media.kind === 'video' ? (
            <iframe
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              src={media.mediaUrl}
              title={media.title}
            />
          ) : (
            <img alt={media.thumbnailAlt} src={media.mediaUrl} />
          )}
        </div>
        <p>{media.description}</p>
      </div>
    </div>,
    portalTarget,
  )
}
