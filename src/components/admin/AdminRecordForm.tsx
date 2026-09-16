import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { cleanPayload } from '../../lib/cms'
import { isSignaturePng } from '../../lib/intakeModel'
import type { CmsMutationPayload, CmsRecord, CmsValue } from '../../types/cms'
import { Button } from '../common/Button'
import { AdminFormField } from './AdminFormField'
import { ImageUploader, type ImageUploadState } from './ImageUploader'
import { AdminSelect, type AdminSelectOption } from './AdminSelect'
import { AdminSwitch } from './AdminSwitch'
import { AdminTextarea } from './AdminTextarea'

export type AdminFieldType =
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'image'
  | 'number'
  | 'select'
  | 'signature'
  | 'switch'
  | 'text'
  | 'textarea'
  | 'url'

export type AdminFieldConfig<TRow extends CmsRecord> = {
  accept?: string
  allowManualUrl?: boolean
  allowSvg?: boolean
  description?: string
  folder?: string
  formatValue?: (value: CmsValue | undefined) => CmsValue | undefined
  label: string
  maxSizeMb?: number
  name: Extract<keyof TRow, string>
  options?: AdminSelectOption[]
  placeholder?: string
  readOnly?: boolean
  required?: boolean
  rows?: number
  type: AdminFieldType
}

type AdminRecordFormProps<TRow extends CmsRecord> = {
  defaultValues?: CmsMutationPayload
  disabled?: boolean
  fields: Array<AdminFieldConfig<TRow>>
  initialData?: Partial<TRow> | null
  onCancel?: () => void
  onDirtyChange?: (isDirty: boolean) => void
  onSubmit: (payload: CmsMutationPayload) => Promise<boolean>
  stickyActions?: boolean
  submitLabel?: string
}

type FormErrors = Record<string, string | undefined>
type FormValues = Record<string, CmsValue | undefined>

function getInitialFieldValue<TRow extends CmsRecord>(
  field: AdminFieldConfig<TRow>,
  initialData?: Partial<TRow> | null,
  defaultValues?: CmsMutationPayload,
): CmsValue | undefined {
  const initialValue = initialData?.[field.name]
  const defaultValue = defaultValues?.[field.name]
  const value = initialValue ?? defaultValue

  // Structured receipt snapshots are read-only details, not scalar form fields.
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) return ''

  if (field.formatValue) return field.formatValue(value)

  if (value !== undefined) {
    return value
  }

  if (field.type === 'switch') {
    return true
  }

  if (field.type === 'number') {
    return 0
  }

  return ''
}

function normalizeInputValue(
  field: AdminFieldConfig<CmsRecord>,
  value: CmsValue | undefined,
) {
  if (field.type === 'switch') {
    return Boolean(value)
  }

  if (field.type === 'number') {
    if (value === '' || value === undefined || value === null) {
      return null
    }

    return Number(value)
  }

  if (typeof value === 'string' && value.trim() === '' && !field.required) {
    return null
  }

  return value ?? null
}

