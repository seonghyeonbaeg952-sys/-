import { useState, type ComponentProps } from 'react'
import { useSitePhoto } from './useSitePhoto'

// A plain img boundary retains the existing DOM, sizing and editorial layouts.
export function SiteImage(props: ComponentProps<'img'>) {
  const { src, alt = '', style, onError } = props
  const photo = useSitePhoto(src, alt)
  const [failedSource, setFailedSource] = useState('')
  const useOriginal = photo.overridden && failedSource === photo.src
  // Updating existing keys retains their order as well as their original values.
  // The unconfigured boundary therefore preserves the existing server markup.
  const imageProps: ComponentProps<'img'> & { 'data-site-photo'?: string } = { ...props,
    alt: useOriginal || !alt ? alt : photo.alt,
    src: (useOriginal ? src : photo.src) || undefined,
    style: photo.objectPosition && !useOriginal ? { ...style, objectPosition: photo.objectPosition } : style,
    'data-site-photo': photo.overridden ? photo.key : undefined,
    onError: event => {
      if (photo.overridden && !useOriginal) { setFailedSource(photo.src); return }
      onError?.(event)
    },
  }
  return <img {...imageProps} />
}
