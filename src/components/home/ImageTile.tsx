import { useState, type ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { hasImageSource } from '../../utils/imageFallback'

type ImageTileProps = {
  alt: string
  children?: ReactNode
  className?: string
  imgClassName?: string
  loading?: 'eager' | 'lazy'
  src?: string
}

export function ImageTile({
  alt,
  children,
  className,
  imgClassName,
  loading = 'lazy',
  src,
}: ImageTileProps) {
  const [hasFailed, setHasFailed] = useState(false)
  const shouldRenderImage = hasImageSource(src) && !hasFailed

  return (
    <div
      className={classNames(
        'relative overflow-hidden bg-linear-to-br from-blue-soft via-bg-ivory to-gold-soft',
        className,
      )}
    >
      {shouldRenderImage ? (
        <img
          alt={alt}
          className={classNames('size-full object-cover', imgClassName)}
          decoding="async"
          loading={loading}
          onError={() => setHasFailed(true)}
          src={src}
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-br from-blue-soft via-bg-ivory to-gold-soft/70"
          />
          <div
            aria-hidden="true"
            className="absolute left-5 top-5 h-px w-14 bg-gold-warm/70"
          />
          <div className="absolute inset-0 flex items-end p-5">
            <span className="rounded-pill border border-bg-warm-white/70 bg-bg-warm-white/60 px-3 py-1 text-xs font-semibold text-navy-deep/70 backdrop-blur-sm">
              이미지 준비 중
            </span>
          </div>
        </>
      )}
      {children}
    </div>
  )
}
