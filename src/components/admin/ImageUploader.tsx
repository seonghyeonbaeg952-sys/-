import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'

import {
  uploadImage,
  validateImageFile,
  type StorageFolder,
} from '../../lib/storage'
import { classNames } from '../../utils/classNames'
import { Button } from '../common/Button'
import { OptimizedImage } from '../common/OptimizedImage'

type ImageUploaderProps = {
  accept?: string
  allowManualUrl?: boolean
  allowSvg?: boolean
  description?: string
  disabled?: boolean
  folder: StorageFolder | string
  id?: string
  label?: string
  maxSizeMb?: number
  onChange: (url: string | null) => void
  required?: boolean
  value: string | null
}

type ImagePreviewProps = {
  alt: string
  src: string | null
}

type ImageUploadGuide = {
  maxSizeHint: string
  ratio: string
  resolution: string
}

const defaultUploadGuide: ImageUploadGuide = {
  maxSizeHint: '1MB 이하 권장',
  ratio: '용도에 맞는 비율',
  resolution: '긴 변 1600~2000px 권장',
}

function getImageUploadGuide(folder: string): ImageUploadGuide {
  const normalizedFolder = folder.trim().toLowerCase()

  if (normalizedFolder.includes('hero')) {
    return {
      maxSizeHint: '1MB 안팎 권장',
      ratio: '16:9 또는 21:9',
      resolution: '가로 5000px 이하 권장',
    }
  }

  if (normalizedFolder.includes('concert') || normalizedFolder.includes('poster')) {
    return {
      maxSizeHint: '1MB 이하 권장',
      ratio: '3:4 또는 포스터 비율',
      resolution: '1200x1600 이상 권장',
    }
  }

  if (
    normalizedFolder.includes('conductor') ||
    normalizedFolder.includes('accompanist') ||
    normalizedFolder.includes('member')
  ) {
    return {
      maxSizeHint: '700KB 이하 권장',
      ratio: '4:5',
      resolution: '1000x1250 권장',
    }
  }

  if (normalizedFolder.includes('gallery')) {
    return {
      maxSizeHint: '1MB 이하 권장',
      ratio: '자유 비율',
      resolution: '긴 변 1600~2000px 권장',
    }
  }

  return defaultUploadGuide
}

function ImageUploaderPreview({ alt, src }: ImagePreviewProps) {
  return (
    <OptimizedImage
      alt={alt}
      className="aspect-[16/10] rounded-balanced border border-line-default shadow-sm"
      fallbackVariant="gallery"
      sizes="(min-width: 1024px) 360px, calc(100vw - 40px)"
      src={src}
      transform={{
        quality: 74,
        resize: 'cover',
        width: 640,
        widths: [360, 520, 720],
      }}
    >
      {!src ? (
        <div className="flex size-full flex-col items-center justify-center px-4 text-center text-sm font-semibold text-text-muted">
          <span className="mb-3 h-px w-14 bg-gold-warm/70" aria-hidden="true" />
          <span>이미지 미리보기</span>
          <span className="mt-1 text-xs font-normal">업로드 후 표시됩니다.</span>
        </div>
      ) : null}
    </OptimizedImage>
  )
}

