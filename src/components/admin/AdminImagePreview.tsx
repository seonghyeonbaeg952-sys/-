import { classNames } from '../../utils/classNames'
import { OptimizedImage } from '../common/OptimizedImage'

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
  return (
    <OptimizedImage
      alt={alt}
      className={classNames(
        'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-button border border-line-default bg-linear-to-br from-blue-soft via-bg-ivory to-gold-soft text-center text-[11px] font-semibold leading-4 text-text-muted shadow-sm',
        className,
      )}
      fallbackLabel="이미지 준비 중"
      fallbackVariant="profile"
      sizes="64px"
      src={src}
      transform={{
        quality: 70,
        resize: 'cover',
        width: 160,
      }}
    />
  )
}
