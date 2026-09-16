import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  CmsResult,
  CmsRowFor,
  CmsTableName,
} from '../types/cms'
import { invalidatePublicDataCache } from './usePublicData'

type CrudListState<TTable extends CmsTableName> = {
  loadError: string | null
  mutationError: string | null
  isLoading: boolean
  isMutating: boolean
  message: string | null
  rows: Array<CmsRowFor<TTable>>
  hasNextPage: boolean
  loadedQuery: string
}

type UseCrudListOptions<TTable extends CmsTableName> = {
  filters?: Array<CmsFilterOption<TTable>>
  order?: CmsOrderOption<TTable>
  search?: CmsSearchOption<TTable>
  table: TTable
  pageSize?: number
}

export function useCrudList<TTable extends CmsTableName>({
  filters = [],
  order,
  search,
  table,
  pageSize,
}: UseCrudListOptions<TTable>) {
  const [reloadToken, setReloadToken] = useState(0)
  const mutationLock = useRef(false)
  const [state, setState] = useState<CrudListState<TTable>>({
    loadError: null,
    mutationError: null,
    isLoading: true,
    isMutating: false,
    message: null,
    rows: [],
    hasNextPage: false,
    loadedQuery: '',
  })

  const serializedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const serializedOrder = useMemo(() => JSON.stringify(order ?? null), [order])
  const serializedSearch = useMemo(() => JSON.stringify(search ?? null), [search])
  const size = pageSize === undefined ? undefined : Number.isFinite(pageSize) ? Math.max(1, Math.min(100, Math.floor(pageSize))) : 25
  const criteria = `${table}:${serializedFilters}:${serializedOrder}:${serializedSearch}:${size ?? 'all'}`
  const [pagination, setPagination] = useState({ criteria, index: 0 })
  const pageIndex = pagination.criteria === criteria ? pagination.index : 0
  const queryKey = `${criteria}:${pageIndex}`

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadRows() {
      setState((current) => ({
        ...current,
        loadError: null,
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
        range: size === undefined ? undefined : { offset: pageIndex * size, limit: size + 1 },
      }).catch(() => ({ data: null, error: '목록을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.' }))

      if (!isMounted) {
        return
      }
      if (!result.error && result.data?.length === 0 && pageIndex > 0) {
        setPagination({ criteria, index: pageIndex - 1 })
        return
      }

      setState((current) => ({
        ...current,
        loadError: result.error,
        isLoading: false,
        rows: size === undefined ? result.data ?? [] : (result.data ?? []).slice(0, size),
        hasNextPage: size !== undefined && (result.data?.length ?? 0) > size,
        loadedQuery: queryKey,
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
    size,
    pageIndex,
    criteria,
    queryKey,
  ])

  const mutate = useCallback(async <T,>(operation: () => Promise<CmsResult<T>>, message: string): Promise<CmsResult<T>> => {
    if (mutationLock.current) return { data: null, error: '처리 중입니다. 완료될 때까지 기다려 주세요.' }
    mutationLock.current = true
    setState(current => ({ ...current, mutationError: null, isMutating: true, message: null }))
    try {
      const result = await operation()
      const error = result.error ?? (result.data === null ? '처리 결과를 확인하지 못했습니다. 다시 확인해 주세요.' : null)
      setState(current => ({ ...current, mutationError: error, message: error ? null : message }))
      if (!error) { invalidatePublicDataCache(); reload() }
      return error ? { data: null, error } : result
    } catch {
      const error = '요청을 처리하지 못했습니다. 입력 내용은 유지됩니다. 연결을 확인하고 다시 시도해 주세요.'
      setState(current => ({ ...current, mutationError: error }))
      return { data: null, error }
    } finally {
      mutationLock.current = false
      setState(current => ({ ...current, isMutating: false }))
    }
  }, [reload])

  const createItem = useCallback((payload: CmsMutationPayload) => mutate(() => createRow(table, payload), '저장되었습니다.'), [mutate, table])
  const updateItem = useCallback((id: string, payload: CmsMutationPayload) => mutate(() => updateRow(table, id, payload), '수정되었습니다.'), [mutate, table])
  const deleteItem = useCallback((id: string) => mutate(() => deleteRow(table, id), '삭제되었습니다.'), [mutate, table])

  return {
    ...state,
    pageIndex,
    isLoading: state.isLoading || state.loadedQuery !== queryKey,
    hasNextPage: state.loadedQuery === queryKey && state.hasNextPage,
    nextPage: () => { if (!state.isLoading && state.loadedQuery === queryKey && state.hasNextPage) setPagination({ criteria, index: pageIndex + 1 }) },
    previousPage: () => { if (!state.isLoading && pageIndex > 0) setPagination({ criteria, index: pageIndex - 1 }) },
    error: state.loadError,
    createItem,
    deleteItem,
    reload,
    updateItem,
  }
}
