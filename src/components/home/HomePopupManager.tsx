import { useEffect, useMemo, useRef, useState } from 'react'

import type { PopupNotice } from '../../types/content'
import { Button } from '../common/Button'
import { OptimizedImage } from '../common/OptimizedImage'

type HomePopupManagerProps = {
  popups: PopupNotice[]
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function isPopupInDateRange(popup: PopupNotice, todayKey: string) {
  if (popup.starts_on && popup.starts_on > todayKey) {
    return false
  }

  if (popup.ends_on && popup.ends_on < todayKey) {
    return false
  }

  return true
}

function getDismissedTodayKey(popupId: string, todayKey: string) {
  return `smyc-home-popup-dismissed:${popupId}:${todayKey}`
}

function isDismissedToday(popupId: string, todayKey: string) {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(getDismissedTodayKey(popupId, todayKey)) === 'true'
  } catch {
    return false
  }
}

function dismissToday(popupId: string, todayKey: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(getDismissedTodayKey(popupId, todayKey), 'true')
  } catch {
    // localStorage가 차단된 환경에서는 현재 세션 닫기만 적용됩니다.
  }
}

export function HomePopupManager({ popups }: HomePopupManagerProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const todayKey = useMemo(() => getLocalDateKey(), [])
  const [closedPopupIds, setClosedPopupIds] = useState<Set<string>>(() => new Set())

  const activePopup = useMemo(() => {
    return [...popups]
      .filter((popup) => {
        return (
          popup.is_visible &&
          isPopupInDateRange(popup, todayKey) &&
          !closedPopupIds.has(popup.id) &&
          !isDismissedToday(popup.id, todayKey)
        )
      })
      .sort((first, second) => first.display_order - second.display_order)[0] ?? null
  }, [closedPopupIds, popups, todayKey])

  useEffect(() => {
    if (!activePopup) {
      return
    }

    closeButtonRef.current?.focus()
  }, [activePopup])

  useEffect(() => {
    if (!activePopup) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setClosedPopupIds((current) => new Set(current).add(activePopup.id))
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activePopup])

  if (!activePopup) {
    return null
  }

  const closePopup = () => {
    setClosedPopupIds((current) => new Set(current).add(activePopup.id))
  }

  const closeForToday = () => {
    dismissToday(activePopup.id, todayKey)
    closePopup()
  }

  return (
    <div
      aria-labelledby="home-popup-title"
      aria-modal="true"
      className="modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-navy-midnight/68 px-5 py-10 backdrop-blur-sm sm:py-12"
      role="dialog"
    >
      <div className="modal-panel relative max-h-[min(760px,calc(100svh-5rem))] w-full max-w-lg overflow-y-auto rounded-balanced border border-line-default bg-bg-warm-white shadow-[0_28px_90px_rgb(7_21_38/0.34)]">
        <button
          aria-label="팝업 닫기"
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-line-default bg-bg-warm-white/92 text-navy-deep shadow-sm transition hover:border-gold-warm hover:text-gold-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
          onClick={closePopup}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>

        {activePopup.image_url ? (
          <OptimizedImage
            alt={activePopup.image_alt}
            className="flex max-h-[38svh] w-full items-center justify-center bg-bg-ivory p-2 sm:max-h-[42vh] sm:p-3"
            fallbackVariant="poster"
            imageClassName="max-h-[calc(38svh-1rem)] max-w-full sm:max-h-[calc(42vh-1.5rem)]"
            loading="eager"
            objectFit="contain"
            priority
            sizes="(min-width: 768px) 512px, calc(100vw - 40px)"
            src={activePopup.image_url}
            transform={{
              quality: 78,
              resize: 'contain',
              width: 960,
              widths: [480, 720, 960, 1280],
            }}
          />
        ) : null}

        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-warm">
            NOTICE
          </p>
          <h2
            className="mt-3 break-keep text-xl font-bold leading-7 text-navy-deep sm:text-2xl sm:leading-8"
            id="home-popup-title"
          >
            {activePopup.title}
          </h2>
          {activePopup.content ? (
            <p className="mt-4 whitespace-pre-line break-keep text-sm leading-7 text-text-muted sm:text-base">
              {activePopup.content}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="min-h-11 rounded-pill px-4 text-sm font-semibold text-text-muted transition hover:bg-bg-ivory hover:text-navy-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm"
              onClick={closeForToday}
              type="button"
            >
              오늘 하루 보지 않기
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              {activePopup.button_label && activePopup.button_href ? (
                <Button href={activePopup.button_href} onClick={closePopup} variant="gold">
                  {activePopup.button_label}
                </Button>
              ) : null}
              <Button onClick={closePopup} variant="secondary">
                닫기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
