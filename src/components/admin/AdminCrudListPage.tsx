import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { getRecordTitle } from '../../lib/cms'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCrudList } from '../../hooks/useCrudList'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import type {
  CmsFilterOption,
  CmsOrderOption,
} from '../../lib/cms'
import type {
  CmsMutationPayload,
  CmsRecord,
  CmsRowFor,
  CmsTableName,
  CmsValue,
} from '../../types/cms'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { AdminModal } from './AdminModal'
import { AdminPageTitle } from './AdminPageTitle'
import { AdminRecordForm, type AdminFieldConfig } from './AdminRecordForm'
import { AdminTable, type AdminTableColumn } from './AdminTable'
import { AdminToolbar, type AdminToolbarFilter } from './AdminToolbar'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

type ListFilterConfig<TTable extends CmsTableName> = {
  allLabel: string
  column: Extract<keyof CmsRowFor<TTable>, string>
  label: string
  options: Array<{ label: string; value: string }>
}

function parseFilterValue(value: string): CmsValue {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return value
}

type AdminCrudListPageProps<TTable extends CmsTableName> = {
  canCreate?: boolean
  canDelete?: boolean
  columns: Array<AdminTableColumn<CmsRowFor<TTable>>>
  defaultValues?: CmsMutationPayload
  deleteLabel?: string
  description?: string
  emptyMessage?: string
  fields: Array<AdminFieldConfig<CmsRowFor<TTable>>>
  filters?: Array<ListFilterConfig<TTable>>
  info?: string
  order?: CmsOrderOption<TTable>
  preparePayload?: (
    payload: CmsMutationPayload,
    row: CmsRowFor<TTable> | null,
  ) => CmsMutationPayload
  prepareInitialData?: (row: CmsRowFor<TTable>) => Partial<CmsRowFor<TTable>>
  prepareRows?: (rows: Array<CmsRowFor<TTable>>) => Array<CmsRowFor<TTable>>
  renderBeforeForm?: (row: CmsRowFor<TTable>) => ReactNode
  searchColumn?: Extract<keyof CmsRowFor<TTable>, string>
  searchPlaceholder?: string
  showVisibility?: boolean
  table: TTable
  title: string
  toolbarFilters?: AdminToolbarFilter[]
  validatePayload?: (
    payload: CmsMutationPayload,
    row: CmsRowFor<TTable> | null,
  ) => string | null
}

