import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'

import {
  uploadImage,
  validateImageFile,
  type StorageFolder,
} from '../../lib/storage'
import { classNames } from '../../utils/classNames'
import { hasImageSource } from '../../utils/imageFallback'
import { Button } from '../common/Button'

type ImageUploaderProps = {
  accept?: string
  allowManualUrl?: boolean
  allowSvg?: boolean
  description?: string
  disabled?: boolean
  folder: StorageFolder | string
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

function ImageUploaderPreview({ alt, src }: ImagePreviewProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const shouldShowImage = hasImageSource(src) && failedSrc !== src

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-card border border-line-default bg-linear-to-br from-blue-soft via-bg-ivory to-gold-soft shadow-sm">
      {shouldShowImage ? (
        <img
          alt={alt}
          className="size-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => setFailedSrc(src)}
          src={src}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center px-4 text-center text-sm font-semibold text-text-muted">
          <span className="mb-3 h-px w-14 bg-gold-warm/70" aria-hidden="true" />
          <span>이미지 미리보기</span>
          <span className="mt-1 text-xs font-normal">업로드 후 표시됩니다.</span>
        </div>
      )}
    </div>
  )
}

export function ImageUploader({
  accept,
  allowManualUrl = true,
  allowSvg = false,
  description,
  disabled = false,
  folder,
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
            'flex min-h-44 flex-col items-center justify-center rounded-card border border-dashed px-5 py-6 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-warm',
            isDragging
              ? 'border-gold-warm bg-gold-soft/20'
              : 'border-line-default bg-bg-warm-white hover:border-gold-warm',
            (disabled || isUploading) && 'cursor-not-allowed opacity-60',
          )}
          disabled={disabled || isUploading}
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
          {selectedFile ? (
            <span className="mt-3 max-w-full truncate rounded-pill bg-bg-ivory px-3 py-1 text-xs font-semibold text-navy-deep">
              {selectedFile.name}
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
