import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router'

import { OptimizedImage } from '../common/OptimizedImage'
import type { GalleryImage, Poster, VideoItem } from '../../types/content'
import { formatKoreanDate } from '../../utils/formatDate'
import { getGalleryCategoryLabel, getGalleryVideoLinks } from './galleryViewModel'

type GalleryViewerProps = {
  item: GalleryImage | Poster | VideoItem
  index: number
  count: number
  onClose: () => void
  onMove: (direction: 'next' | 'previous') => void
}

export function GalleryViewer({ item, index, count, onClose, onMove }: GalleryViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const backdropPress = useRef(false)
  const titleId = useId()
  const video = 'video_url' in item ? getGalleryVideoLinks(item.video_url) : null
  const date = 'taken_at' in item ? item.taken_at : 'concert_date' in item ? item.concert_date : undefined
  const description = 'description' in item ? item.description : ''
  const category = 'category' in item ? getGalleryCategoryLabel(item.category) : video ? '공연 영상' : '포스터'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const oldOverflow = document.body.style.overflow
    const oldPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${Number.parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('[data-gallery-close]')?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      document.body.style.overflow = oldOverflow
      document.body.style.paddingRight = oldPadding
      const target = returnFocus?.isConnected ? returnFocus : document.getElementById('main-content')
      target?.focus({ preventScroll: true })
    }
  }, [])

  function isBackdrop(event: { target: EventTarget; currentTarget: HTMLDialogElement; clientX: number; clientY: number }) {
    if (event.target !== event.currentTarget) return false
    const box = event.currentTarget.getBoundingClientRect()
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom
  }

  return (
    <dialog
      aria-labelledby={titleId}
      className="gallery-viewer"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (backdropPress.current && isBackdrop(event)) onClose(); backdropPress.current = false }}
      onKeyDown={event => {
        if (event.key === 'Tab') {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], iframe'))
          const first = controls[0], last = controls.at(-1)
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
        if (!video && count > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault()
          onMove(event.key === 'ArrowRight' ? 'next' : 'previous')
        }
      }}
      onPointerDown={event => { backdropPress.current = isBackdrop(event) }}
      ref={dialogRef}
    >
      <div className="gallery-viewer__layout">
        <header className="gallery-viewer__header">
          <h2 id={titleId}>{item.title}</h2>
          <button aria-label="확대보기 닫기" data-gallery-close onClick={onClose} type="button">닫기 <span aria-hidden="true">×</span></button>
        </header>
        {video ? (
          <div className="gallery-viewer__video">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              key={item.id}
              referrerPolicy="strict-origin-when-cross-origin"
              src={video.embed}
              title={`${item.title} 영상`}
            />
          </div>
        ) : 'image_url' in item ? (
          <OptimizedImage
            alt={'image_alt' in item ? item.image_alt : `${item.title} 포스터`}
            className="gallery-viewer__image"
            fallbackLabel="이미지를 불러올 수 없습니다"
            fallbackVariant="gallery"
            objectFit="contain"
            priority
            sizes="(min-width: 1536px) 1440px, calc(100vw - 96px)"
            src={item.image_url}
            transform={{ quality: 90, resize: 'contain', width: 2200, widths: [760, 1440, 2200] }}
          />
        ) : null}
        <div className="gallery-viewer__details">
          <p className="gallery-viewer__title">{item.title}</p>
          <p>{category}{date ? ` · ${formatKoreanDate(date)}` : ''}</p>
          {description ? <p className="gallery-viewer__description">{description}</p> : null}
          {'concert_id' in item && item.concert_id ? <Link to={`/concerts/${encodeURIComponent(item.concert_id)}`}>관련 공연 보기 <span aria-hidden="true">↗</span></Link> : null}
          {video ? <a href={video.external} rel="noreferrer noopener" target="_blank">YouTube에서 보기 <span aria-hidden="true">↗</span></a> : null}
        </div>
        {!video ? <nav aria-label="확대 자료 탐색" className="gallery-viewer__navigation">
          {count > 1 ? <button aria-label="이전 자료" onClick={() => onMove('previous')} type="button"><span aria-hidden="true">←</span> 이전</button> : <span />}
          <p aria-live="polite" aria-atomic="true">{index + 1} / {count}</p>
          {count > 1 ? <button aria-label="다음 자료" onClick={() => onMove('next')} type="button">다음 <span aria-hidden="true">→</span></button> : <span />}
        </nav> : null}
      </div>
    </dialog>
  )
}
