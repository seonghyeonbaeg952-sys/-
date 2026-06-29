import type { ReactNode } from 'react'

import { OptimizedImage } from '../common/OptimizedImage'

type ImageTileProps = {
  alt: string
  children?: ReactNode
  className?: string
  fallbackVariant?: 'default' | 'gallery' | 'hero' | 'logo' | 'poster' | 'profile'
  imgClassName?: string
  loading?: 'eager' | 'lazy'
  objectFit?: 'contain' | 'cover'
  priority?: boolean
  sizes?: string
  src?: string
  transform?: {
    height?: number
    quality?: number
    resize?: 'contain' | 'cover' | 'fill'
    width?: number
    widths?: number[]
  }
}

export function ImageTile({
  alt,
  children,
  className,
  fallbackVariant = 'gallery',
  imgClassName,
  loading = 'lazy',
  objectFit = 'cover',
  priority = false,
  sizes,
  src,
  transform,
}: ImageTileProps) {
  return (
    <OptimizedImage
      alt={alt}
      className={className}
      fallbackVariant={fallbackVariant}
      imageClassName={imgClassName}
      loading={loading}
      objectFit={objectFit}
      priority={priority}
      sizes={sizes}
      src={src}
      transform={transform}
    >
      {children}
    </OptimizedImage>
  )
}
