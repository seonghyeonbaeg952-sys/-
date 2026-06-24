import { useMemo, useState } from 'react'

import { getRecordTitle } from '../../lib/cms'
import { useCrudList } from '../../hooks/useCrudList'
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
import { AdminToolbar } from './AdminToolbar'
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
  searchColumn?: Extract<keyof CmsRowFor<TTable>, string>
  searchPlaceholder?: string
  table: TTable
  title: string
}

export function AdminCrudListPage<TTable extends CmsTableName>({
  canCreate = true,
  columns,
  defaultValues,
  deleteLabel,
  description,
  emptyMessage,
  fields,
  filters = [],
  info,
  order,
  preparePayload,
  searchColumn,
  searchPlaceholder,
  table,
  title,
}: AdminCrudListPageProps<TTable>) {
  const [searchValue, setSearchValue] = useState('')
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [editingRow, setEditingRow] = useState<CmsRowFor<TTable> | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CmsRowFor<TTable> | null>(null)

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
      searchColumn && searchValue
        ? { column: searchColumn, value: searchValue }
        : undefined,
    table,
  })

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingRow(null)
  }

  const handleSubmit = async (payload: CmsMutationPayload) => {
    const preparedPayload = preparePayload
      ? preparePayload(payload, editingRow)
      : payload

    const result = editingRow
      ? await crud.updateItem(editingRow.id, preparedPayload)
      : await crud.createItem(preparedPayload)

    if (!result.error) {
      closeForm()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) {
      return
    }

    const result = await crud.deleteItem(deleteTarget.id)

    if (!result.error) {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageTitle
        action={
          canCreate ? (
            <Button
              onClick={() => {
                setEditingRow(null)
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
        <Card className="border-gold-soft/60 bg-bg-warm-white p-5 text-sm leading-6 text-text-muted">
          {info}
        </Card>
      ) : null}

      {(searchColumn || filters.length > 0) ? (
        <AdminToolbar
          filters={filters.map((filter) => ({
            label: filter.label,
            onChange: (value) =>
              setFilterValues((current) => ({
                ...current,
                [filter.column]: value,
              })),
            options: [
              { label: filter.allLabel, value: '' },
              ...filter.options,
            ],
            value: filterValues[filter.column] ?? '',
          }))}
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
        onDelete={(row) => setDeleteTarget(row)}
        onEdit={(row) => {
          setEditingRow(row)
          setIsFormOpen(true)
        }}
        rows={crud.rows}
      />

      <AdminModal
        footer={null}
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingRow ? `${title} 수정` : `${title} 추가`}
      >
        {crud.error ? (
          <p className="mb-5 rounded-button bg-state-error/10 px-4 py-3 text-sm leading-6 text-state-error" role="alert">
            {crud.error}
          </p>
        ) : null}
        <AdminRecordForm
          defaultValues={defaultValues}
          disabled={crud.isMutating}
          fields={fields}
          initialData={editingRow}
          key={editingRow?.id ?? 'new'}
          onCancel={closeForm}
          onSubmit={handleSubmit}
        />
      </AdminModal>

      <DeleteConfirmDialog
        isDeleting={crud.isMutating}
        isOpen={Boolean(deleteTarget)}
        itemName={
          deleteTarget
            ? getRecordTitle(deleteTarget as CmsRecord, deleteLabel ?? title)
            : deleteLabel ?? title
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
