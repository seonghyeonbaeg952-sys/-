export type SupabaseImageResize = 'contain' | 'cover' | 'fill'

export type SupabaseImageTransformOptions = {
  height?: number
  quality?: number
  resize?: SupabaseImageResize
  width?: number
}

const PUBLIC_OBJECT_PATH = '/storage/v1/object/public/'
const PUBLIC_RENDER_PATH = '/storage/v1/render/image/public/'

function normalizeDimension(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return null
  }

  const normalizedValue = Math.trunc(value)

  return normalizedValue > 0 ? normalizedValue : null
}

function normalizeQuality(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return null
  }

  const normalizedValue = Math.trunc(value)

  return Math.min(100, Math.max(20, normalizedValue))
}

export function getSupabaseTransformedImageUrl(
  imageUrl: string,
  options: SupabaseImageTransformOptions,
) {
  const normalizedUrl = imageUrl.trim()

  if (!normalizedUrl) {
    return normalizedUrl
  }

  try {
    const parsedUrl = new URL(normalizedUrl, 'http://localhost')

    if (!parsedUrl.pathname.includes(PUBLIC_OBJECT_PATH)) {
      return normalizedUrl
    }

    parsedUrl.pathname = parsedUrl.pathname.replace(PUBLIC_OBJECT_PATH, PUBLIC_RENDER_PATH)

    const width = normalizeDimension(options.width)
    const height = normalizeDimension(options.height)
    const quality = normalizeQuality(options.quality)

    if (width) {
      parsedUrl.searchParams.set('width', String(width))
    }

    if (height) {
      parsedUrl.searchParams.set('height', String(height))
    }

    if (quality) {
      parsedUrl.searchParams.set('quality', String(quality))
    }

    if (options.resize) {
      parsedUrl.searchParams.set('resize', options.resize)
    }

    return parsedUrl.toString()
  } catch {
    return normalizedUrl
  }
}

export const getStorageImageUrl = getSupabaseTransformedImageUrl

export function getSupabaseImageSrcSet(
  imageUrl: string,
  widths: number[],
  options: Omit<SupabaseImageTransformOptions, 'width'> = {},
) {
  const srcSet = widths
    .map((width) => {
      const normalizedWidth = normalizeDimension(width)

      if (!normalizedWidth) {
        return null
      }

      const transformedUrl = getSupabaseTransformedImageUrl(imageUrl, {
        ...options,
        width: normalizedWidth,
      })

      return transformedUrl === imageUrl ? null : `${transformedUrl} ${normalizedWidth}w`
    })
    .filter((entry): entry is string => Boolean(entry))

  return srcSet.length > 0 ? srcSet.join(', ') : undefined
}
