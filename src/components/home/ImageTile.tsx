import type { ReactNode } from 'react'

import { OptimizedImage } from '../common/OptimizedImage'

type ImageTileProps = {
  alt: string
  children?: ReactNode
  className?: string
  fallbackSrcs?: string[]
  fallbackVariant?: 'default' | 'gallery' | 'hero' | 'logo' | 'poster' | 'profile'
  height?: number
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
  width?: number
}

export function ImageTile({
  alt,
  children,
  className,
  fallbackSrcs,
  fallbackVariant = 'gallery',
  height,
  imgClassName,
  loading = 'lazy',
  objectFit = 'cover',
  priority = false,
  sizes,
  src,
  transform,
  width,
}: ImageTileProps) {
  return (
    <OptimizedImage
      alt={alt}
      className={className}
      fallbackSrcs={fallbackSrcs}
      fallbackVariant={fallbackVariant}
      height={height}
      imageClassName={imgClassName}
      loading={loading}
      objectFit={objectFit}
      priority={priority}
      sizes={sizes}
      src={src}
      transform={transform}
      width={width}
    >
      {children}
    </OptimizedImage>
  )
}
