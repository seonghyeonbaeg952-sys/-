import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

import { classNames } from '../../utils/classNames'
import { hasImageSource } from '../../utils/imageFallback'
import {
  getSupabaseImageSrcSet,
  getStorageImageUrl,
  type SupabaseImageResize,
} from '../../utils/supabaseImage'

type ImageObjectFit = 'contain' | 'cover'
type ImageFallbackVariant =
  | 'default'
  | 'gallery'
  | 'hero'
  | 'logo'
  | 'poster'
  | 'profile'

type ImageTransform = {
  height?: number
  quality?: number
  resize?: SupabaseImageResize
  width?: number
  widths?: number[]
}

type ImageFailureState = {
  activeSourceIndex: number
  failedOriginalSrc: string
  failedTransformedSrc: string
  sourceCandidatesKey: string
}

type OptimizedImageProps = {
  alt?: string
  aspectRatio?: string
  children?: ReactNode
  className?: string
  decorative?: boolean
  fallbackLabel?: string
  fallbackSrcs?: string[]
  fallbackVariant?: ImageFallbackVariant
  imageClassName?: string
  loading?: 'eager' | 'lazy'
  objectFit?: ImageObjectFit
  onError?: () => void
  priority?: boolean
  sizes?: string
  src?: string | null
  transform?: ImageTransform
}

const fallbackLabels: Record<ImageFallbackVariant, string> = {
  default: 'SMYC',
  gallery: 'SMYC ARCHIVE',
  hero: 'SMYC',
  logo: 'SMYC',
  poster: 'CONCERT',
  profile: 'PROFILE',
}

function getFallbackTone(variant: ImageFallbackVariant) {
  if (variant === 'profile') {
    return 'from-blue-soft via-bg-ivory to-gold-soft/45'
  }

  if (variant === 'logo') {
    return 'from-bg-warm-white via-bg-ivory to-gold-soft/35'
  }

  if (variant === 'poster' || variant === 'hero') {
    return 'from-navy-midnight via-navy-deep to-navy-midnight'
  }

  return 'from-navy-midnight via-navy-deep to-gold-warm'
}

function getRenderedAlt(alt: string | undefined, decorative: boolean) {
  if (decorative) {
    return ''
  }

  return alt?.trim() || '서울모테트청소년합창단 이미지'
}

export function OptimizedImage({
  alt,
  aspectRatio,
  children,
  className,
  decorative = false,
  fallbackLabel,
  fallbackSrcs = [],
  fallbackVariant = 'default',
  imageClassName,
  loading,
  objectFit = 'cover',
  onError,
  priority = false,
  sizes,
  src,
  transform,
}: OptimizedImageProps) {
  const [failureState, setFailureState] = useState<ImageFailureState>({
    activeSourceIndex: 0,
    failedOriginalSrc: '',
    failedTransformedSrc: '',
    sourceCandidatesKey: '',
  })
  const sourceCandidates = useMemo(() => {
    return Array.from(
      new Set([src, ...fallbackSrcs].map((source) => source?.trim() ?? '').filter(Boolean)),
    )
  }, [fallbackSrcs, src])
  const sourceCandidatesKey = sourceCandidates.join('\n')
  const activeFailureState =
    failureState.sourceCandidatesKey === sourceCandidatesKey
      ? failureState
      : {
          activeSourceIndex: 0,
          failedOriginalSrc: '',
          failedTransformedSrc: '',
          sourceCandidatesKey,
        }
  const { activeSourceIndex, failedOriginalSrc, failedTransformedSrc } = activeFailureState
  const normalizedSrc = sourceCandidates[activeSourceIndex] ?? ''
  const transformedSrc = useMemo(() => {
    if (!normalizedSrc || !transform) {
      return normalizedSrc
    }

    return getStorageImageUrl(normalizedSrc, transform)
  }, [normalizedSrc, transform])
  const shouldUseOriginal =
    Boolean(failedTransformedSrc) &&
    failedTransformedSrc === transformedSrc &&
    transformedSrc !== normalizedSrc
  const shouldRenderImage =
    hasImageSource(normalizedSrc) && failedOriginalSrc !== normalizedSrc
  const renderedSrc = shouldUseOriginal ? normalizedSrc : transformedSrc
  const srcSet = useMemo(() => {
    if (!normalizedSrc || shouldUseOriginal || !transform?.widths) {
      return undefined
    }

    return getSupabaseImageSrcSet(normalizedSrc, transform.widths, {
      height: transform.height,
      quality: transform.quality,
      resize: transform.resize,
    })
  }, [normalizedSrc, shouldUseOriginal, transform])
  const style = {
    '--optimized-image-aspect-ratio': aspectRatio,
  } as CSSProperties
  const renderedLoading = priority ? 'eager' : loading ?? 'lazy'

  return (
    <div
      className={classNames(
        'relative overflow-hidden bg-linear-to-br',
        getFallbackTone(fallbackVariant),
        aspectRatio && 'aspect-[var(--optimized-image-aspect-ratio)]',
        className,
      )}
      style={style}
    >
      {shouldRenderImage ? (
        <img
          alt={getRenderedAlt(alt, decorative)}
          aria-hidden={decorative || undefined}
          className={classNames(
            'size-full',
            objectFit === 'contain' ? 'object-contain' : 'object-cover',
            imageClassName,
          )}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          loading={renderedLoading}
          onError={() => {
            if (renderedSrc !== normalizedSrc) {
              setFailureState({
                ...activeFailureState,
                failedTransformedSrc: renderedSrc,
              })
              return
            }

            if (activeSourceIndex < sourceCandidates.length - 1) {
              setFailureState({
                ...activeFailureState,
                activeSourceIndex: activeSourceIndex + 1,
                failedOriginalSrc: '',
                failedTransformedSrc: '',
              })
              return
            }

            setFailureState({
              ...activeFailureState,
              failedOriginalSrc: normalizedSrc,
            })
            onError?.()
          }}
          sizes={sizes}
          src={renderedSrc}
          srcSet={srcSet}
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-x-5 top-5 grid gap-1.5 opacity-40"
          >
            <span className="h-px bg-gold-soft" />
            <span className="h-px bg-gold-soft" />
            <span className="h-px bg-gold-soft" />
            <span className="h-px bg-gold-soft" />
            <span className="h-px bg-gold-soft" />
          </div>
          <div
            aria-hidden="true"
            className="absolute left-5 top-16 h-1 w-12 rounded-full bg-gold-warm/80"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-3/5 w-2/5 border-l border-t border-bg-warm-white/10 bg-bg-warm-white/[0.04] [clip-path:polygon(38%_0,100%_0,100%_100%,0_100%)]"
          />
          <div className="absolute inset-0 flex items-end p-5">
            <span className="rounded-pill border border-bg-warm-white/20 bg-bg-warm-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-gold-soft backdrop-blur-sm">
              {fallbackLabel || fallbackLabels[fallbackVariant]}
            </span>
          </div>
        </>
      )}
      {children}
    </div>
  )
}