export function AdminCrudListPage<TTable extends CmsTableName>({
  canCreate = true,
  canDelete = true,
  columns,
  defaultValues,
  deleteLabel,
  description,
  emptyMessage,
  fields,
  filters = [],
  info,
  order,
  prepareInitialData,
  preparePayload,
  prepareRows,
  renderBeforeForm,
  searchColumn,
  searchPlaceholder,
  showVisibility = true,
  table,
  title,
  toolbarFilters = [],
  validatePayload,
}: AdminCrudListPageProps<TTable>) {
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [editingRow, setEditingRow] = useState<CmsRowFor<TTable> | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CmsRowFor<TTable> | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const debouncedSearchValue = useDebouncedValue(searchValue.trim(), 300)

  const activeFilters = useMemo(() => {
    return filters
      .map<CmsFilterOption<TTable> | null>((filter) => {
        const value = filterValues[filter.column] ?? ''

        if (!value) {
          return null
        }

        return {
          column: filter.column,
          value: parseFilterValue(value),
        }
      })
      .filter((filter): filter is CmsFilterOption<TTable> => Boolean(filter))
  }, [filterValues, filters])

  const crud = useCrudList({
    filters: activeFilters,
    order,
    search:
      searchColumn && debouncedSearchValue
        ? { column: searchColumn, value: debouncedSearchValue }
        : undefined,
    table,
  })

  useUnsavedChangesGuard({
    enabled: isFormOpen && (isFormDirty || crud.isMutating),
    message: crud.isMutating
      ? '저장 중입니다. 지금 이동하면 저장이 완료되지 않을 수 있습니다. 페이지를 이동할까요?'
      : undefined,
  })

  const resetAndCloseForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingRow(null)
    setFormError(null)
    setIsFormDirty(false)
  }, [])

  const requestCloseForm = useCallback(() => {
    if (crud.isMutating) {
      return
    }

    if (
      isFormDirty &&
      !window.confirm(
        '저장하지 않은 변경사항이 있습니다. 편집을 종료할까요?',
      )
    ) {
      return
    }

    resetAndCloseForm()
  }, [crud.isMutating, isFormDirty, resetAndCloseForm])

  const formInitialData =
    editingRow && prepareInitialData ? prepareInitialData(editingRow) : editingRow
  const rows = useMemo(
    () => (prepareRows ? prepareRows(crud.rows) : crud.rows),
    [crud.rows, prepareRows],
  )

  const handleSubmit = async (payload: CmsMutationPayload) => {
    const preparedPayload = preparePayload
      ? preparePayload(payload, editingRow)
      : payload
    const validationError = validatePayload?.(preparedPayload, editingRow) ?? null

    if (validationError) {
      setFormError(validationError)
      return false
    }

    setFormError(null)
    const result = editingRow
      ? await crud.updateItem(editingRow.id, preparedPayload)
      : await crud.createItem(preparedPayload)

    if (result.error) {
      setFormError(result.error)
      return false
    }

    resetAndCloseForm()
    return true
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    const targetId = deleteTarget.id
    setDeleteError(null)
    const result = await crud.deleteItem(targetId)

    if (result.error) {
      setDeleteError(result.error)
      return
    }

    setDeleteTarget(null)
    setDeleteError(null)
  }

  const openDeleteDialog = (row: CmsRowFor<TTable>) => {
    setDeleteError(null)
    setDeleteTarget(row)
  }

  const closeDeleteDialog = () => {
    if (crud.isMutating) {
      return
    }

    setDeleteTarget(null)
    setDeleteError(null)
  }

  return (
    <div className="space-y-6">
      <AdminPageTitle
        action={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingRow(null)
                setFormError(null)
                setIsFormDirty(false)
                setIsFormOpen(true)
              }}
              variant="gold"
            >
              새 항목 추가
            </Button>
          ) : null
        }
        description={description}
        title={title}
      />

      {info ? (
        <Card className="whitespace-pre-line border-gold-soft/60 bg-bg-warm-white p-5 text-sm leading-6 text-text-muted">
          {info}
        </Card>
      ) : null}

      {(searchColumn || filters.length > 0 || toolbarFilters.length > 0) ? (
        <AdminToolbar
          filters={[
            ...filters.map((filter) => ({
              label: filter.label,
              onChange: (value: string) =>
                setFilterValues((current) => ({
                  ...current,
                  [filter.column]: value,
                })),
              options: [
                { label: filter.allLabel, value: '' },
                ...filter.options,
              ],
              value: filterValues[filter.column] ?? '',
            })),
            ...toolbarFilters,
          ]}
          onSearchChange={searchColumn ? setSearchValue : undefined}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
        />
      ) : null}

      {crud.message ? (
        <p className="rounded-button bg-state-success/10 px-4 py-3 text-sm text-state-success" role="status">
          {crud.message}
        </p>
      ) : null}

      <AdminTable
        columns={columns}
        emptyMessage={emptyMessage}
        error={crud.error}
        isDeleting={crud.isMutating}
        loading={crud.isLoading}
        onDelete={canDelete ? openDeleteDialog : undefined}
        onEdit={(row) => {
          setEditingRow(row)
          setFormError(null)
          setIsFormDirty(false)
          setIsFormOpen(true)
        }}
        rows={rows}
        showVisibility={showVisibility}
      />

      <AdminModal
        footer={null}
        isOpen={isFormOpen}
        onClose={requestCloseForm}
        title={editingRow ? `${title} 수정` : `${title} 추가`}
      >
        {formError ? (
          <p className="mb-5 rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
            {formError}
          </p>
        ) : null}
        {editingRow && renderBeforeForm ? (
          <div className="mb-5">{renderBeforeForm(editingRow)}</div>
        ) : null}
        <AdminRecordForm
          defaultValues={defaultValues}
          disabled={crud.isMutating}
          fields={fields}
          initialData={formInitialData}
          key={editingRow?.id ?? 'new'}
          onCancel={requestCloseForm}
          onDirtyChange={setIsFormDirty}
          onSubmit={handleSubmit}
          stickyActions
        />
      </AdminModal>

      <DeleteConfirmDialog
        error={deleteError}
        isDeleting={crud.isMutating}
        isOpen={Boolean(deleteTarget)}
        itemName={
          deleteTarget
            ? getRecordTitle(deleteTarget as CmsRecord, deleteLabel ?? title)
            : deleteLabel ?? title
        }
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  )
}
