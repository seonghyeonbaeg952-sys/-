import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  createRow,
  deleteRow,
  listRows,
  updateRow,
  type CmsFilterOption,
  type CmsOrderOption,
  type CmsSearchOption,
} from '../lib/cms'
import type {
  CmsMutationPayload,
  CmsRowFor,
  CmsTableName,
} from '../types/cms'

type CrudListState<TTable extends CmsTableName> = {
  error: string | null
  isLoading: boolean
  isMutating: boolean
  message: string | null
  rows: Array<CmsRowFor<TTable>>
}

type UseCrudListOptions<TTable extends CmsTableName> = {
  filters?: Array<CmsFilterOption<TTable>>
  order?: CmsOrderOption<TTable>
  search?: CmsSearchOption<TTable>
  table: TTable
}

export function useCrudList<TTable extends CmsTableName>({
  filters = [],
  order,
  search,
  table,
}: UseCrudListOptions<TTable>) {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<CrudListState<TTable>>({
    error: null,
    isLoading: true,
    isMutating: false,
    message: null,
    rows: [],
  })

  const serializedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const serializedOrder = useMemo(() => JSON.stringify(order ?? null), [order])
  const serializedSearch = useMemo(() => JSON.stringify(search ?? null), [search])

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setState((current) => ({
        ...current,
        error: null,
        isLoading: true,
      }))

      const parsedFilters = JSON.parse(serializedFilters) as Array<CmsFilterOption<TTable>>
      const parsedOrder = JSON.parse(serializedOrder) as CmsOrderOption<TTable> | null
      const parsedSearch = JSON.parse(serializedSearch) as CmsSearchOption<TTable> | null

      const result = await listRows({
        filters: parsedFilters,
        order: parsedOrder ?? undefined,
        search: parsedSearch ?? undefined,
        table,
      })

      if (!isMounted) {
        return
      }

      setState((current) => ({
        ...current,
        error: result.error,
        isLoading: false,
        rows: result.data ?? [],
      }))
    }

    void loadRows()

    return () => {
      isMounted = false
    }
  }, [
    reloadToken,
    serializedFilters,
    serializedOrder,
    serializedSearch,
    table,
  ])

  const createItem = useCallback(
    async (payload: CmsMutationPayload) => {
      setState((current) => ({
        ...current,
        error: null,
        isMutating: true,
        message: null,
      }))

      const result = await createRow(table, payload)

      setState((current) => ({
        ...current,
        error: result.error,
        isMutating: false,
        message: result.error ? null : '저장되었습니다.',
      }))

      if (!result.error) {
        reload()
      }

      return result
    },
    [reload, table],
  )

  const updateItem = useCallback(
    async (id: string, payload: CmsMutationPayload) => {
      setState((current) => ({
        ...current,
        error: null,
        isMutating: true,
        message: null,
      }))

      const result = await updateRow(table, id, payload)

      setState((current) => ({
        ...current,
        error: result.error,
        isMutating: false,
        message: result.error ? null : '수정되었습니다.',
      }))

      if (!result.error) {
        reload()
      }

      return result
    },
    [reload, table],
  )

  const deleteItem = useCallback(
    async (id: string) => {
      setState((current) => ({
        ...current,
        error: null,
        isMutating: true,
        message: null,
      }))

      const result = await deleteRow(table, id)

      setState((current) => ({
        ...current,
        error: result.error,
        isMutating: false,
        message: result.error ? null : '삭제되었습니다.',
      }))

      if (!result.error) {
        reload()
      }

      return result
    },
    [reload, table],
  )

  return {
    ...state,
    createItem,
    deleteItem,
    reload,
    updateItem,
  }
}