export function AdminRecordForm<TRow extends CmsRecord>({
  defaultValues,
  disabled = false,
  fields,
  initialData,
  onCancel,
  onDirtyChange,
  onSubmit,
  stickyActions = false,
  submitLabel = '저장',
}: AdminRecordFormProps<TRow>) {
  const generatedId = useId().replaceAll(':', '')
  const initialValues = useMemo(() => {
    return Object.fromEntries(
      fields.map((field) => [
        field.name,
        getInitialFieldValue(field, initialData, defaultValues),
      ]),
    ) as FormValues
  }, [defaultValues, fields, initialData])

  const [values, setValues] = useState<FormValues>(initialValues)
  const [savedValues, setSavedValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadStates, setUploadStates] = useState<Record<string, ImageUploadState>>({})
  const uploadStatesRef = useRef<Record<string, ImageUploadState>>({})
  const submitLock = useRef(false)
  const valuesRef = useRef(values)
  const busy = disabled || isSubmitting
  const hasPendingImages = fields.some(field => ['selected', 'uploading', 'error'].includes(uploadStates[field.name]))
  const isDirty = useMemo(
    () =>
      hasPendingImages || fields.some(
        (field) => values[field.name] !== savedValues[field.name],
      ),
    [fields, hasPendingImages, savedValues, values],
  )

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const setValue = (name: string, value: CmsValue) => {
    valuesRef.current = { ...valuesRef.current, [name]: value }
    onDirtyChange?.(fields.some(field => valuesRef.current[field.name] !== savedValues[field.name]
      || ['selected', 'uploading', 'error'].includes(uploadStatesRef.current[field.name])))
    setValues(valuesRef.current)
    setErrors((current) => ({ ...current, [name]: undefined }))
    setSubmitError(null)
  }

  const updateUploadState = (name: string, state: ImageUploadState) => {
    uploadStatesRef.current = { ...uploadStatesRef.current, [name]: state }
    onDirtyChange?.(fields.some(field => valuesRef.current[field.name] !== savedValues[field.name]
      || ['selected', 'uploading', 'error'].includes(uploadStatesRef.current[field.name])))
    setUploadStates(uploadStatesRef.current)
    setSubmitError(null)
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    for (const field of fields) {
      const value = valuesRef.current[field.name]

      if (
        field.required &&
        (value === undefined ||
          value === null ||
          (typeof value === 'string' && value.trim() === ''))
      ) {
        nextErrors[field.name] = `${field.label}을(를) 입력해 주세요.`
      }
    }

    setErrors(nextErrors)

    const firstErrorField = fields.find(
      (field) => nextErrors[field.name],
    )

    if (firstErrorField) {
      window.requestAnimationFrame(() => {
        document
          .getElementById(`${generatedId}-${firstErrorField.name}`)
          ?.focus()
      })
    }

    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (disabled || submitLock.current) return
    if (fields.some(field => ['selected', 'uploading', 'error'].includes(uploadStatesRef.current[field.name]))) {
      setSubmitError('선택한 이미지의 업로드를 완료하거나 선택을 취소한 뒤 저장해 주세요.')
      return
    }

    if (!validate()) {
      return
    }

    submitLock.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    const snapshot = { ...valuesRef.current }
    const payload = cleanPayload(
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          normalizeInputValue(
            field as AdminFieldConfig<CmsRecord>,
            snapshot[field.name],
          ),
        ]),
      ) as CmsMutationPayload,
    )

    try {
      const didSave = await onSubmit(payload)
      if (didSave) setSavedValues(snapshot)
    } catch {
      setSubmitError('저장에 실패했습니다. 입력 내용은 유지됩니다. 연결을 확인하고 다시 시도해 주세요.')
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form aria-busy={busy} className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.name]
          const fieldId = `${generatedId}-${field.name}`
          const commonProps = {
            description: field.description,
            disabled: busy || field.readOnly,
            error: errors[field.name],
            id: fieldId,
            label: field.label,
            name: field.name,
            required: field.required,
          }

          if (field.type === 'textarea') {
            return (
              <div className="md:col-span-2" key={field.name}>
                <AdminTextarea
                  {...commonProps}
                  onChange={(event) => setValue(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 5}
                  value={typeof value === 'string' ? value : ''}
                />
              </div>
            )
          }

          if (field.type === 'image') {
            return (
              <div className="md:col-span-2" key={field.name}>
                <ImageUploader
                  accept={field.accept}
                  allowManualUrl={field.allowManualUrl}
                  allowSvg={field.allowSvg}
                  description={field.description}
                  disabled={busy || field.readOnly}
                  folder={field.folder ?? 'settings'}
                  id={fieldId}
                  label={field.label}
                  maxSizeMb={field.maxSizeMb}
                  onChange={(nextValue) => setValue(field.name, nextValue)}
                  onUploadStateChange={(state) => updateUploadState(field.name, state)}
                  required={field.required}
                  value={typeof value === 'string' ? value : null}
                />
                {errors[field.name] ? (
                  <p className="mt-2 text-sm text-state-error" role="alert">
                    {errors[field.name]}
                  </p>
                ) : null}
              </div>
            )
          }

          if (field.type === 'select') {
            return (
              <AdminSelect
                {...commonProps}
                key={field.name}
                onChange={(event) => setValue(field.name, event.target.value)}
                options={typeof value === 'string' && value && !field.options?.some(option => option.value === value)
                  ? [{ label: `기존 값: ${value}`, value }, ...(field.options ?? [])]
                  : field.options ?? []}
                value={typeof value === 'string' ? value : ''}
              />
            )
          }

          if (field.type === 'switch') {
            return (
              <AdminSwitch
                checked={Boolean(value)}
                description={field.description}
                disabled={busy || field.readOnly}
                id={fieldId}
                key={field.name}
                label={field.label}
                name={field.name}
                onChange={(checked) => setValue(field.name, checked)}
              />
            )
          }

          if (field.type === 'signature') {
            const signatureSrc = typeof value === 'string' ? value : ''

            return (
              <div className="md:col-span-2" key={field.name}>
                <div className="mb-2">
                  <span className="text-sm font-semibold text-navy-deep">
                    {field.label}
                  </span>
                  {field.description ? (
                    <p className="mt-1 text-xs leading-5 text-text-muted">
                      {field.description}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-formal border border-line-default bg-bg-warm-white p-4">
                  {signatureSrc && isSignaturePng(signatureSrc) ? (
                    <img
                      alt={`${field.label} 이미지`}
                      className="h-32 w-full rounded-button border border-line-default bg-bg-ivory object-contain"
                      src={signatureSrc}
                    />
                  ) : (
                    <p className="rounded-button border border-dashed border-line-default bg-bg-ivory px-4 py-8 text-center text-sm text-text-muted">
                      {signatureSrc ? '서명 형식을 확인할 수 없습니다. 원본 접수 자료를 확인해 주세요.' : '저장된 서명 이미지가 없습니다.'}
                    </p>
                  )}
                </div>
              </div>
            )
          }

          return (
            <AdminFormField
              {...commonProps}
              key={field.name}
              onChange={(event) =>
                setValue(
                  field.name,
                  field.type === 'number'
                    ? event.target.value === ''
                      ? ''
                      : Number(event.target.value)
                    : event.target.value,
                )
              }
              placeholder={field.placeholder}
              type={field.type}
              value={value === null || value === undefined ? '' : String(value)}
            />
          )
        })}
      </div>

      {hasPendingImages ? <p className="text-sm leading-6 text-text-muted" role="status">선택한 이미지의 업로드를 완료하거나 선택을 취소해야 저장할 수 있습니다.</p> : null}
      {submitError ? <p className="rounded-button bg-state-error/10 px-4 py-3 text-sm text-state-error" role="alert">{submitError}</p> : null}

      <div
        className={
          stickyActions
            ? 'sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-line-default bg-bg-warm-white/95 px-4 py-4 shadow-[0_-12px_24px_rgb(16_35_63/0.06)] backdrop-blur sm:-mx-5 sm:flex-row sm:justify-end sm:px-5'
            : 'flex flex-col gap-3 border-t border-line-default pt-5 sm:flex-row sm:justify-end'
        }
      >
        {onCancel ? (
          <Button disabled={busy} onClick={onCancel} variant="secondary">
            취소
          </Button>
        ) : null}
        <Button disabled={busy || hasPendingImages} type="submit" variant="primary">
          {busy ? '저장 중…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
