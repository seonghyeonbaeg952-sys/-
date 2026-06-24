import { SUPABASE_SETUP_MESSAGE, getSupabaseClientSafe } from './auth'

export const DEFAULT_STORAGE_BUCKET = 'site-images'

export type StorageFolder =
  | 'hero'
  | 'settings'
  | 'conductor'
  | 'accompanist'
  | 'members'
  | 'concerts'
  | 'gallery'
  | 'posters'
  | 'notices'
  | 'history'
  | 'brand'

export type StorageActionResult<TData> =
  | { data: TData; error: null }
  | { data: null; error: string }

type UploadImageOptions = {
  allowSvg?: boolean
  bucketName?: string
  file: File
  folder: StorageFolder | string
  maxSizeMb?: number
}

type ValidateImageFileOptions = {
  allowSvg?: boolean
  maxSizeMb?: number
}

type UploadImageResult = {
  path: string
  publicUrl: string
}

const CONTENT_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

const SVG_MIME_TYPE = 'image/svg+xml'

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(error: unknown) {
  if (isRecord(error) && typeof error.message === 'string') {
    return error.message
  }

  return ''
}

function getErrorStatus(error: unknown) {
  if (!isRecord(error)) {
    return ''
  }

  const status = error.status
  const code = error.code

  if (typeof status === 'number') {
    return String(status)
  }

  if (typeof status === 'string') {
    return status
  }

  return typeof code === 'string' ? code : ''
}

function toStorageError(error: unknown, fallback: string) {
  const message = getErrorMessage(error)
  const status = getErrorStatus(error)
  const lowerMessage = message.toLowerCase()

  if (
    status === '401' ||
    status === '403' ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('policy') ||
    lowerMessage.includes('row-level security') ||
    lowerMessage.includes('rls')
  ) {
    return '이미지 처리에 실패했습니다. 관리자 권한 또는 Storage 정책을 확인해 주세요.'
  }

  if (
    lowerMessage.includes('bucket') ||
    lowerMessage.includes('not found') ||
    status === '404'
  ) {
    return 'Storage 버킷을 찾지 못했습니다. site-images 버킷 설정을 확인해 주세요.'
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch')
  ) {
    return 'Supabase Storage 연결에 실패했습니다. 네트워크와 환경변수를 확인해 주세요.'
  }

  return message || fallback
}

function getFileExtension(file: File) {
  const mimeExtension = MIME_EXTENSION_MAP[file.type]

  if (mimeExtension) {
    return mimeExtension
  }

  const extension = file.name.split('.').pop()?.toLowerCase()

  if (extension === 'jpeg') {
    return 'jpg'
  }

  if (
    extension === 'jpg' ||
    extension === 'png' ||
    extension === 'webp' ||
    extension === 'svg'
  ) {
    return extension
  }

  return ''
}

function getAllowedMimeTypes(allowSvg: boolean) {
  return allowSvg
    ? new Set([...CONTENT_IMAGE_MIME_TYPES, SVG_MIME_TYPE])
    : CONTENT_IMAGE_MIME_TYPES
}

function getAllowedExtensions(allowSvg: boolean) {
  return allowSvg
    ? new Set(['jpg', 'jpeg', 'png', 'webp', 'svg'])
    : new Set(['jpg', 'jpeg', 'png', 'webp'])
}

function createStorageFileName(file: File) {
  const extension = getFileExtension(file) || 'jpg'
  const randomId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `${Date.now()}-${randomId}.${extension}`
}

function normalizeFolder(folder: string) {
  return folder.trim().replace(/^\/+|\/+$/g, '')
}

