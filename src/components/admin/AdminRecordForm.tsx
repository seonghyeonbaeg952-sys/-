import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { cleanPayload } from '../../lib/cms'
import type { CmsMutationPayload, CmsRecord, CmsValue } from '../../types/cms'
import { Button } from '../common/Button'
import { AdminFormField } from './AdminFormField'
import { ImageUploader } from './ImageUploader'
import { AdminSelect, type AdminSelectOption } from './AdminSelect'
import { AdminSwitch } from './AdminSwitch'
import { AdminTextarea } from './AdminTextarea'

export type AdminFieldType =
  | 'date'
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
  onSubmit: (payload: CmsMutationPayload) => Promise<void>
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
  onSubmit,
  submitLabel = '저장',
}: AdminRecordFormProps<TRow>) {
  const initialValues = useMemo(() => {
    return Object.fromEntries(
      fields.map((field) => [
        field.name,
        getInitialFieldValue(field, initialData, defaultValues),
      ]),
    ) as FormValues
  }, [defaultValues, fields, initialData])

  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  const setValue = (name: string, value: CmsValue) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const validate = () => {
    const nextErrors: FormErrors = {}

    for (const field of fields) {
      const value = values[field.name]

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
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!validate()) {
      return
    }

    const payload = cleanPayload(
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          normalizeInputValue(
            field as AdminFieldConfig<CmsRecord>,
            values[field.name],
          ),
        ]),
      ) as CmsMutationPayload,
    )

    await onSubmit(payload)
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.name]
          const commonProps = {
            description: field.description,
            disabled: disabled || field.readOnly,
            error: errors[field.name],
            id: field.name,
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
                  disabled={disabled || field.readOnly}
                  folder={field.folder ?? 'settings'}
                  label={field.label}
                  maxSizeMb={field.maxSizeMb}
                  onChange={(nextValue) => setValue(field.name, nextValue)}
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
                options={field.options ?? []}
                value={typeof value === 'string' ? value : ''}
              />
            )
          }

          if (field.type === 'switch') {
            return (
              <AdminSwitch
                checked={Boolean(value)}
                description={field.description}
                disabled={disabled || field.readOnly}
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
                  {signatureSrc ? (
                    <img
                      alt={`${field.label} 이미지`}
                      className="h-32 w-full rounded-button border border-line-default bg-bg-ivory object-contain"
                      src={signatureSrc}
                    />
                  ) : (
                    <p className="rounded-button border border-dashed border-line-default bg-bg-ivory px-4 py-8 text-center text-sm text-text-muted">
                      저장된 서명 이미지가 없습니다.
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

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button disabled={disabled} onClick={onCancel} variant="secondary">
            취소
          </Button>
        ) : null}
        <Button disabled={disabled} type="submit" variant="primary">
          {disabled ? '저장 중' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
