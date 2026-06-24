import { useMemo, useState } from 'react'

import {
  BRANDS,
  type BrandKey,
} from '../../constants/brand'
import { classNames } from '../../utils/classNames'

type BrandLogoVariant = 'full' | 'symbol' | 'text'
type BrandLogoTheme = 'dark' | 'light'
type BrandLogoSize = 'sm' | 'md' | 'lg'

type BrandLogoProps = {
  brand?: BrandKey
  className?: string
  size?: BrandLogoSize
  theme?: BrandLogoTheme
  variant?: BrandLogoVariant
  withSurface?: boolean
}

const imageSizeClasses: Record<BrandKey, Record<BrandLogoSize, string>> = {
  smf: {
    sm: 'h-7 max-w-[150px]',
    md: 'h-8 max-w-[185px]',
    lg: 'h-9 max-w-[220px]',
  },
  smyc: {
    sm: 'h-8 max-w-[150px]',
    md: 'h-10 max-w-[210px]',
    lg: 'h-12 max-w-[260px]',
  },
}

const symbolSizeClasses: Record<BrandKey, Record<BrandLogoSize, string>> = {
  smf: {
    sm: 'h-7 max-w-[76px]',
    md: 'h-8 max-w-[88px]',
    lg: 'h-9 max-w-[104px]',
  },
  smyc: {
    sm: 'h-8 max-w-[92px]',
    md: 'h-10 max-w-[112px]',
    lg: 'h-12 max-w-[132px]',
  },
}

const textSizeClasses: Record<BrandLogoSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

function getImageCandidates(
  brandConfig: (typeof BRANDS)[BrandKey],
  variant: Exclude<BrandLogoVariant, 'text'>,
) {
  if (variant === 'symbol') {
    return [
      brandConfig.symbolTransparentPath,
      brandConfig.symbolPath,
      brandConfig.logoTransparentPath,
      brandConfig.logoPath,
    ]
  }

  return [brandConfig.logoTransparentPath, brandConfig.logoPath]
}

export function BrandLogo({
  brand = 'smyc',
  className,
  size = 'md',
  theme = 'light',
  variant = 'full',
  withSurface,
}: BrandLogoProps) {
  const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const brandConfig = BRANDS[brand]
  const imageCandidates = useMemo(
    () => (variant === 'text' ? [] : getImageCandidates(brandConfig, variant)),
    [brandConfig, variant],
  )
  const imagePath =
    imageCandidates.find((candidate) => !failedSources.has(candidate)) ?? null
  const isImageVariant = variant !== 'text' && Boolean(imagePath)
  const shouldUseSurface = Boolean(withSurface) && isImageVariant

  if (!isImageVariant) {
    return (
      <span
        className={classNames(
          'inline-flex min-w-0 flex-col leading-tight',
          theme === 'dark' ? 'text-bg-warm-white' : 'text-navy-deep',
          textSizeClasses[size],
          className,
        )}
      >
        <span className="truncate font-bold">{brandConfig.name}</span>
        <span
          className={classNames(
            'mt-0.5 truncate text-[0.68em] font-semibold uppercase tracking-[0.16em]',
            theme === 'dark' ? 'text-gold-soft' : 'text-gold-warm',
          )}
        >
          {brandConfig.nameEn}
        </span>
      </span>
    )
  }

  return (
    <span
      className={classNames(
        'inline-flex min-w-0 items-center',
        shouldUseSurface &&
          (theme === 'dark'
            ? 'rounded-[16px] border border-bg-warm-white/42 bg-bg-warm-white/90 px-2.5 py-1.5 shadow-[0_10px_30px_rgb(0_0_0/0.14)] backdrop-blur-sm sm:px-3'
            : 'rounded-[18px] border border-line-default/70 bg-bg-warm-white/82 px-2.5 py-1 shadow-[0_8px_18px_rgb(7_21_38/0.06)] backdrop-blur-sm sm:px-3'),
        className,
      )}
    >
      <img
        alt={brandConfig.alt}
        className={classNames(
          'block max-w-full w-auto object-contain',
          variant === 'symbol'
            ? symbolSizeClasses[brand][size]
            : imageSizeClasses[brand][size],
        )}
        decoding="async"
        loading="eager"
        onError={() => {
          if (!imagePath) {
            return
          }

          setFailedSources((current) => {
            if (current.has(imagePath)) {
              return current
            }

            const next = new Set(current)
            next.add(imagePath)
            return next
          })
        }}
        src={imagePath ?? undefined}
      />
    </span>
  )
}