export function validateImageFile(
  file: File,
  { allowSvg = false, maxSizeMb = allowSvg ? 2 : 5 }: ValidateImageFileOptions = {},
): StorageActionResult<true> {
  const allowedMimeTypes = getAllowedMimeTypes(allowSvg)
  const allowedExtensions = getAllowedExtensions(allowSvg)
  const extension = getFileExtension(file)
  const hasAllowedMimeType = file.type ? allowedMimeTypes.has(file.type) : false
  const hasAllowedExtension = extension ? allowedExtensions.has(extension) : false

  if (!hasAllowedMimeType && !hasAllowedExtension) {
    return {
      data: null,
      error: allowSvg
        ? 'jpg, png, webp, svg 형식의 이미지만 업로드할 수 있습니다.'
        : 'jpg, png, webp 형식의 이미지만 업로드할 수 있습니다.',
    }
  }

  if (!allowSvg && (file.type === SVG_MIME_TYPE || extension === 'svg')) {
    return {
      data: null,
      error: 'SVG는 브랜드 로고 업로드에만 사용할 수 있습니다.',
    }
  }

  const maxBytes = maxSizeMb * 1024 * 1024

  if (file.size > maxBytes) {
    return {
      data: null,
      error: `이미지 파일은 ${maxSizeMb}MB 이하만 업로드할 수 있습니다.`,
    }
  }

  return { data: true, error: null }
}

export function extractStoragePathFromPublicUrl(
  publicUrl: string,
  bucketName = DEFAULT_STORAGE_BUCKET,
) {
  try {
    const parsedUrl = new URL(publicUrl)
    const markers = [
      `/storage/v1/object/public/${bucketName}/`,
      `/storage/v1/render/image/public/${bucketName}/`,
    ]

    for (const marker of markers) {
      const markerIndex = parsedUrl.pathname.indexOf(marker)

      if (markerIndex >= 0) {
        return decodeURIComponent(
          parsedUrl.pathname.slice(markerIndex + marker.length),
        )
      }
    }

    return null
  } catch {
    return null
  }
}

export function getPublicImageUrl(
  path: string,
  bucketName = DEFAULT_STORAGE_BUCKET,
): StorageActionResult<string> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const { data } = clientResult.data.storage.from(bucketName).getPublicUrl(path)

  return { data: data.publicUrl, error: null }
}

export async function uploadImage({
  allowSvg = false,
  bucketName = DEFAULT_STORAGE_BUCKET,
  file,
  folder,
  maxSizeMb,
}: UploadImageOptions): Promise<StorageActionResult<UploadImageResult>> {
  const validationResult = validateImageFile(file, { allowSvg, maxSizeMb })

  if (!validationResult.data) {
    return { data: null, error: validationResult.error }
  }

  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const normalizedFolder = normalizeFolder(folder)
  const path = `${normalizedFolder}/${createStorageFileName(file)}`
  const { error } = await clientResult.data.storage.from(bucketName).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || undefined,
    upsert: false,
  })

  if (error) {
    return {
      data: null,
      error: toStorageError(error, '이미지 업로드에 실패했습니다. 다시 시도해 주세요.'),
    }
  }

  const publicUrlResult = getPublicImageUrl(path, bucketName)

  if (!publicUrlResult.data) {
    return {
      data: null,
      error: publicUrlResult.error ?? '업로드한 이미지 URL을 확인하지 못했습니다.',
    }
  }

  return { data: { path, publicUrl: publicUrlResult.data }, error: null }
}

export async function deleteImageByPath(
  pathOrPublicUrl: string,
  bucketName = DEFAULT_STORAGE_BUCKET,
): Promise<StorageActionResult<true>> {
  const clientResult = getSupabaseClientSafe()

  if (!clientResult.data) {
    return { data: null, error: clientResult.error ?? SUPABASE_SETUP_MESSAGE }
  }

  const storagePath =
    extractStoragePathFromPublicUrl(pathOrPublicUrl, bucketName) ?? pathOrPublicUrl

  if (!storagePath.trim()) {
    return { data: true, error: null }
  }

  const { error } = await clientResult.data.storage
    .from(bucketName)
    .remove([storagePath])

  if (error) {
    return {
      data: null,
      error: toStorageError(error, '이미지 삭제에 실패했습니다.'),
    }
  }

  return { data: true, error: null }
}
