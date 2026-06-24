import { useState } from 'react'

import { classNames } from '../../utils/classNames'
import { hasImageSource } from '../../utils/imageFallback'

type AdminImagePreviewProps = {
  alt: string
  className?: string
  src?: string | null
}

export function AdminImagePreview({
  alt,
  className,
  src,
}: AdminImagePreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const shouldShowImage = hasImageSource(src) && failedSrc !== src

  return (
    <div
      className={classNames(
        'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-button border border-line-default bg-linear-to-br from-blue-soft via-bg-ivory to-gold-soft text-center text-[11px] font-semibold leading-4 text-text-muted shadow-sm',
        className,
      )}
    >
      {shouldShowImage ? (
        <img
          alt={alt}
          className="size-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => setFailedSrc(src)}
          src={src}
        />
      ) : (
        <span className="px-2">이미지 준비 중</span>
      )}
    </div>
  )
}
