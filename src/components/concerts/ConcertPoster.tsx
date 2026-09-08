import { useEffect, useId, useRef, useState } from 'react'

type PosterProps = { src: string; title: string }

function PosterImage({ src, title, onExpand }: PosterProps & { onExpand?: () => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const image = (
    <img
      alt={`${title} 포스터`}
      className="concert-poster__image"
      decoding="async"
      key={attempt}
      onError={() => setStatus('error')}
      onLoad={() => setStatus('ready')}
      src={src}
    />
  )

  return (
    <div className={`concert-poster__media is-${status}`} aria-busy={status === 'loading'}>
      {status === 'loading' ? <p className="concert-poster__loading" role="status">포스터를 불러오는 중입니다.</p> : null}
      {status === 'error' ? (
        <div className="concert-poster__error">
          <p role="status">포스터를 불러오지 못했습니다.</p>
          <button
            className="concert-detail__button"
            onClick={() => { setAttempt(current => current + 1); setStatus('loading') }}
            type="button"
          >포스터 다시 불러오기</button>
        </div>
      ) : onExpand ? (
        <button aria-label={`${title} 포스터 확대`} aria-haspopup="dialog" className="concert-poster__image-button" onClick={onExpand} type="button">
          {image}
        </button>
      ) : image}
    </div>
  )
}

function PosterViewer({ src, title, onClose }: PosterProps & { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const backdropPress = useRef(false)
  const titleId = useId()
  const [zoomed, setZoomed] = useState(false)

  // Follow the gallery viewer's scroll lock and focus restoration contract.
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
    closeRef.current?.focus({ preventScroll: true })
    return () => {
      dialog.close()
      document.body.style.overflow = oldOverflow
      document.body.style.paddingRight = oldPadding
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
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
      className="concert-poster-viewer"
      onCancel={event => { event.preventDefault(); onClose() }}
      onClick={event => { if (backdropPress.current && isBackdrop(event)) onClose(); backdropPress.current = false }}
      onPointerDown={event => { backdropPress.current = isBackdrop(event) }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]'))
        const first = controls[0], last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }}
      ref={dialogRef}
    >
      <header className="concert-poster-viewer__header">
        <div><p>포스터 전체 보기</p><h2 id={titleId}>{title}</h2></div>
        <div className="concert-poster-viewer__controls">
          <button
            aria-pressed={zoomed}
            onClick={() => { setZoomed(current => !current); canvasRef.current?.scrollTo(0, 0) }}
            type="button"
          >{zoomed ? '화면에 맞추기' : '확대'}</button>
          <button aria-label="포스터 닫기" onClick={onClose} ref={closeRef} type="button">닫기 <span aria-hidden="true">×</span></button>
        </div>
      </header>
      <div aria-label="포스터 이미지" className={`concert-poster-viewer__canvas${zoomed ? ' is-zoomed' : ''}`} ref={canvasRef} role="region" tabIndex={0}>
        <PosterImage src={src} title={title} />
      </div>
      <p className="concert-poster-viewer__hint">확대 후 스크롤하여 포스터를 확인할 수 있습니다.</p>
    </dialog>
  )
}

export function ConcertPoster({ src, title }: PosterProps) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <figure className="concert-poster">
      <div className="concert-poster__thumbnail"><PosterImage onExpand={() => setIsOpen(true)} src={src} title={title} /></div>
      <figcaption>
        <button aria-haspopup="dialog" aria-label="포스터 크게 보기" className="concert-detail__button concert-poster__expand" onClick={() => setIsOpen(true)} type="button">
          포스터 크게 보기 <span aria-hidden="true">↗</span>
        </button>
      </figcaption>
      {isOpen ? <PosterViewer onClose={() => setIsOpen(false)} src={src} title={title} /> : null}
    </figure>
  )
}