export function ImageUploader({
  accept,
  allowManualUrl = true,
  allowSvg = false,
  description,
  disabled = false,
  folder,
  id,
  label = '이미지',
  maxSizeMb,
  onChange,
  required = false,
  value,
}: ImageUploaderProps) {
  const generatedId = useId()
  const inputId = `${generatedId}-file`
  const manualInputId = `${generatedId}-manual-url`
  const descriptionId = description ? `${generatedId}-description` : undefined
  const errorId = `${generatedId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  const fileAccept =
    accept ??
    (allowSvg
      ? 'image/jpeg,image/png,image/webp,image/svg+xml'
      : 'image/jpeg,image/png,image/webp')
  const previewSource = previewUrl ?? value
  const isUploadDisabled = disabled || isUploading || !selectedFile
  const uploadGuide = getImageUploadGuide(folder)
  const selectedFileSizeMb = selectedFile
    ? selectedFile.size / (1024 * 1024)
    : 0
  const shouldWarnLargeFile = selectedFileSizeMb > 1 && !allowSvg

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    setPreviewUrl(null)
  }

  const handleFile = (file: File | undefined) => {
    setMessage(null)

    if (!file) {
      return
    }

    const validationResult = validateImageFile(file, {
      allowSvg,
      maxSizeMb,
    })

    if (!validationResult.data) {
      setSelectedFile(null)
      clearPreviewObjectUrl()
      setError(validationResult.error)
      return
    }

    clearPreviewObjectUrl()
    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
    setError(null)
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0])
    event.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      return
    }

    setIsUploading(true)
    setError(null)
    setMessage(null)

    const result = await uploadImage({
      allowSvg,
      file: selectedFile,
      folder,
      maxSizeMb,
    })

    setIsUploading(false)

    if (!result.data) {
      setError(result.error)
      return
    }

    onChange(result.data.publicUrl)
    setSelectedFile(null)
    clearPreviewObjectUrl()
    setMessage('이미지가 업로드되었습니다. 저장 버튼을 눌러 공개 화면에 반영해 주세요.')
  }

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (disabled || isUploading) {
      return
    }

    setIsDragging(false)
    handleFile(event.dataTransfer.files[0])
  }

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDropZoneKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div>
      <div className="mb-2">
        <span className="text-sm font-semibold text-navy-deep">
          {label}
          {required ? <span className="ml-1 text-state-error">*</span> : null}
        </span>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-text-muted" id={descriptionId}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
        <button
          aria-describedby={classNames(descriptionId, error ? errorId : undefined) || undefined}
          aria-label={`${label} 파일 선택`}
          className={classNames(
            'flex min-h-44 flex-col items-center justify-center rounded-formal border border-dashed px-5 py-6 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
            isDragging
              ? 'border-gold-warm bg-gold-soft/20'
              : 'border-line-default bg-bg-warm-white hover:border-gold-warm',
            (disabled || isUploading) && 'cursor-not-allowed opacity-60',
          )}
          disabled={disabled || isUploading}
          id={id}
          onClick={() => inputRef.current?.click()}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onKeyDown={handleDropZoneKeyDown}
          type="button"
        >
          <span className="text-sm font-semibold text-navy-deep">
            파일을 선택하거나 끌어 놓기
          </span>
          <span className="mt-2 text-xs leading-5 text-text-muted">
            {allowSvg ? 'jpg, png, webp, svg' : 'jpg, png, webp'} · 최대{' '}
            {maxSizeMb ?? (allowSvg ? 2 : 5)}MB
          </span>
          <span className="mt-1 text-xs leading-5 text-text-muted">
            업로드 후 저장 버튼을 눌러야 public 화면에 반영됩니다.
          </span>
          <span className="mt-3 rounded-button bg-bg-ivory px-3 py-2 text-xs leading-5 text-text-muted">
            권장: {uploadGuide.ratio} · {uploadGuide.resolution} ·{' '}
            {uploadGuide.maxSizeHint} · webp 권장
          </span>
          {selectedFile ? (
            <span className="mt-3 max-w-full truncate rounded-pill bg-bg-ivory px-3 py-1 text-xs font-semibold text-navy-deep">
              {selectedFile.name}
            </span>
          ) : null}
          {shouldWarnLargeFile ? (
            <span className="mt-2 rounded-button bg-gold-soft/35 px-3 py-2 text-xs leading-5 text-navy-deep">
              현재 파일은 {selectedFileSizeMb.toFixed(1)}MB입니다. 업로드 전 압축하면
              public 화면 로딩이 더 안정적입니다.
            </span>
          ) : null}
        </button>

        <ImageUploaderPreview
          alt={`${label} 미리보기`}
          src={previewSource}
        />
      </div>

      <input
        accept={fileAccept}
        className="sr-only"
        disabled={disabled || isUploading}
        id={inputId}
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          className="sm:w-auto"
          disabled={isUploadDisabled}
          onClick={handleUpload}
          variant="primary"
        >
          {isUploading ? '업로드 중' : '선택한 이미지 업로드'}
        </Button>
        <Button
          disabled={disabled || isUploading || !value}
          onClick={() => {
            onChange(null)
            setSelectedFile(null)
            clearPreviewObjectUrl()
            setMessage('이미지 URL이 제거되었습니다. 저장 버튼을 눌러 반영해 주세요.')
          }}
          variant="secondary"
        >
          이미지 URL 제거
        </Button>
      </div>

      {allowManualUrl ? (
        <div className="mt-4">
          <label
            className="text-xs font-semibold text-text-muted"
            htmlFor={manualInputId}
          >
            외부 이미지 URL 직접 입력
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-button border border-line-default bg-bg-warm-white px-4 text-sm outline-none transition focus:border-gold-warm focus:ring-2 focus:ring-gold-soft/60 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isUploading}
            id={manualInputId}
            onChange={(event) => onChange(event.target.value.trim() || null)}
            placeholder="https://..."
            type="url"
            value={value ?? ''}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-button bg-state-success/10 px-4 py-3 text-sm leading-6 text-state-success" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
