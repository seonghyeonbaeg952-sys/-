import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { AdminEnglishContentForm } from './AdminEnglishContentForm'
import { isSampleContentResource } from '../../features/sample-language/sampleContentModel'
import { loadEnglishContentStates } from '../../features/sample-language/sampleContentApi'
import { filterPageEnglishRows, getPageEnglishStatus, type PageEnglishFilter } from '../../features/sample-language/sampleContentGuidance'

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
  editActionLabel?: string
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
  validateFields?: (payload: CmsMutationPayload) => Record<string, string | undefined>
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
  editActionLabel,
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
  validateFields,
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
  const [englishRow, setEnglishRow] = useState<CmsRowFor<TTable> | null>(null)
  const [englishFilter, setEnglishFilter] = useState<PageEnglishFilter>('all')
  const [englishReload, setEnglishReload] = useState(0)
  const [englishStates, setEnglishStates] = useState<{ signature: string; statuses: Record<string, 'draft' | 'published'>; error: string | null }>({ signature: '', statuses: {}, error: null })
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
    pageSize: 25,
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
  const englishResource = isSampleContentResource(table) ? table : undefined
  const englishIds = rows.map(row => row.id).sort().join(',')
  const englishSignature = `${table}:${englishIds}:${englishReload}`
  useEffect(() => {
    if (!englishResource) return
    let disposed = false
    void loadEnglishContentStates(englishResource, englishIds ? englishIds.split(',') : []).then(result => {
      if (!disposed) setEnglishStates({ signature: englishSignature, statuses: result.data ?? {}, error: result.error })
    })
    return () => { disposed = true }
  }, [englishResource, englishIds, englishSignature])
  const englishStatusesReady = englishStates.signature === englishSignature && !englishStates.error
  const englishPageCounts = englishResource && englishStatusesReady ? getPageEnglishStatus(rows, englishStates.statuses) : null
  const visibleRows = englishResource ? filterPageEnglishRows(rows, englishStatusesReady ? englishStates.statuses : null, englishFilter) : rows
  const languageColumns: Array<AdminTableColumn<CmsRowFor<TTable>>> = englishResource ? [...columns, {
    header: 'English', render: row => <span className="text-sm text-text-muted">{englishStates.signature !== englishSignature ? '확인 중' : englishStates.error ? '확인 불가' : englishStates.statuses[row.id] === 'published' ? '영문 게시본' : englishStates.statuses[row.id] === 'draft' ? '영문 초안' : '원본 사용'}</span>,
  }] : columns

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
      {isSampleContentResource(table) ? <p className="rounded-button border border-line-default bg-bg-warm-white p-4 text-sm leading-6 text-text-muted">새 항목은 한국어와 공통정보를 먼저 등록하세요. 목록의 ‘English 작성·수정’에서 영문 문구와 영문 이미지를 따로 임시저장·게시할 수 있습니다.</p> : null}
      {englishResource ? <div className="flex flex-wrap items-end justify-between gap-3 rounded-button border border-line-default bg-bg-warm-white p-4">
        <div>
          <label className="block text-sm font-semibold text-navy-deep" htmlFor="english-page-status-filter">현재 페이지 영문 상태</label>
          <select aria-label="현재 페이지 영문 상태" className="mt-2 min-h-11 min-w-52 rounded-button border border-line-default bg-bg-warm-white px-3 text-sm focus:border-gold-warm focus:outline-none focus:ring-2 focus:ring-gold-soft/60 disabled:opacity-60" disabled={!englishStatusesReady} id="english-page-status-filter" onChange={event => setEnglishFilter(event.target.value as PageEnglishFilter)} value={englishFilter}>
            <option value="all">전체</option><option value="missing">영문 버전 없음</option><option value="draft">영문 초안</option><option value="published">영문 게시본</option>
          </select>
        </div>
        {englishPageCounts ? <p className="text-sm leading-6 text-text-muted" role="status">현재 페이지 {englishPageCounts.total}개 · 영문 없음 {englishPageCounts.missing} · 초안 {englishPageCounts.draft} · 게시 {englishPageCounts.published}</p> : englishStates.signature !== englishSignature ? <p className="text-sm text-text-muted" role="status">영문 상태를 확인하는 중입니다.</p> : <div className="flex flex-wrap items-center gap-2"><p className="text-sm text-state-error" role="alert">영문 상태를 불러오지 못해 전체 항목을 표시합니다.</p><Button onClick={() => setEnglishReload(value => value + 1)} size="sm" variant="secondary">다시 시도</Button></div>}
      </div> : null}

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
        columns={languageColumns}
        editActionLabel={editActionLabel}
        emptyMessage={englishFilter !== 'all' && englishStatusesReady ? '현재 페이지에서 선택한 영문 상태의 항목이 없습니다. 다른 상태나 다음 페이지를 확인하세요.' : emptyMessage}
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
        onEditEnglish={isSampleContentResource(table) ? setEnglishRow : undefined}
        rows={visibleRows}
        showVisibility={showVisibility}
      />

      <AdminModal
        footer={null}
        isOpen={isFormOpen}
        onClose={requestCloseForm}
        title={editingRow ? editActionLabel ? `${title} 상세·처리` : `${title} 수정` : `${title} 추가`}
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
          validateFields={validateFields}
        />
      </AdminModal>
      {englishRow && isSampleContentResource(table) ? <AdminEnglishContentForm key={`${table}:${englishRow.id}`} resource={table} row={englishRow} onClose={() => { setEnglishRow(null); setEnglishReload(value => value + 1) }} onEditBase={table === 'members' ? () => { setEnglishRow(null); setEditingRow(englishRow); setFormError(null); setIsFormDirty(false); setIsFormOpen(true) } : undefined} /> : null}

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

      <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="목록 페이지">
        <p className="text-sm text-text-muted" role="status">{crud.isLoading ? '목록을 불러오는 중입니다.' : crud.error ? '목록을 확인할 수 없습니다.' : `${crud.pageIndex + 1}페이지 · ${visibleRows.length}개 표시 · 한 번에 최대 25개`}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { crud.reload(); setEnglishReload(value => value + 1) }} disabled={crud.isLoading || crud.isMutating}>목록 새로고침</Button>
          <Button variant="secondary" onClick={crud.previousPage} disabled={crud.isLoading || crud.isMutating || crud.pageIndex === 0}>이전</Button>
          <Button variant="secondary" onClick={crud.nextPage} disabled={crud.isLoading || crud.isMutating || !crud.hasNextPage}>다음</Button>
        </div>
      </nav>
    </div>
  )
}
