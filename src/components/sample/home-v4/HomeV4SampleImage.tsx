import { useState } from 'react'

type HomeV4SampleImageProps = {
  alt: string
  className?: string
  fallbackLabel: string
  src: string
}

export function HomeV4SampleImage({
  alt,
  className = '',
  fallbackLabel,
  src,
}: HomeV4SampleImageProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        aria-label={fallbackLabel}
        className={`home-v4-image-fallback ${className}`.trim()}
        role="img"
      >
        <span aria-hidden="true">SMYC</span>
        <p>{fallbackLabel}</p>
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading="lazy"
      onError={() => setHasError(true)}
      src={src}
    />
  )
}
