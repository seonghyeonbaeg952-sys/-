import { useState } from 'react'

import { Card } from '../common/Card'
import { useCrudItem } from '../../hooks/useCrudItem'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import type {
  CmsMutationPayload,
  CmsRowFor,
  CmsTableName,
} from '../../types/cms'
import { AdminErrorState } from './AdminErrorState'
import { AdminLoadingState } from './AdminLoadingState'
import { AdminRecordForm, type AdminFieldConfig } from './AdminRecordForm'

type AdminSingleRecordSectionProps<TTable extends CmsTableName> = {
  defaultValues?: CmsMutationPayload
  description?: string
  fields: Array<AdminFieldConfig<CmsRowFor<TTable>>>
  preparePayload?: (
    payload: CmsMutationPayload,
    row: CmsRowFor<TTable> | null,
  ) => CmsMutationPayload
  validatePayload?: (
    payload: CmsMutationPayload,
    row: CmsRowFor<TTable> | null,
  ) => string | null
  table: TTable
  title: string
}

export function AdminSingleRecordSection<TTable extends CmsTableName>({
  defaultValues,
  description,
  fields,
  preparePayload,
  table,
  title,
  validatePayload,
}: AdminSingleRecordSectionProps<TTable>) {
  const crud = useCrudItem(table)
  const [formError, setFormError] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)

  useUnsavedChangesGuard({
    enabled: isFormDirty || crud.isMutating,
    message: crud.isMutating
      ? '저장 중입니다. 지금 이동하면 저장이 완료되지 않을 수 있습니다. 페이지를 이동할까요?'
      : undefined,
  })

  const handleSubmit = async (payload: CmsMutationPayload) => {
    crud.clearMutationError()
    const preparedPayload = preparePayload ? preparePayload(payload, crud.item) : payload
    const validationError = validatePayload?.(preparedPayload, crud.item) ?? null

    if (validationError) {
      setFormError(validationError)
      return false
    }

    setFormError(null)
    const result = await crud.saveItem(preparedPayload)

    if (!result.error) {
      setIsFormDirty(false)
    }

    return !result.error
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-deep">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        ) : null}
      </div>

      {crud.message ? (
        <p className="mb-5 rounded-button bg-state-success/10 px-4 py-3 text-sm text-state-success" role="status">
          {crud.message}
        </p>
      ) : null}
      {formError ? (
        <p className="mb-5 rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
          {formError}
        </p>
      ) : null}
      {crud.mutationError ? (
        <p className="mb-5 rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
          {crud.mutationError}
        </p>
      ) : null}

      {crud.isLoading ? <AdminLoadingState /> : null}
      {!crud.isLoading && crud.loadError ? (
        <AdminErrorState description={crud.loadError} />
      ) : null}
      {!crud.isLoading && !crud.loadError ? (
        <AdminRecordForm
          defaultValues={defaultValues}
          disabled={crud.isMutating}
          fields={fields}
          initialData={crud.item}
          key={crud.item?.id ?? 'new'}
          onDirtyChange={setIsFormDirty}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Card>
  )
}
