import { useState } from 'react'

import { Card } from '../common/Card'
import { Button } from '../common/Button'
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
import { AdminEnglishContentForm } from './AdminEnglishContentForm'
import type { SampleContentResource } from '../../features/sample-language/sampleContentModel'

type AdminSingleRecordSectionProps<TTable extends CmsTableName> = {
  defaultValues?: CmsMutationPayload
  description?: string
  englishResource?: SampleContentResource
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
  englishResource,
  fields,
  preparePayload,
  table,
  title,
  validatePayload,
}: AdminSingleRecordSectionProps<TTable>) {
  const crud = useCrudItem(table)
  const [formError, setFormError] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [englishOpen, setEnglishOpen] = useState(false)

  useUnsavedChangesGuard({
    enabled: isFormDirty || crud.isMutating,
    message: crud.isMutating
      ? '저장 중입니다. 지금 이동하면 저장이 완료되지 않을 수 있습니다. 페이지를 이동할까요?'
      : undefined,
  })

  const handleSubmit = async (payload: CmsMutationPayload) => {
    crud.clearMutationFeedback()
    const preparedPayload = preparePayload ? preparePayload(payload, crud.item) : payload
    const validationError = validatePayload?.(preparedPayload, crud.item) ?? null

    if (validationError) {
      setFormError(validationError)
      return false
    }

    setFormError(null)
    const result = await crud.saveItem(preparedPayload)

    return !result.error
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-navy-deep">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
        ) : null}
        {englishResource ? <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button disabled={!crud.item || crud.isMutating || isFormDirty} onClick={() => setEnglishOpen(true)} variant="secondary">English 버전 작성·수정</Button>
          <p className="text-xs leading-5 text-text-muted">{!crud.item ? '한국어 원본을 먼저 저장하면 영문 버전을 작성할 수 있습니다.' : isFormDirty ? '한국어 변경을 먼저 저장하면 영문 편집을 열 수 있습니다.' : '영문 초안은 따로 저장하고 영어 버전에 게시합니다.'}</p>
        </div> : null}
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
        <AdminErrorState description={crud.loadError} action={<Button onClick={crud.reload} type="button">다시 불러오기</Button>} />
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
      {englishOpen && englishResource && crud.item ? <AdminEnglishContentForm key={`${englishResource}:${crud.item.id}`} onClose={() => setEnglishOpen(false)} resource={englishResource} row={crud.item} /> : null}
    </Card>
  )
}
